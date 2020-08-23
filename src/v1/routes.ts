import * as express from "express";
import cors from "cors";

import { GreenBackDB } from "../db";

import userRoutes from "./user/routes";
import quizRoutes from "./quiz/routes";
import sessionRoutes from "./session/routes";
import tosRoutes from "./tos/routes";
import adminRoutes from "./admin/routes";

export default async function defineRoutes(db: GreenBackDB, auth: express.RequestHandler) {
  const app = express.Router();

  const whitelist = await db.corsWhitelist();

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS: Invalid Origin!"));
      }
    }
  };

  app.use("/user/", await userRoutes(db, corsOptions, auth));
  app.use("/quiz/", await quizRoutes(db, corsOptions, auth));
  app.use("/session/", await sessionRoutes(db, auth));
  app.use("/tos/", await tosRoutes(db, auth));
  app.use("/admin/", await adminRoutes(auth, corsOptions));

  // After all routes are defined, migrations should be complete.
  // If a migration failed, it should have thrown an error which would prevent this code from calling.
  await db.finishMigrations();

  return app;
}
