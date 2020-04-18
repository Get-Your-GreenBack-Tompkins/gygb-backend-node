import * as express from "express";

import { Redis } from "ioredis";

import { GreenBackDB } from "../db";

import userRoutes from "./user/routes";
import quizRoutes from "./quiz/routes";

export default function defineRoutes(db: GreenBackDB, auth: express.RequestHandler, redis?: Redis) {
  const app = express.Router();

  app.use("/user/", userRoutes(db, auth, redis));
  app.use("/quiz/", quizRoutes(db, auth, redis));

  return app;
}
