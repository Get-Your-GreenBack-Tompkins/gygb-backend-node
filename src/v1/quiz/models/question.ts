import { Model } from "../../model";

import { RichText, RichTextData, isRichTextData } from "./richtext";
import { Answer, AnswerId } from "./answer";

export type QuestionId = string;
export type QuestionDoc = {
  correctAnswer: string;
  body: RichTextData;
  header: RichTextData;
};

export function isQuestionDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<QuestionDoc> {
  const asQuiz = doc as FirebaseFirestore.DocumentSnapshot<QuestionDoc>;
  const data = asQuiz.data();

  const hasBody = data.body && isRichTextData(data.body);
  const hasHeader = data.header && isRichTextData(data.header);

  return hasBody && hasHeader;
}

export class Question extends Model {
  id: QuestionId;
  body: RichText;
  header: RichText;

  answers: Answer[];
  correctAnswer: AnswerId;

  toDatastore(): QuestionDoc {
    return {
      correctAnswer: `${this.correctAnswer}`,
      body: this.body.toDatastore(),
      header: this.header.toDatastore()
    };
  }

  getAnswers(): Answer[] {
    return this.answers;
  }

  static fromDatastore(
    id: string,
    data: QuestionDoc
  ): (answers: Answer[]) => Question {
    return (answers: Answer[]) => {
      const q = new Question();

      q.id = id;
      q.answers = answers;
      q.body = RichText.fromDatastore(data.body);
      q.header = RichText.fromDatastore(data.header);
      q.correctAnswer = data.correctAnswer;

      return q;
    };
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
