import { RichText, RichTextData, isRichTextData } from "./richtext";

export type AnswerId = string;
export type AnswerDoc = {
  id: number;
  text: RichTextData;
  correct: boolean;
};

export type AnswerEdit = {
  id: number;
  text: string;
  correct: boolean;
};

export function isAnswerEdit(data: unknown) {
  const asEdit = data as AnswerEdit;
  return (
    typeof asEdit.id === "number" &&
    typeof asEdit.text === "string" &&
    typeof asEdit.correct === "boolean"
  );
}

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

  constructor(params: { id: number; text: RichText; correct?: boolean }) {
    const { id, text } = params;

    this.id = id;
    this.text = text;

    if ("correct" in params) {
      this.correct = params.correct;
    } else {
      this.correct = false;
    }
  }

  toJSON() {
    const { id, text, correct } = this;
    return {
      id,
      text,
      correct
    };
  }

  static blank(params: { id: number; correct?: boolean }) {
    const { id } = params;

    const rt = new RichText();

    if ("correct" in params) {
      return new Answer({ id, text: rt, correct: params.correct });
    } else {
      return new Answer({ id, text: rt });
    }
  }

  static fromJSON(data: AnswerEdit): Answer {
    const { id, text, correct } = data;

    const answer = new Answer({ id, text: RichText.fromJSON(text), correct });

    return answer;
  }

  static fromDatastore(doc: AnswerDoc): Answer {
    const { id, text, correct } = doc;

    const answer = new Answer({
      id,
      text: RichText.fromDatastore(text),
      correct
    });

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
