import firebase, { initialize } from "./firebase.mock";
import { firestore as Firestore } from "firebase-admin";
import { GreenBackDB } from "./db";

// Our mock firebase doesn't mock all calls, but we don't need them all.
const firestore = (firebase.firestore() as unknown) as Firestore.Firestore;
const db = new GreenBackDB(firestore);

beforeAll(() => {
  return initialize(firestore);
});

// NOTE: Change this if the DB API version increases.
const CURRENT_API_VERSION = 2;

describe("API Version", () => {
  it(`is ${CURRENT_API_VERSION}`, async () => {
    const version = await db.apiVersion();

    expect(version).toBeCloseTo(CURRENT_API_VERSION);
  });
});

describe("DB Version", () => {
  it(`is ${CURRENT_API_VERSION}`, async () => {
    const version = await db.currentVersion();

    expect(version).toBeCloseTo(CURRENT_API_VERSION);
  });
});

describe("CORS Whitelist", () => {
  it("is empty", async () => {
    const version = await db.corsWhitelist();

    expect(version).toHaveLength(0);
  });
});
