import * as express from "express";
import * as Status from "http-status-codes";

import { GreenBackApi } from "../api";
import { ApiError } from "../api/util";

export default function defineRoutes(api: GreenBackApi) {
  const router = express.Router();

  router.get("/hello/", (req, res, next) => {
    const { name } = req.params;

    const greeting = api.sayHello(name);

    if (greeting instanceof ApiError) {
      return next(greeting);
    }

    res.status(Status.OK).send(greeting);
  });

  return router;
}
