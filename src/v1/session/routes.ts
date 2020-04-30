import * as express from "express";
import * as Status from "http-status-codes";

import { asyncify } from "../../middleware/async";

import { V1DB } from "../db";

import { SessionDB } from "./db";

export default function defineRoutes(db: V1DB, auth: express.RequestHandler): express.Router {
  const router = express.Router();

  const sessiondb = new SessionDB(db);

  router.post(
    "/create",
    asyncify(async (req, res) => {
      const { body } = req;

      const created = await sessiondb.createSession({ ...body, startTime: new Date(body.startTime) });

      if (created) {
        res.status(Status.OK).send(created.id);
      } else {
        res.send(Status.BAD_REQUEST);
      }
    })
  );

  router.post(
    "/update",
    asyncify(async (req, res) => {
      const { body } = req;

      const updated = await sessiondb.updateSession({ ...body, endTime: new Date(body.endTime) });

      if (updated) {
        res.send(Status.OK);
      } else {
        res.send(Status.BAD_REQUEST);
      }
    })
  );

  return router;
}
