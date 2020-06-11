import "./env";

import { GreenBackDB } from "./db";

import serve from "./server";
import authorize from "./authorize";

(function () {
  if (process.argv.length > 2) {
    if (process.argv[2] === "--authorize") {
      const argv3 = process.argv[3];

      if (typeof argv3 === "string") {
        return authorize(argv3);
      } else {
        throw new Error(`Unknown argument for --authorize: ${argv3}`);
      }
    }
  }

  const db = new GreenBackDB();

  serve(db)
    .then(() => {
      console.log("Started!");
    })
    .catch(err => {
      console.error("Server exited due to an error:");
      console.error(err);
    });
})();
