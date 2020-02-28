import { Model } from "../../model";

import { RichText, RichTextData, isRichTextData } from "./richtext";

export type AnswerId = string;
export type AnswerDoc = {
  id: number;
  text: RichTextData;
  correct: boolean;
};

export function isAnswer(data: unknown) {
  if (typeof data !== "object") {
    return false;
  }

  const asAns = data as AnswerDoc;
  return isRichTextData(asAns.text);
}

export function isAnswerDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<AnswerDoc> {
  const asQuiz = doc as FirebaseFirestore.DocumentSnapshot<AnswerDoc>;
  const data = asQuiz.data();
  return data.text && isRichTextData(data.text);
}

export class Answer {

  id: number;
  text: RichText;
  correct: boolean;

  toJSON() {
    const { id, text, correct } = this;
    return {
      id,
      text,
      correct
    };
  }

  static fromDatastore(doc: AnswerDoc, index: number): Answer {
    const answer = new Answer();
    answer.id = index;
    answer.text = RichText.fromDatastore(doc.text);
    answer.correct = doc.correct;
    return answer;
  }

  toDatastore(): AnswerDoc {
    return {
      id: this.id,
      text: this.text.toDatastore(),
      correct: this.correct
    };
  }
}
