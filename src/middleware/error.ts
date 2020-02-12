import * as express from "express";

import { ApiError } from "../api/util";

export const apiErrors: express.ErrorRequestHandler = (err, _, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.status).send({ message: err.message });
  } else {
    console.log(
      err instanceof Error
        ? "Unhandled error occured!"
        : "Unexpected error value found:"
    );

    console.error(err);
    next(err);
  }
};
