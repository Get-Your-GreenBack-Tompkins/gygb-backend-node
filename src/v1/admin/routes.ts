import * as express from "express";
import * as Status from "http-status-codes";

import { asyncify } from "../../middleware/async";

import { AuthDB } from "../../middleware/auth/db";
import cors, { CorsOptions } from "cors";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { auth } from "firebase-admin";

function hasEmail(x: unknown): x is { email: string } {
  const asEmail = x as { email: string };

  return typeof x === "object" && "email" in asEmail && typeof asEmail.email === "string";
}

export default async function defineRoutes(auth: auth.Auth, middleware: express.RequestHandler, corsOptions: CorsOptions): Promise<express.Router> {
  const router = express.Router();

  router.options("*", cors(corsOptions));
  router.use(cors(corsOptions));

  router.use(middleware);

  const authdb = new AuthDB(auth);

  router.get(
    "/list",
    asyncify(async (req, res) => {
      const admins = await authdb.getAdmins();

      if (req.timedOut || res.timedOut) {
        return;
      }

      res.status(Status.OK).send({ admins });
    })
  );

  router.put(
    "/",
    asyncify(async (req, res) => {
      const { query } = req;

      if (!hasEmail(query)) {
        return res.status(Status.BAD_REQUEST).send({ message: "Bad Request" });
      }

      await authdb.addAdmin(query.email);

      if (req.timedOut || res.timedOut) {
        return;
      }

      res.status(Status.OK).send({ message: "Success." });
    })
  );

  router.delete(
    "/",
    asyncify(async (req, res) => {
      const { query } = req;

      if (!hasEmail(query)) {
        return res.status(Status.BAD_REQUEST).send({ message: "Bad Request" });
      }

      await authdb.removeAdmin(query.email);

      if (req.timedOut || res.timedOut) {
        return;
      }

      res.status(Status.OK).send({ message: "Success." });
    })
  );

  return router;
}
