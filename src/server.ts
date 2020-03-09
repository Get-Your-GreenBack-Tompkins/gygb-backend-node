import express from "express";
import cors from "cors";

import v1 from "./v1/routes";

import { apiErrors } from "./middleware/error";
import { initializeAuth } from "./middleware/auth/middleware";
import { GreenBackDB } from "./db";

import redis from "./redis";

export default async function serve(
  db: GreenBackDB,
  initRedis: boolean = false
) {
  if (initRedis) {
    console.log("Attempting to connect to redis...");
    try {
      await redis.connect();
      console.log("Redis connected!");
    } catch (err) {
      console.log("Redis was unable to connect, stopping server.");
      redis.disconnect();
      redis.removeAllListeners();

      throw err;
    }
  }

  const app = express();

  app.use(apiErrors);
  app.use(express.json());

  app.use(cors({ origin: "*" }));
  app.options("*", cors({ origin: "*" }));

  const auth = initializeAuth(db);

  app.use("/v1/", auth, initRedis ? v1(db, redis) : v1(db));

  let server = app.listen(process.env.PORT || 5150, () => {
    const addr = server.address();

    if (!addr) {
      console.log(`Started on unknown address!`);
    } else if (typeof addr !== "string") {
      console.log(`Started on ${addr.port}!`);
    } else {
      console.log(`Started on ${addr}!`);
    }
  });

  process.on("exit", () => void server.close(() => console.log("Exited.")));
}
