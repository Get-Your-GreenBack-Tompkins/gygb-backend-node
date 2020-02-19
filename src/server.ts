import express from "express";

import v1 from "./v1/routes";

import { apiErrors } from "./middleware/error";
import { GreenBackDB } from "./db";

export default function serve(db: GreenBackDB) {
  const app = express();

  app.use(apiErrors);
  app.use(express.json());

  app.use("/v1/", v1(db));

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With, Accept");
  });

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
