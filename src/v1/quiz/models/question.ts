import { Model } from "../../model";

import { RichText, RichTextData, isRichTextData } from "./richtext";
import {
  Answer,
  AnswerDoc,
  isAnswer,
  AnswerEdit,
  isAnswerEdit
} from "./answer";

export type QuestionId = string;
export type QuestionDoc = {
  order?: number;
  body: RichTextData;
  header: RichTextData;
  answerId: number;
  answers: AnswerDoc[];
};

export type QuestionEdit = {
  body: string;
  header: string;
  answers: AnswerEdit[];
};

export function isQuestionDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<QuestionDoc> {
  const asQuiz = doc as FirebaseFirestore.DocumentSnapshot<QuestionDoc>;
  const data = asQuiz.data();

  const hasBody = data.body && isRichTextData(data.body);
  const hasHeader = data.header && isRichTextData(data.header);
  const hasAnswers =
    data.answers && data.answers.every(answer => isAnswer(answer));
  const hasAnswerId = "answerId" in data && typeof data.answerId === "number";
  return hasBody && hasHeader && hasAnswers && hasAnswerId;
}

export function isQuestionEdit(data: unknown): data is QuestionEdit {
  const asEdit = data as QuestionEdit;
  return (
    typeof asEdit.body === "string" &&
    typeof asEdit.header === "string" &&
    asEdit.answers.every(answer => isAnswerEdit(answer))
  );
}

export class Question extends Model {
  id: QuestionId;
  body: RichText;
  header: RichText;
  order: number;
  answers: Answer[];
  answerId: number;

  toDatastore(): QuestionDoc {
    return {
      body: this.body.toDatastore(),
      header: this.header.toDatastore(),
      order: typeof this.order === "number" ? this.order : -1,
      answerId:
        typeof this.answerId === "number" ? this.answerId : this.answers.length,
      answers: this.answers.map(answer => answer.toDatastore())
    };
  }

  getAnswers(): Answer[] {
    return this.answers;
  }

  static fromDatastore(id: QuestionId, data: QuestionDoc): Question {
    const q = new Question();

    q.id = id;
    q.order = typeof data.order === "number" ? data.order : -1;
    q.answerId = data.answerId || data.answers.length;
    q.answers = data.answers.map(answer =>
      answer.id
        ? Answer.fromDatastore(answer)
        : Answer.fromDatastore({ id: ++q.answerId, ...answer })
    );
    q.body = RichText.fromDatastore(data.body);
    q.header = RichText.fromDatastore(data.header);

    return q;
  }

  static fromJSON(id: QuestionId, data: QuestionEdit): Question {
    const q = new Question();

    q.id = id;
    q.answers = data.answers.map(answer => Answer.fromJSON(answer));
    q.body = RichText.fromJSON(data.body);
    q.header = RichText.fromJSON(data.header);

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
