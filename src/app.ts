import "./env";

import { GreenBackDB } from "./db";

import serve from "./server";

const db = new GreenBackDB();

serve(db)
  .then(() => {
    console.log("Started!");
  })
  .catch(err => {
    console.error("Server exited due to an error:");
    console.error(err);
  });
