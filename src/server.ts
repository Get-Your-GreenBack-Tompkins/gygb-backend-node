import express from "express";
import cors from "cors";

import v1 from "./v1/routes";

import { ApiError } from "./api/util";

import { apiErrors } from "./middleware/error";
import { initializeAuth } from "./middleware/auth/middleware";
import { GreenBackDB } from "./db";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { auth } from "firebase-admin";

// Augment express' response/request types for our timeout middleware.
declare module "express-serve-static-core" {
  interface Response {
    timedOut?: boolean;
  }

  interface Request {
    timedOut?: boolean;
  }
}

export async function createApp(
  auth: auth.Auth,
  db: GreenBackDB
): Promise<express.Express> {
  const app = express();

  app.use(apiErrors);
  app.use(express.json());

  app.use(cors());

  const authMiddleware = initializeAuth(auth);

  const API_TIMEOUT = 5 * 1000; // ms

  // Ensure requests timeout within 10 seconds so that we don't
  // create timeout errors with Heroku's gateway.
  app.use((req, res, next) => {
    req.setTimeout(API_TIMEOUT, () => {
      req.timedOut = true;
      next(ApiError.requestTimeout());
    });

    res.setTimeout(API_TIMEOUT, () => {
      res.timedOut = true;
      next(ApiError.serviceUnavailable());
    });

    next();
  });

  app.use("/v1/", await v1(db, authMiddleware, auth));

  return app;
}

export default async function serve(auth: auth.Auth, db: GreenBackDB) {
  const app = await createApp(auth, db);

  const server = app.listen(process.env.PORT || 5150, () => {
    const addr = server.address();

    // Ensure default timeout is 15 seconds.
    // Node, by default, will timeout after 2 minutes
    // Heroku's gateway supports a maximum of 30 seconds
    // and no call we're executing should take even
    // 10 seconds under normal conditions.
    server.setTimeout(15 * 1000);

    if (!addr) {
      console.log("Started on unknown address!");
    } else if (typeof addr !== "string") {
      console.log(`Started on ${addr.port}!`);
    } else {
      console.log(`Started on ${addr}!`);
    }
  });
}
