import * as express from "express";
import * as Status from "http-status-codes";

import { Redis } from "ioredis";

import { cache, cacheResult } from "../../middleware/cache";
import { asyncify } from "../../middleware/async";

import { V1DB } from "../db";

import { QuizDB } from "./db";
import { Question, isQuestionEdit } from "./models/question";

export default function defineRoutes(db: V1DB, redis?: Redis): express.Router {
  const router = express.Router();

  const quizdb = new QuizDB(db);

  router.delete(
    "/:quizId/question/:questionId/",
    asyncify(async (req, res) => {
      const { quizId, questionId } = req.params;

      await quizdb.deleteQuestion(quizId, questionId);

      res.status(Status.OK).send({ message: "Deleted." });
    })
  );

  router.put(
    "/:quizId/question/",
    asyncify(async (req, res) => {
      const { quizId } = req.params;

      await quizdb.addQuestion(quizId);

      res.status(Status.CREATED).send({ message: "Added." });
    })
  );

  router.get(
    "/:quizId/question/:questionId/edit",
    asyncify(async (req, res) => {
      // TODO Authenticate

      const { quizId, questionId } = req.params;

      const question = await quizdb.getQuestion(quizId, questionId);

      if (question) {
        res.json(question.toDatastore());
      } else {
        return res
          .status(Status.NOT_FOUND)
          .send({ message: "Question not found. " });
      }
    })
  );

  router.post(
    "/:quizId/question/:questionId/edit",
    asyncify(async (req, res) => {
      // TODO Authenticate
      const { quizId, questionId } = req.params;
      const body = req.body as unknown;

      if (!isQuestionEdit(body)) {
        console.log("Attempted Bad Question Edit: ", body);
        return res
          .status(Status.BAD_REQUEST)
          .send({ message: "Not a valid question edit." });
      }

      const newQuestion = Question.fromJSON(questionId, body);

      const nanoseconds = await quizdb.updateQuestion(quizId, newQuestion);

      // TODO Remove
      console.log(`Updated in ${nanoseconds} nanoseconds!`);

      res.status(Status.OK).send({ nanoseconds });
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

      const question = await quizdb.getQuestion(quizId, questionId);

      if (question) {
        const correct = question.answers[Number.parseInt(answerId)].correct;

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

  return router;
}
