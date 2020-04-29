import * as express from "express";

import { GreenBackDB } from "../db";

import userRoutes from "./user/routes";
import quizRoutes from "./quiz/routes";
import sessionRoutes from "./session/routes";
import tosRoutes from "./tos/routes";

export default async function defineRoutes(db: GreenBackDB, auth: express.RequestHandler) {
  const app = express.Router();

  app.use("/user/", await userRoutes(db, auth));
  app.use("/quiz/", await quizRoutes(db, auth));
  app.use("/session/", await sessionRoutes(db, auth));
  app.use("/tos/", await tosRoutes(db, auth));

  return app;
}
