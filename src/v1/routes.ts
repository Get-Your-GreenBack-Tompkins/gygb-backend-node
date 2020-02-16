import * as express from "express";

import { GreenBackDB } from "../db";

import userRoutes from "./user/routes";
import quizRoutes from "./quiz/routes";

export default function defineRoutes(db: GreenBackDB) {
  const app = express.Router();

  app.use("/user/", userRoutes(db));
  app.use("/quiz/", quizRoutes(db));

  return app;
}
