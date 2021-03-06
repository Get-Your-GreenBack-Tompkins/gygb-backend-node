import * as express from "express";
import * as Status from "http-status-codes";

import { ApiError } from "../../api/util";
import { asyncify } from "../../middleware/async";
import { secureRandomNumber } from "../../lib/random";

import { V1DB } from "../db";

import { registerQuizDB } from "./db";
import { Question, isQuestionEdit } from "./models/question";
import { Quiz, isQuizEdit } from "./models/quiz";
import cors, { CorsOptions } from "cors";

function isAnswerMap(obj: unknown): obj is { [key: string]: number } {
  return (
    typeof obj === "object" &&
    Object.keys(obj).every(k => typeof k === "string") &&
    Object.values(obj).every(v => typeof v === "number")
  );
}

export default async function defineRoutes(
  db: V1DB,
  corsOptions: CorsOptions,
  auth: express.RequestHandler
): Promise<express.Router> {
  const quizdb = registerQuizDB(db, "web-client");

  await quizdb.migrate(db);

  try {
    await quizdb.listen();
  } catch (error) {
    console.error(error);
  }

  function setupAuthenticated(authenticated: express.Router) {
    authenticated.options("*", cors(corsOptions));
    authenticated.use(cors(corsOptions));

    // Enable authentication
    authenticated.use(auth);

    authenticated.get(
      "/web-client/edit",
      asyncify(async (_, res) => {
        const quiz = await quizdb.getQuizNoCache();

        if (quiz) {
          const json = quiz.toJSON();
          res.status(Status.OK).json({
            ...json,
            tutorial: quiz.tutorial.toDatastore()
          });
        } else {
          res
            .status(Status.NOT_FOUND)
            .send({ message: "Quiz does not exist!" });
        }
      })
    );

    authenticated.post(
      "/web-client/edit",
      asyncify(async (req, res) => {
        const edit = req.body;

        if (!isQuizEdit(edit)) {
          throw ApiError.invalidRequest("Not a valid quiz edit.");
        }
        console.log(req.body);
        const quiz = Quiz.fromJSON("web-client", req.body);

        const nanoseconds = await quizdb.updateQuiz(quiz);

        // TODO Remove
        console.log(`Updated quiz ${nanoseconds} nanoseconds!`);

        res.status(Status.OK).send({ nanoseconds });
      })
    );

    authenticated.put(
      "/web-client/raffle",
      asyncify(async (req, res) => {
        const { prize, questionRequirement } = req.body;

        if (!prize || !questionRequirement) {
          throw ApiError.invalidRequest("Invalid raffle request body.");
        }

        const id = await quizdb.newRaffle(prize, questionRequirement);

        res.status(Status.OK).send({ id });
      })
    );

    authenticated.get(
      "/web-client/raffle/list",
      asyncify(async (_, res) => {
        const raffles = await quizdb.getRafflesNoCache();

        res
          .status(Status.OK)
          .send({ raffles: raffles.map(r => r.toAuthenticatedJSON()) });
      })
    );

    authenticated.get(
      "/web-client/raffle/winner",
      asyncify(async (req, res) => {
        const raffle = await quizdb.getCurrentRaffle(false, false);

        if (!raffle) {
          throw ApiError.notFound("No raffle currently.");
        }

        const entrants = await quizdb.getRaffleEntrants();

        if (entrants.length === 0) {
          throw ApiError.internalError("Not enough entrants to find a winner!");
        }

        const numOfEntrants = entrants.length;

        const winnerIndex =
          numOfEntrants === 1
            ? 0
            : await secureRandomNumber(0, numOfEntrants - 1);
        const winner = entrants[winnerIndex];

        await quizdb.setRaffleWinner(winner);

        const { firstName, lastName, email } = winner;

        res.status(Status.OK).send({
          firstName,
          lastName,
          email
        });
      })
    );

    authenticated.get(
      "/web-client/raffle/edit",
      asyncify(async (_, res) => {
        const raffle = await quizdb.getCurrentRaffle(false);

        res.status(Status.OK).send(raffle.toJSON());
      })
    );

    authenticated.post(
      "/web-client/raffle/edit",
      asyncify(async (req, res) => {
        const { requirement, prize } = req.body;

        await quizdb.editRaffle({
          requirement,
          prize
        });

        res.status(Status.OK).send({ message: "Edited." });
      })
    );

    authenticated.delete(
      "/web-client/question/:questionId/",
      asyncify(async (req, res) => {
        const { questionId } = req.params;

        await quizdb.deleteQuestion(questionId);

        res.status(Status.OK).send({ message: "Deleted." });
      })
    );

    authenticated.put(
      "/web-client/question/",
      asyncify(async (req, res) => {
        await quizdb.addQuestion();

        res.status(Status.CREATED).send({ message: "Added." });
      })
    );

    authenticated.put(
      "/web-client/question/:questionId/answer/",
      auth,
      asyncify(async (req, res) => {
        const { questionId } = req.params;

        await quizdb.addAnswer(questionId);

        res.status(Status.CREATED).send({ message: "Added." });
      })
    );

    authenticated.delete(
      "/web-client/question/:questionId/answer/:answerId",
      asyncify(async (req, res) => {
        const { questionId, answerId } = req.params;

        const id = Number.parseInt(answerId);

        if (id === Number.NaN) {
          throw ApiError.invalidRequest(
            `${answerId} is not a valid answer ID.`
          );
        }

        await quizdb.deleteAnswer(questionId, id);

        res.status(Status.OK).send({ message: "Deleted." });
      })
    );

    authenticated.get(
      "/web-client/question/:questionId/edit",
      asyncify(async (req, res) => {
        const { questionId } = req.params;

        const question = await quizdb.getQuestion(questionId);

        if (question) {
          res.json(question.toDatastore());
        } else {
          return res
            .status(Status.NOT_FOUND)
            .send({ message: "Question not found." });
        }
      })
    );

    authenticated.post(
      "/web-client/question/:questionId/edit",
      asyncify(async (req, res) => {
        const { questionId } = req.params;
        const body = req.body as unknown;

        if (!isQuestionEdit(body)) {
          console.log("Attempted Bad Question Edit: ", body);
          return res
            .status(Status.BAD_REQUEST)
            .send({ message: "Not a valid question edit." });
        }

        const newQuestion = Question.fromJSON(questionId, body);

        const nanoseconds = await quizdb.updateQuestion(newQuestion);

        // TODO Remove
        console.log(`Updated in ${nanoseconds} nanoseconds!`);

        res.status(Status.OK).send({ nanoseconds });
      })
    );

    return authenticated;
  }

  function setupUnauthenticated(unauthenticated: express.Router) {
    unauthenticated.options("*", cors(corsOptions));
    unauthenticated.use(cors(corsOptions));

    unauthenticated.get(
      "/web-client/tutorial",
      asyncify(async (_, res) => {
        const tutorial = await quizdb.getTutorial();
        const quiz = await quizdb.getQuiz();
        const numOfQuestions = Math.min(
          quiz.questionCount,
          quiz.questions.length
        );

        res.status(Status.OK).send({
          ...tutorial,
          totalQuestions: numOfQuestions
        });
      })
    );

    unauthenticated.get(
      "/web-client/raffle",
      asyncify(async (req, res) => {
        const raffle = await quizdb.getCurrentRaffle();

        if (raffle == null) {
          return res.status(Status.NOT_FOUND).send(null);
        }

        const quiz = await quizdb.getQuiz();

        const numberOfQuestions = Math.min(
          quiz.questionCount,
          quiz.questions.length
        );

        return res.status(Status.OK).send({
          questionRequirement: Math.floor(
            raffle.requirement * numberOfQuestions
          ),
          prize: raffle.prize
        });
      })
    );

    unauthenticated.post(
      "/web-client/raffle/enter",
      asyncify(async (req, res) => {
        const {
          answers = null,
          firstName = null,
          lastName = null,
          email = null
        } = req.body;

        if (![answers, firstName, lastName, email].every(a => a != null)) {
          throw ApiError.invalidRequest("Missing data.");
        }

        if (!isAnswerMap(answers)) {
          throw ApiError.invalidRequest("Invalid answer map.");
        }

        const stats = await quizdb.correctAnswers(answers);

        const percentage = stats.correct / stats.total;

        const raffle = await quizdb.getCurrentRaffle();

        if (raffle == null) {
          throw ApiError.internalError("No raffle currently exists.");
        }

        const percentageRequired = raffle.requirement;

        if (percentage > percentageRequired) {
          await quizdb.addToRaffle({
            raffleId: raffle.id,
            firstName,
            lastName,
            email
          });

          return res.status(Status.OK).send({
            success: true,
            message: "You're in!"
          });
        } else {
          return res.status(Status.OK).send({
            success: false,
            message: "You did score high enough to entry the lottery!"
          });
        }
      })
    );

    unauthenticated.get(
      "/web-client/question/:questionId/verify-answer/:answerId",
      asyncify(async (req, res) => {
        const { questionId, answerId } = req.params;

        const id = Number.parseInt(answerId);

        if (Number.isNaN(id)) {
          return res
            .status(Status.BAD_REQUEST)
            .send({ message: "Invalid answer ID passed." });
        }

        const answer = await quizdb.getAnswer(questionId, id);

        if (answer) {
          const { correct, message } = answer;

          res.status(Status.OK).send({
            questionId,
            answerId,
            correct,
            message
          });
        } else {
          throw ApiError.notFound("No such answer found.");
        }
      })
    );

    unauthenticated.post(
      "/web-client/verify",
      asyncify(async (req, res) => {
        const answers = req.body.answers;

        if (!isAnswerMap(answers)) {
          throw ApiError.invalidRequest("Invalid answer map.");
        }

        const stats = await quizdb.correctAnswers(answers);

        res.status(Status.OK).send({
          ...stats
        });
      })
    );

    unauthenticated.get(
      "/web-client",
      asyncify(async (_, res) => {
        const quiz = await quizdb.getQuiz();

        if (quiz) {
          res.status(Status.OK).send(quiz.toRandomizedJSON());
        } else {
          res.status(Status.NOT_FOUND).send({ message: "Quiz does not exist!" });
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
