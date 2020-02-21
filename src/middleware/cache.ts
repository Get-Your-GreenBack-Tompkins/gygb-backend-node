import * as express from "express";
import { Redis } from "ioredis";

export type CacheSend = {
  send(status: number, body: any): Promise<express.Response>;
};

function bodyKey(key: string) {
  return `body@${key}`;
}

function statusKey(key: string) {
  return `status@${key}`;
}

export function cacheResult(res: express.Response, redis?: Redis): CacheSend {
  return {
    async send(status: number, body: any) {
      res
        .status(status)
        .contentType("json")
        .send(body);

      if (redis) {
        const key = (res as any).cacheKey;

        await Promise.all([
          redis.setex(bodyKey(key), 60 * 5, JSON.stringify(body)),
          redis.setex(statusKey(key), 60 * 5, `${status}`)
        ]);
      }

      return res;
    }
  };
}

export function cache(key: (r: express.Request) => string, redis?: Redis) {
  if (redis) {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const cacheKey = key(req);
      (res as any).cacheKey = cacheKey;

      Promise.all([
        redis.get(bodyKey(cacheKey)),
        redis.get(statusKey(cacheKey))
      ]).then(([body, status]) => {
        if (!body || !status) {
          return next();
        }

        const parsed = Number.parseInt(status);

        if (Number.isNaN(parsed)) {
          return next();
        }

        res
          .status(parsed)
          .contentType("json")
          .send(body);
      });
    };
  }

  return (
    _: express.Request,
    __: express.Response,
    next: express.NextFunction
  ) => {
    next();
  };
}
