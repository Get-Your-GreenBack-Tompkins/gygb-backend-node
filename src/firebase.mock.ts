// eslint-disable-next-line @typescript-eslint/no-unused-vars
import admin, { auth, firestore } from "firebase-admin";

import { exposeMockFirebaseAdminApp } from "@get-your-greenback-tompkins/ts-mock-firebase";
import { Collection } from "./db";
import { Quiz, DefaultRaffleInfo } from "./v1/quiz/models/quiz";
import { Tutorial } from "./v1/quiz/models/tutorial";
import { RichText } from "./v1/models/richtext";
import { Question } from "./v1/quiz/models/question";
import { Answer } from "./v1/quiz/models/answer";
import { MockCollectionReference } from "@get-your-greenback-tompkins/ts-mock-firebase/lib/firestore/MockCollectionReference";

const app = admin.initializeApp({});

declare module "@firebase/app-types" {
  interface MockFirebaseApp {
    auth(): auth.Auth;
  }
}

declare module "@get-your-greenback-tompkins/ts-mock-firebase" {
  interface MockFirebaseAppImpl {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auth(): any;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
MockCollectionReference.prototype.listDocuments =
  // Implementation
  function (
    this: MockCollectionReference
  ): Promise<firestore.DocumentReference[]> {
    return Promise.resolve(
      (this.mocker.docRefs() as unknown[]) as firestore.DocumentReference[]
    );
  } as firestore.CollectionReference["listDocuments"];

const mocked = exposeMockFirebaseAdminApp(app);

mocked.auth = function () {
  const mock: Partial<auth.Auth> = {
    async getUserByEmail() {
      return null;
    },
    verifyIdToken(idToken: string) {
      const baseClaims = {
        aud: "",
        // eslint-disable-next-line @typescript-eslint/camelcase
        auth_time: 0,
        exp: 0,
        firebase: {},
        iat: 0,
        iss: "",
        sub: "",
        uid: ""
      } as admin.auth.DecodedIdToken;

      if (idToken === "admin") {
        return Promise.resolve({ ...baseClaims, ...{ admin: true } });
      } else {
        return Promise.resolve({ ...baseClaims, ...{ admin: false } });
      }
    },
    async listUsers() {
      return { users: [] };
    },
    async setCustomUserClaims() {
      return;
    }
  };

  return mock as Required<typeof mock>;
};

export async function initialize(firestore: firestore.Firestore) {
  await firestore.collection(Collection.META).doc("db-info").set({
    currentVersion: 2
  });

  const mockQuiz = new Quiz({
    id: "web-client",
    name: "Web Quiz",
    questions: [
      new Question({
        id: "question1",
        header: "Question 1",
        body: new RichText("What is this question?"),
        answers: [
          new Answer({
            id: 1,
            text: new RichText("The Answer!"),
            correct: true,
            message: "That's right!"
          })
        ],
        answerId: 2
      })
    ],
    questionCount: 1,
    tutorial: new Tutorial({
      header: "Hi!",
      body: new RichText("The Body")
    }),
    defaultRaffle: new DefaultRaffleInfo({
      prize: "A Prize",
      requirement: 0.5
    })
  });

  await firestore
    .collection(Collection.QUIZ)
    .doc("web-client")
    .set(mockQuiz.toDatastore());
}

export default mocked;
