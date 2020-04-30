import * as express from "express";
import * as Status from "http-status-codes";

import { ApiError } from "../../api/util";

import firebase from "../../firebase";

export function initializeAuth() {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const bearerAuth = req.get("Authorization");

    if (!bearerAuth) {
      throw ApiError.invalidRequest("Bad Header");
    }

    const parts = bearerAuth.split(" ");

    if (parts.length < 2) {
      throw ApiError.invalidRequest("Bad Header");
    }

    const [, idToken] = parts;

    firebase
      .auth()
      .verifyIdToken(idToken, true)
      .then(claims => {
        return claims.admin === true;
      })
      .then(isAdmin => {
        if (isAdmin) {
          return next();
        }

        return res.status(Status.FORBIDDEN).send({ message: "Not an administrator." });
      })
      .catch(error => {
        if (error.code == "auth/id-token-revoked") {
          res.status(Status.UNAUTHORIZED).send({ message: "Token Revoked." });
        } else {
          res.status(Status.UNAUTHORIZED).send();
        }
      });
  };
}
