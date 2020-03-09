import * as express from "express";
import * as Status from "http-status-codes";

import { Redis } from "ioredis";

import { ApiError } from "../../api/util";
import { cache, cacheResult } from "../../middleware/cache";
import { asyncify } from "../../middleware/async";

import { V1DB } from "../db";

import { QuizDB } from "./db";
import { Question, isQuestionEdit } from "./models/question";

function isAnswerMap(obj: unknown): obj is { [key: string]: number } {
  return (
    typeof obj === "object" &&
    Object.keys(obj).every(k => typeof k === "string") &&
    Object.values(obj).every(v => typeof v === "number")
  );
}

export default function defineRoutes(
  db: V1DB,
  auth: express.RequestHandler,
  redis?: Redis
): express.Router {
  const quizdb = new QuizDB(db);

  function setupAuthenticated(authenticated: express.Router) {
    // Enable authentication
    authenticated.use(auth);

    authenticated.delete(
      "/:quizId/question/:questionId/",
      asyncify(async (req, res) => {
        const { quizId, questionId } = req.params;

        await quizdb.deleteQuestion(quizId, questionId);

        res.status(Status.OK).send({ message: "Deleted." });
      })
    );

    authenticated.put(
      "/:quizId/question/",
      asyncify(async (req, res) => {
        const { quizId } = req.params;

        await quizdb.addQuestion(quizId);

        res.status(Status.CREATED).send({ message: "Added." });
      })
    );

    authenticated.put(
      "/:quizId/question/:questionId/answer/",
      auth,
      asyncify(async (req, res) => {
        const { quizId, questionId } = req.params;

        await quizdb.addAnswer(quizId, questionId);

        res.status(Status.CREATED).send({ message: "Added." });
      })
    );

    authenticated.delete(
      "/:quizId/question/:questionId/answer/:answerId",
      asyncify(async (req, res) => {
        const { quizId, questionId, answerId } = req.params;

        const id = Number.parseInt(answerId);

        await quizdb.deleteAnswer(quizId, questionId, id);

        res.status(Status.CREATED).send({ message: "Added." });
      })
    );

    authenticated.get(
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

    authenticated.post(
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

    return authenticated;
  }

  function setupUnauthenticated(unauthenticated: express.Router) {
    unauthenticated.get(
      "/:quizId/question/:questionId/verify-answer/:answerId",
      cache(req => {
        const { quizId, questionId, answerId } = req.params;

        return `verifyAnswer(${quizId}, ${questionId}, ${answerId}})`;
      }),
      asyncify(async (req, res) => {
        const { quizId, questionId, answerId } = req.params;

        const id = Number.parseInt(answerId);

        if (Number.isNaN(id)) {
          return res
            .status(Status.BAD_REQUEST)
            .send({ message: "Invalid answer ID passed." });
        }

        const correct = await quizdb.isCorrect(quizId, questionId, id);

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
      })
    );

    unauthenticated.post(
      "/:quizId/verify",
      // TODO Cache
      asyncify(async (req, res) => {
        const { quizId } = req.params;

        const answers = req.body.answers;

        if (!isAnswerMap(answers)) {
          throw ApiError.invalidRequest(`Invalid answer map.`);
        }

        const stats = await quizdb.correctAnswers(quizId, answers);

        res.status(Status.OK).send({
          ...stats
        });
      })
    );

    unauthenticated.get(
      "/:id",
      cache(
        r => (r.params.id ? `quizById(${r.params.id})` : `quizById`),
        redis
      ),
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

    return unauthenticated;
  }

  const unauthenticated = setupUnauthenticated(express.Router());
  const authenticated = setupAuthenticated(express.Router());

  // This ensures the unauthenticated routes are handled first.
  unauthenticated.use(authenticated);

  return unauthenticated;
}
