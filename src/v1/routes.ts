import * as express from "express";

import { GreenBackDB } from "../db";

import userRoutes from "./user/routes";
import quizRoutes from "./quiz/routes";
import sessionRoutes from "./session/routes";
import tosRoutes from "./tos/routes";
import adminRoutes from "./admin/routes";

export default async function defineRoutes(db: GreenBackDB, auth: express.RequestHandler) {
  const app = express.Router();

  app.use("/user/", await userRoutes(db, auth));
  app.use("/quiz/", await quizRoutes(db, auth));
  app.use("/session/", await sessionRoutes(db, auth));
  app.use("/tos/", await tosRoutes(db, auth));
  app.use("/admin/", await adminRoutes(auth));

  // After all routes are defined, migrations should be complete.
  // If a migration failed, it should have thrown an error which would prevent this code from calling.
  db.finishMigrations();

  return app;
}
