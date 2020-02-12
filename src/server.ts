import express from "express";

import helloRoutes from "./routes/hello";

import { apiErrors } from "./middleware/error";
import { GreenBackApi } from "./api";

const app = express();

app.use(apiErrors);

const api = new GreenBackApi();

app.use("/example/", helloRoutes(api));

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
