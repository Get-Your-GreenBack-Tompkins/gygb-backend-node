import * as express from "express";
import * as Status from "http-status-codes";

import { asyncify } from "../../middleware/async";

import { AuthDB } from "../../middleware/auth/db";

function hasEmail(x: unknown): x is { email: string } {
  const asEmail = x as { email: string };

  return typeof x === "object" && "email" in asEmail && typeof asEmail.email === "string";
}

export default async function defineRoutes(auth: express.RequestHandler): Promise<express.Router> {
  const router = express.Router();

  router.use(auth);

  const authdb = new AuthDB();

  router.get(
    "/list",
    asyncify(async (_, res) => {
      const admins = await authdb.getAdmins();

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

      res.status(Status.OK).send({ message: "Success." });
    })
  );

  return router;
}
