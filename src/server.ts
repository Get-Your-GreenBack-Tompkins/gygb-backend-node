import express from "express";

import v1 from "./v1/routes";

import { apiErrors } from "./middleware/error";
import { GreenBackDB } from "./db";

export default function serve(db: GreenBackDB) {
  const app = express();

  app.use(apiErrors);

  app.use("/v1/", v1(db));

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
