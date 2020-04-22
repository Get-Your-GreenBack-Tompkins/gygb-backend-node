import { Model } from "../../model";

import { Question, QuestionDoc } from "./question";

export type QuizId = string;
export type QuizDoc = {
  questionCount: number;
  name: string;
  questions: QuestionDoc[];
};

export function isQuizQueryDocument(
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.QueryDocumentSnapshot<QuizDoc> {
  const asQuiz = doc as FirebaseFirestore.QueryDocumentSnapshot<QuizDoc>;
  const data = asQuiz.data();

  return (
    data &&
    "name" in data &&
    typeof data.name === "string" &&
    "questionCount" in data &&
    typeof data.questionCount === "number"
  );
}

export function isQuizDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<QuizDoc> {
  const asQuiz = doc as FirebaseFirestore.DocumentSnapshot<QuizDoc>;
  const data = asQuiz.data();

  return (
    data &&
    "name" in data &&
    typeof data.name === "string" &&
    "questionCount" in data &&
    typeof data.questionCount === "number"
  );
}

// Based on https://stackoverflow.com/a/19270021
function getRandom<T>(arr: T[], n: number): T[] {
  let result = new Array(n);
  let len = arr.length;
  let taken = new Array(len);

  if (n > len) {
    n = len;
  }

  while (n-- > 0) {
    let x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }

  return result;
}

export class Quiz extends Model {
  id: QuizId;
  name: string;
  questionCount: number;
  questions: Question[];

  constructor(params: { id: string; name: string; questions: Question[]; questionCount: number }) {
    const { id, name, questions, questionCount } = params;
    super(id);

    this.name = name;
    this.questions = questions;
    this.questionCount = questionCount;
  }

  toJSON() {
    const { id, questions, name, questionCount } = this;

    const length = Math.min(questions.length, questionCount);

    if (length !== questionCount) {
      console.warn(`Too few questions for given question count in quiz ${name}.`);
    }

    const randomQuestions = getRandom(questions, length);

    return {
      id,
      name,
      questions: randomQuestions
    };
  }

  static fromDatastore(id: string, quizDoc: QuizDoc): (questions: Question[]) => Quiz {
    const { name, questionCount } = quizDoc;

    return (questions: Question[]) => {
      const quiz = new Quiz({ id, questions, questionCount, name });

      return quiz;
    };
  }

  toDatastore() {
    const { name } = this;
    return { name };
  }
}
