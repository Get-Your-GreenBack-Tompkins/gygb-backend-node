import "./env";

import { GreenBackDB } from "./db";

import serve from "./server";

const db = new GreenBackDB();

const redisFlag = process.argv.includes("--redis");

serve(db, redisFlag)
  .then(() => {
    console.log("Started!");
  })
  .catch(err => {
    console.error("Server exited due to an error:");
    console.error(err);
  });
