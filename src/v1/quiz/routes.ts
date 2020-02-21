import * as express from "express";
import * as Status from "http-status-codes";

import { Redis } from "ioredis";

import { cache, cacheResult } from "../../middleware/cache";
import { asyncify } from "../../middleware/async";

import { V1DB } from "../db";

import { QuizDB } from "./db";

export default function defineRoutes(db: V1DB, redis?: Redis): express.Router {
  const router = express.Router();

  const quizdb = new QuizDB(db);

  router.get(
    "/:id",
    cache(r => (r.params.id ? `quizById(${r.params.id})` : `quizById`), redis),
    asyncify(async (req, res) => {
      const { id } = req.params;

      const quiz = await quizdb.getQuiz(id);

      const cachedRes = cacheResult(res, redis);

      if (quiz) {
        cachedRes.send(Status.OK, quiz.toJSON());
      } else {
        cachedRes.send(Status.NOT_FOUND, { message: "Quiz does not exist!" });
      }
    })
  );

  router.get(
    "/:quizId/question/:questionId/verify-answer/:answerId",
    cache(req => {
      const { quizId, questionId, answerId } = req.params;

      return `verifyAnswer(${quizId}, ${questionId}, ${answerId}})`;
    }),
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
