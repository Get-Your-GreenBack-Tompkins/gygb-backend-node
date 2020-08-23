import * as express from "express";
import cors from "cors";

import { GreenBackDB } from "../db";

import userRoutes from "./user/routes";
import quizRoutes from "./quiz/routes";
import sessionRoutes from "./session/routes";
import tosRoutes from "./tos/routes";
import adminRoutes from "./admin/routes";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { auth } from "firebase-admin";

export default async function defineRoutes(db: GreenBackDB, middleware: express.RequestHandler, auth: auth.Auth) {
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

  app.use("/user/", await userRoutes(db, corsOptions, middleware));
  app.use("/quiz/", await quizRoutes(db, corsOptions, middleware));
  app.use("/session/", await sessionRoutes(db, middleware));
  app.use("/tos/", await tosRoutes(db, middleware));
  app.use("/admin/", await adminRoutes(auth, middleware, corsOptions));

  // After all routes are defined, migrations should be complete.
  // If a migration failed, it should have thrown an error which would prevent this code from calling.
  await db.finishMigrations();

  return app;
}
