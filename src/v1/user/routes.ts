import * as express from "express";
import * as Status from "http-status-codes";

import { V1DB } from "../db";

import { UserDB } from "./db";

export default function defineRoutes(db: V1DB): express.Router {
  const router = express.Router();

  const userdb = new UserDB(db);

  return router;
}
