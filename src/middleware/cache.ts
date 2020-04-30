import * as express from "express";

export type CacheSend = {
  send(status: number, body: any): Promise<express.Response>;
};

export function cacheResult(res: express.Response): CacheSend {
  return {
    async send(status: number, body: any) {
      res
        .status(status)
        .contentType("json")
        .send(body);

      return res;
    }
  };
}

export function cache(key: (r: express.Request) => string) {
  return (_: express.Request, __: express.Response, next: express.NextFunction) => {
    next();
  };
}
