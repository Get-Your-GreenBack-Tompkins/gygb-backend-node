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
  body: RichTextData;
  id: QuestionId;
  header: RichTextData;
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

  return hasBody && hasHeader && hasAnswers;
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

  answers: Answer[];

  toDatastore(): QuestionDoc {
    return {
      body: this.body.toDatastore(),
      id: this.id,
      header: this.header.toDatastore(),
      answers: this.answers.map(answer => answer.toDatastore())
    };
  }

  getAnswers(): Answer[] {
    return this.answers;
  }

  static fromDatastore(id: QuestionId, data: QuestionDoc): Question {
    const q = new Question();

    q.id = id;
    q.answers = data.answers.map((answer, i) =>
      Answer.fromDatastore(answer, i)
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
    const { id, body, header, answers } = this;

    return {
      id,
      body,
      header,
      answers
    };
  }
}
