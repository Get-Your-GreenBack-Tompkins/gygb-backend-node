import * as express from "express";

import { ApiError } from "../api/util";

export const apiErrors: express.ErrorRequestHandler = (err, _, res, next) => {
  let apiError: ApiError;

  // Handle unexpected errors.
  if (err instanceof ApiError) {
    apiError = err;
  } else {
    apiError = ApiError.internalError("Internal server error!", err);
  }

  if (apiError.error) {
    console.error(apiError.error);
  }

  res.status(err.status).send({ message: err.message });
};
