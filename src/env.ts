import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  console.log("Development environment detected. Loading environmental files from .env!");
  dotenv.config();
}
