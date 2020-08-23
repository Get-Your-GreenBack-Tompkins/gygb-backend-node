import { RichText } from "../../models/richtext";

import { Answer, isAnswerEdit, isAnswer } from "./answer";

describe("Answer Model", () => {
  it("creates blank answer", () => {
    const answer = Answer.blank({ id: 100 });

    expect(answer.correct).toBeFalsy();
    expect(answer.id).toBeCloseTo(100);
    expect(answer.message).toEqual("");
    expect(answer.text.toJSON()).toEqual("");
  });

  it("creates correct blank answer", () => {
    const answer = Answer.blank({ id: 100, correct: true });

    expect(answer.correct).toBeTruthy();
    expect(answer.id).toBeCloseTo(100);
    expect(answer.message).toEqual("");
    expect(answer.text.toJSON()).toEqual("");
  });

  const answer = new Answer({
    id: 10,
    text: new RichText("The Answer"),
    correct: false,
    message: "whoops!"
  });

  it("converts to json", () => {
    expect(answer.toJSON()).toStrictEqual({
      id: 10,
      text: "The Answer",
      correct: false,
      message: "whoops!"
    });
  });

  it("converts from json", () => {
    expect(
      Answer.fromJSON({
        id: 13,
        text: '{"ops":[{"insert":"The Answer"}]}',
        correct: false,
        message: "whoops!"
      })
    ).toBeInstanceOf(Answer);
  });

  it("converts to datastore", () => {
    expect(answer.toDatastore()).toStrictEqual({
      id: 10,
      text: {
        delta: '{"ops":[{"insert":"The Answer"}]}',
        rendered: "<p>The Answer</p>",
        sanitized: "The Answer"
      },
      correct: false,
      message: "whoops!"
    });
  });

  it("converts from datastore", () => {
    const doc = {
      id: 5,
      text: {
        delta: '{"ops":[{"insert":"An Answer"}]}',
        rendered: "<p>An Answer</p>",
        sanitized: "An Answer"
      },
      correct: false,
      message: "this was wrong because of the answer"
    };

    expect(Answer.fromDatastore(doc)).toBeInstanceOf(Answer);
  });
});

describe("Answer Model utilities", () => {
  it("is an answer edit", () => {
    expect(
      isAnswerEdit({
        id: 100, // "number"
        text: "", // "string"
        message: "", // "string"
        correct: true // "boolean"
      })
    ).toEqual(true);
  });

  it("is not an answer edit", () => {
    expect(isAnswerEdit(null)).toEqual(false);

    expect(
      isAnswerEdit({
        id: 100, // "number"
        text: false, // "string"
        message: "", // "string"
        correct: true // "boolean"
      })
    ).toEqual(false);

    expect(
      isAnswerEdit({
        id: 100, // "number"
        text: "" // "string"
      })
    ).toEqual(false);
  });

  it("is an answer input", () => {
    expect(
      isAnswer({
        text: {
          delta: "",
          rendered: "",
          sanitized: ""
        }
      })
    ).toEqual(true);
  });

  it("is not an answer input", () => {
    expect(isAnswer(null)).toEqual(false);

    expect(
      isAnswer({
        text: "answer"
      })
    ).toEqual(false);
  });
});
