import express from "express";
import cors from "cors";

import v1 from "./v1/routes";

import { apiErrors } from "./middleware/error";
import { initializeAuth } from "./middleware/auth/middleware";
import { GreenBackDB } from "./db";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { auth } from "firebase-admin";

export async function createApp(auth: auth.Auth, db: GreenBackDB): Promise<express.Express> {
  const app = express();

  app.use(apiErrors);
  app.use(express.json());

  app.use(cors());
  
  const authMiddleware = initializeAuth(auth);

  app.use("/v1/", await v1(db, authMiddleware, auth));

  return app;
}

export default async function serve(auth: auth.Auth, db: GreenBackDB) {
  const app = await createApp(auth, db);

  const server = app.listen(process.env.PORT || 5150, () => {
    const addr = server.address();

    if (!addr) {
      console.log("Started on unknown address!");
    } else if (typeof addr !== "string") {
      console.log(`Started on ${addr.port}!`);
    } else {
      console.log(`Started on ${addr}!`);
    }
  });

  process.on("exit", () => void server.close(() => console.log("Exited.")));
}
