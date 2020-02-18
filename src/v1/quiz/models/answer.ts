import { Model } from "../../model";

import { RichText, RichTextData, isRichTextData } from "./richtext";

export type AnswerId = string;
export type AnswerDoc = {
  text: RichTextData;
};

export function isAnswerDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<AnswerDoc> {
  const asQuiz = doc as FirebaseFirestore.DocumentSnapshot<AnswerDoc>;
  const data = asQuiz.data();
  return data.text && isRichTextData(data.text);
}

export class Answer extends Model {
  id: AnswerId;
  text: RichText;

  toJSON() {
    const { id, text } = this;
    return {
      id,
      text
    };
  }

  static fromDatastore(id: string, doc: AnswerDoc): Answer {
    const answer = new Answer();
    answer.id = id;
    answer.text = RichText.fromDatastore(doc.text);
    return answer;
  }

  toDatastore(): AnswerDoc {
    return {
      text: this.text.toDatastore()
    };
  }
}
