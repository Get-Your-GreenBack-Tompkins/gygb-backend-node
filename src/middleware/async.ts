import * as express from "express";

export const asyncify = (fn: express.RequestHandler) => (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
