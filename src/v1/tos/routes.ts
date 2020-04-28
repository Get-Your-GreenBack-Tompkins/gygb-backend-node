import * as express from "express";
import * as Status from "http-status-codes";

import { asyncify } from "../../middleware/async";

import { V1DB } from "../db";

import { ApiError } from "../../api/util";
import { ToSDB } from "./db";
import { ToS } from "./models/tos";

export default function defineRoutes(db: V1DB, auth: express.RequestHandler): express.Router {
  const router = express.Router();

  const tosdb = new ToSDB(db);

  router.post(
    "/:id/edit",
    auth,
    asyncify(async (req, res) => {
      const tosId = req.params.id;

      if (tosId !== "hotshot" && tosId !== "quiz") {
        throw ApiError.invalidRequest("Invalid ToS ID.");
      }

      if (!req.body) {
        throw ApiError.invalidRequest("No ToS Update Passed.");
      }

      const tos = ToS.fromJSON(req.body);

      await tosdb.updateToS(tos);

      res.status(Status.OK).send();
    })
  );

  router.get(
    "/edit",
    auth,
    asyncify(async (_, res) => {
      const quizToS = await tosdb.getToS("quiz");
      const hotshotToS = await tosdb.getToS("hotshot");

      res.status(Status.OK).send({
        quiz: quizToS.toDatastore(),
        hotshot: hotshotToS.toDatastore()
      });
    })
  );

  router.get(
    "/",
    asyncify(async (_, res) => {
      const quizToS = await tosdb.getToS("quiz");
      const hotshotToS = await tosdb.getToS("hotshot");

      res.status(Status.OK).send({
        quiz: quizToS,
        hotshot: hotshotToS
      });
    })
  );

  router.get(
    "/:id",
    asyncify(async (req, res) => {
      const tosId = req.params.id;

      if (tosId !== "hotshot" && tosId !== "quiz") {
        throw ApiError.invalidRequest("Invalid ToS ID.");
      }
      const tos = await tosdb.getToS(tosId);

      res.status(Status.OK).send(tos);
    })
  );

  return router;
}
