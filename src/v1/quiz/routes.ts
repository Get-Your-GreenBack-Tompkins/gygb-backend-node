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

  router.get(
    "/:quizId/question/:questionId/verify-answer/:answerId",
    asyncify(async (req, res) => {
      const { quizId, questionId, answerId } = req.params;

      const question = await quizdb.getQuestion(quizId, questionId, false);

      if (question) {
        const correct = question.correctAnswer === answerId;

        // TODO Allow the message to be dynamic.

        if (correct) {
          res.status(Status.OK).send({
            quizId,
            questionId,
            answerId,
            correct,
            message: "Congrats!"
          });
        } else {
          res.status(Status.OK).send({
            quizId,
            questionId,
            answerId,
            correct,
            message: "Whoops try again!"
          });
        }
      } else {
        res
          .status(Status.NOT_FOUND)
          .send({ message: "Question does not exist!" });
      }
    })
  );

  return router;
}
