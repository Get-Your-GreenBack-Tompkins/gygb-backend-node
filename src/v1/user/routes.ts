import * as express from "express";
import * as Status from "http-status-codes";

import isEmail from "validator/lib/isEmail";

import { Redis } from "ioredis";

import { asyncify } from "../../middleware/async";

import { V1DB } from "../db";

import { UserDB } from "./db";
import { UserSource } from "./models/user";

function hasEmail(x: unknown): x is { email: string } {
  const asEmail = x as { email: string };

  return (
    typeof x === "object" &&
    "email" in asEmail &&
    typeof asEmail.email === "string"
  );
}

function hasMarketing(x: unknown): x is { marketing: boolean } {
  const asMarketing = x as { marketing: boolean };

  return (
    typeof x === "object" &&
    "marketing" in asMarketing &&
    typeof asMarketing.marketing === "boolean"
  );
}

function hasSource(x: unknown): x is { source: UserSource } {
  const asUS = x as { source: UserSource };

  return (
    typeof x === "object" &&
    "source" in asUS &&
    typeof asUS.source === "string" &&
    (asUS.source === UserSource.IOS || asUS.source === UserSource.WEB)
  );
}

export default function defineRoutes(
  db: V1DB,
  auth: express.RequestHandler,
  _?: Redis
): express.Router {
  const router = express.Router();

  const userdb = new UserDB(db);

  router.get(
    "/emails/marketing",
    auth,
    asyncify(async (_, res) => {
      const users = await userdb.getEmailList();

      res.status(Status.OK).send({ emailList: users.map(u => u.email) });
    })
  );

  router.get(
    "/",
    asyncify(async (req, res) => {
      const { query } = req;

      if (!hasEmail(query)) {
        return res.status(Status.BAD_REQUEST).send({ message: "Bad Request" });
      }

      const user = await userdb.getUser(query.email);

      if (user) {
        res.status(Status.OK).send(user.toJSON());
      } else {
        res.status(Status.NOT_FOUND).send({ message: "User not found." });
      }
    })
  );

  router.post(
    "/",
    asyncify(async (req, res) => {
      const { body } = req;

      if (!hasEmail(body) || !hasMarketing(body) || !hasSource(body)) {
        return res.status(Status.BAD_REQUEST).send({ message: "Bad Request" });
      }

      const { marketing, email, source } = body;

      if (!isEmail(email)) {
        return res
          .status(Status.BAD_REQUEST)
          .send({ message: "Invalid Email" });
      }

      const user = await userdb.getUser(body.email);

      if (!user) {
        const created = await userdb.createUser({
          marketingConsent: marketing,
          email,
          sources: [source],
          // TODO Obtain photography consent
          photoConsent: false
        });

        return res.status(Status.OK).send(created.toJSON());
      } else {
        return res
          .status(Status.BAD_REQUEST)
          .send({ message: "User already exists." });
      }
    })
  );

  return router;
}
