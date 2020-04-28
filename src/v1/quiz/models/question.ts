import { Model } from "../../model";

import { RichText, RichTextData, isRichTextData } from "../../models/richtext";
import {
  Answer,
  AnswerDoc,
  isAnswer,
  AnswerEdit,
  isAnswerEdit
} from "./answer";

import Delta from "quill-delta";

export function header() {
  const delta = new Delta();

  delta.insert(header, { header: 2 });

  return delta;
}

export type QuestionId = string;
export type QuestionDoc = {
  order?: number;
  body: RichTextData;
  header: string;
  answerId: number;
  answers: AnswerDoc[];
};

export type QuestionEdit = {
  body: string;
  header: string;
  answers: AnswerEdit[];
  order: number;
  answerId: number;
};

export type Unknown<K> = { [k in keyof K]: unknown };

export function isQuestionDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<QuestionDoc> {
  const asQuiz = doc as FirebaseFirestore.DocumentSnapshot<QuestionDoc>;
  const data = asQuiz.data();

  if (!data) {
    return false;
  }

  const hasAnswers =
    data.answers &&
    Array.isArray(data.answers) &&
    data.answers.every(answer => isAnswer(answer));
  const hasBody = data.body && isRichTextData(data.body);
  const hasHeader = typeof data.header === "string";
  const hasAnswerId = typeof data.answerId === "number";

  return hasBody && hasHeader && hasAnswers && hasAnswerId;
}

export function isQuestionEdit(data: unknown): data is QuestionEdit {
  const asEdit = data as QuestionEdit;
  return (
    typeof asEdit.body === "string" &&
    typeof asEdit.header === "string" &&
    typeof asEdit.answerId === "number" &&
    asEdit.answers.every(answer => isAnswerEdit(answer))
  );
}

export class Question extends Model {
  header: string;
  order: number;

  body: RichText;
  answers: Answer[];
  answerId: number;

  constructor(params: {
    id: QuestionId;
    header: string;
    order: number;
    body: RichText;
    answers: Answer[];
    answerId: number;
  }) {
    const { id, header, order, body, answers, answerId } = params;

    super(id);

    this.id = id;
    this.header = header;
    this.order = order;
    this.body = body;
    this.answers = [...answers];
    this.answerId = answerId;
  }

  toDatastore(): QuestionDoc {
    return {
      body: this.body.toDatastore(),
      header: this.header,
      order: this.order,
      answerId:
        typeof this.answerId === "number" ? this.answerId : this.answers.length,
      answers: this.answers.map(answer => answer.toDatastore())
    };
  }

  getAnswers(): Answer[] {
    return this.answers;
  }

  static fromDatastore(id: QuestionId, data: QuestionDoc): Question {
    const { order, answerId, header, answers, body } = data;

    const q = new Question({
      id,
      order,
      answerId,
      header,
      answers: answers.map(answer => Answer.fromDatastore(answer)),
      body: RichText.fromDatastore(body)
    });

    return q;
  }

  static fromJSON(id: QuestionId, data: QuestionEdit): Question {
    const { order, answerId, header, answers, body } = data;

    const q = new Question({
      id,
      order,
      answerId,
      header,
      body: RichText.fromJSON(body),
      answers: answers.map(answer => Answer.fromJSON(answer))
    });

    return q;
  }

  toJSON() {
    const { id, body, header, answers, answerId } = this;

    return {
      id,
      body,
      header,
      answers,
      answerId
    };
  }
}
