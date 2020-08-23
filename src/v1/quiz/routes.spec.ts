import express from "express";
import request from "supertest";

import quizRoutes from "./routes";

import firebase, { initialize } from "../../firebase.mock";
import { firestore as Firestore } from "firebase-admin";
import { initializeAuth } from "../../middleware/auth/middleware";
import { GreenBackDB } from "../../db";

// Our mock firebase doesn't mock all calls, but we don't need them all.
const firestore = (firebase.firestore() as unknown) as Firestore.Firestore;
const db = new GreenBackDB(firestore);
const auth = firebase.auth();

const authMiddleware = initializeAuth(auth);

const app: express.Express = express();

beforeAll(async done => {
  try {
    await initialize(firestore);

    app.use("/v1/quiz/", await quizRoutes(db, {}, authMiddleware));
  } catch (err) {
    console.error(err);
  }

  done();
});

describe("Admin Endpoints", () => {
  const requests = () =>
    [
      ["get - /web-client/edit", request(app).get("/v1/quiz/web-client/edit")],
      [
        "post - /web-client/edit",
        request(app).post("/v1/quiz/web-client/edit")
      ],
      [
        "put - /web-client/raffle",
        request(app).put("/v1/quiz/web-client/raffle")
      ],
      [
        "get - /web-client/raffle/list",
        request(app).get("/v1/quiz/web-client/raffle/list")
      ],
      [
        "get - /web-client/raffle/winner",
        request(app).get("/v1/quiz/web-client/raffle/winner")
      ],
      [
        "get - /web-client/raffle/edit",
        request(app).get("/v1/quiz/web-client/raffle/edit")
      ],
      [
        "post - /web-client/raffle/edit",
        request(app).post("/v1/quiz/web-client/raffle/edit")
      ],
      [
        "delete - /web-client/question/:questionId/",
        request(app).delete("/v1/quiz/web-client/question/:questionId/")
      ],
      [
        "put - /web-client/question/",
        request(app).put("/v1/quiz/web-client/question/")
      ],
      [
        "put - /web-client/question/:questionId/answer/",
        request(app).put("/v1/quiz/web-client/question/:questionId/answer/")
      ],
      [
        "delete - /web-client/question/:questionId/answer/:answerId",
        request(app).delete(
          "/v1/quiz/web-client/question/:questionId/answer/:answerId"
        )
      ],
      [
        "get - /web-client/question/:questionId/edit",
        request(app).get("/v1/quiz/web-client/question/:questionId/edit")
      ],
      [
        "post - /web-client/question/:questionId/edit",
        request(app).post("/v1/quiz/web-client/question/:questionId/edit")
      ]
    ] as const;

  it.each(requests())(
    "%s rejects invalid bearer token with 403.",
    async (_, request) => {
      const res = await request.set("Authorization", "Bearer badtoken").send();
      expect(res.status).toEqual(403);
      expect(res.body).toEqual({ message: "Not an administrator." });
    }
  );
});
