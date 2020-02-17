import * as express from "express";
import * as Status from "http-status-codes";

import { asyncify } from "../../middleware/async";

import { V1DB } from "../db";

import { QuizDB } from "./db";

export default function defineRoutes(db: V1DB): express.Router {
  const router = express.Router();

  const quizdb = new QuizDB(db);

  router.get(
    "/:id",
    asyncify(async (req, res) => {
      const { id } = req.params;

      const quiz = await quizdb.getQuiz(id);

      if (quiz) {
        res.status(Status.OK).send(quiz.toJSON());
      } else {
        res.status(Status.NOT_FOUND).send({ message: "Quiz does not exist!" });
      }
    })
  );

  return router;
}
