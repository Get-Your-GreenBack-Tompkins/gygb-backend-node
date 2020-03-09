import { Model } from "../../model";

import { Question, QuestionDoc } from "./question";

export type QuizId = string;
export type QuizDoc = {
  name: string;
  questions: QuestionDoc[];
};

export function isQuizDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<QuizDoc> {
  const asQuiz = doc as FirebaseFirestore.DocumentSnapshot<QuizDoc>;
  const data = asQuiz.data();

  return data && "name" in data && typeof data.name === "string";
}

export class Quiz extends Model {
  id: QuizId;
  name: string;
  questions: Question[];

  constructor(params: { id: string; name: string; questions: Question[] }) {
    const { id, name, questions } = params;
    super(id);

    this.name = name;
    this.questions = questions;
  }

  toJSON() {
    const { id, questions, name } = this;
    return {
      id,
      name,
      questions: questions.sort((a, b) => a.order - b.order)
    };
  }

  static fromDatastore(
    id: string,
    quizDoc: QuizDoc
  ): (questions: Question[]) => Quiz {
    const { name } = quizDoc;

    return (questions: Question[]) => {
      const quiz = new Quiz({ id, questions, name });

      return quiz;
    };
  }

  toDatastore() {
    const { name } = this;
    return { name };
  }
}
