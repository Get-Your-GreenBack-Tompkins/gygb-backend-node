import express from "express";
import request from "supertest";

import adminRoutes from "./routes";

import firebase, { initialize } from "../../firebase.mock";
import { firestore as Firestore } from "firebase-admin";
import { initializeAuth } from "../../middleware/auth/middleware";

// Our mock firebase doesn't mock all calls, but we don't need them all.
const firestore = (firebase.firestore() as unknown) as Firestore.Firestore;
const auth = firebase.auth();

const authMiddleware = initializeAuth(auth);

const app: express.Express = express();

beforeAll(async done => {
  try {
    await initialize(firestore);

    app.use("/v1/admin/", await adminRoutes(auth, authMiddleware, {}));
  } catch (err) {
    console.error(err);
  }

  done();
});

describe("Admin Endpoints", () => {
  const requests = () =>
    [
      ["get - /list", request(app).get("/v1/admin/list")],
      ["delete - /", request(app).delete("/v1/admin/")],
      ["put - /", request(app).put("/v1/admin/")]
    ] as const;

  it.each(requests())(
    "%s rejects invalid bearer token with 403.",
    async (_, request) => {
      const res = await request.set("Authorization", "Bearer badtoken").send();
      expect(res.status).toEqual(403);
      expect(res.body).toEqual({ message: "Not an administrator." });
    }
  );
});

function authorizeRequest(request: request.Test) {
  return request.set("Authorization", "Bearer admin");
}

describe("GET /list", () => {
  it("returns empty admin list", async () => {
    const res = await authorizeRequest(
      request(app).get("/v1/admin/list")
    ).send();

    expect(res.status).toEqual(200);
    expect(res.body).toEqual({ admins: [] });
  });
});

describe("PUT /", () => {
  it("returns 404 with unknown admin email", async () => {
    const res = await authorizeRequest(
      request(app).put("/v1/admin/?email=admin@example.com")
    ).send();

    expect(res.status).toEqual(404);
    expect(res.body).toEqual({});
  });
});

describe("DELETE /", () => {
  it("returns 404 with unknown admin email", async () => {
    const res = await authorizeRequest(
      request(app).delete("/v1/admin/?email=admin@example.com")
    ).send();

    expect(res.status).toEqual(404);
    expect(res.body).toEqual({});
  });
});
