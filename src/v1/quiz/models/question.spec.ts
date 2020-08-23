import MockDocumentSnapshot from "@get-your-greenback-tompkins/ts-mock-firebase/lib/firestore/MockDocumentSnapshot";

import { RichText } from "../../models/richtext";

import {
  Question,
  isQuestionEdit,
  isQuestionDocument,
  QuestionDoc
} from "./question";
import { firestore } from "firebase-admin";

describe("Question Model", () => {
  const question = new Question({
    id: "randomidstring",
    header: "The Question",
    body: new RichText("What is the question?"),
    answers: [],
    answerId: 1
  });

  it("converts to json", () => {
    expect(question.toJSON()).toStrictEqual({
      id: "randomidstring",
      header: "The Question",
      body: "What is the question?",
      answerId: 1,
      answers: []
    });
  });

  it("converts from json", () => {
    expect(
      Question.fromJSON("randomidstring", {
        header: "The Question",
        body: '{"ops":[{"insert":"What is the question?"}]}',
        answers: [],
        answerId: 1
      })
    ).toBeInstanceOf(Question);
  });

  it("converts to datastore", () => {
    expect(question.toDatastore()).toStrictEqual({
      header: "The Question",
      body: {
        delta: '{"ops":[{"insert":"What is the question?"}]}',
        rendered: "<p>What is the question?</p>",
        sanitized: "What is the question?"
      },
      answers: [],
      answerId: 1
    });
  });

  it("converts from datastore", () => {
    const doc = {
      header: "The Question",
      body: {
        delta: '{"ops":[{"insert":"An Question"}]}',
        rendered: "<p>An Question</p>",
        sanitized: "An Question"
      },
      answerId: 2,
      answers: [
        {
          id: 1,
          text: {
            delta: '{"ops":[{"insert":"An Answer"}]}',
            rendered: "<p>An Answer</p>",
            sanitized: "An Answer"
          },
          message: "This is wrong because it is.",
          correct: false
        }
      ]
    };

    expect(Question.fromDatastore("randomidstring", doc)).toBeInstanceOf(
      Question
    );
  });
});

describe("Question Model utilities", () => {
  it("is an question edit", () => {
    expect(
      isQuestionEdit({
        header: "The Question",
        body: '{"ops":[{"insert":"What is the question?"}]}',
        answers: [],
        answerId: 1
      })
    ).toEqual(true);
  });

  it("is not an question edit", () => {
    expect(isQuestionEdit(null)).toEqual(false);

    expect(
      isQuestionEdit({
        header: false, // "boolean" is incorrect type
        body: '{"ops":[{"insert":"What is the question?"}]}',
        answers: [],
        answerId: 1
      })
    ).toEqual(false);

    expect(
      isQuestionEdit({
        header: "The Question",
        body: '{"ops":[{"insert":"What is the question?"}]}',
        answerId: 1 // missing "answers"
      })
    ).toEqual(false);
  });

  it("is an question document", () => {
    // TODO(ewlsh): Fix mocks to use server-side types
    const document = (new MockDocumentSnapshot<QuestionDoc>(null, {
      header: "The Question",
      body: {
        delta: '{"ops":[{"insert":"An Question"}]}',
        rendered: "<p>An Question</p>",
        sanitized: "An Question"
      },
      answers: [],
      answerId: 1
    }) as unknown) as firestore.DocumentSnapshot;

    expect(isQuestionDocument(document)).toEqual(true);
  });

  it("is not an question document", () => {
    expect(isQuestionDocument(null)).toEqual(false);

    const badDocument = (new MockDocumentSnapshot<QuestionDoc>(null, {
      header: "The Question",
      body: {
        delta: '{"ops":[{"insert":"An Question"}]}',
        rendered: "<p>An Question</p>",
        sanitized: "An Question"
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      answers: (false as unknown) as any[], // cast false to an array to test type guard
      answerId: 1
    }) as unknown) as firestore.DocumentSnapshot;

    expect(isQuestionDocument(badDocument)).toEqual(false);
  });
});
