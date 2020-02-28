import * as express from "express";

import { Redis } from "ioredis";

import { GreenBackDB } from "../db";

import userRoutes from "./user/routes";
import quizRoutes from "./quiz/routes";

export default function defineRoutes(db: GreenBackDB, redis?: Redis) {
  const app = express.Router();

  app.use("/user/", userRoutes(db, redis));
  app.use("/quiz/", quizRoutes(db, redis));

  return app;
}
