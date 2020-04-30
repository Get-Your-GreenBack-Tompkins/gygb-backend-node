import { Model } from "../../model";

import { Question, QuestionDoc } from "./question";
import { TutorialDoc, isTutorialDocument, Tutorial, isTutorialEdit } from "./tutorial";

export type QuizId = string;
export type QuizDoc = {
  questionCount: number;
  name: string;
  tutorial: TutorialDoc;
  questions: QuestionDoc[];
};

export type QuizJson = {
  questionCount: number;
  name: string;
  tutorial: { header: string; body: string };
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
    typeof data.questionCount === "number" &&
    "tutorial" in data &&
    isTutorialDocument(data.tutorial)
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
    typeof data.questionCount === "number" &&
    "tutorial" in data &&
    isTutorialDocument(data.tutorial)
  );
}

export function isQuizEdit(data: unknown): data is QuizJson {
  const asEdit = data as QuizJson;

  return (
    data &&
    typeof data === "object" &&
    "name" in asEdit &&
    typeof asEdit.name === "string" &&
    "questionCount" in asEdit &&
    typeof asEdit.questionCount === "number" &&
    "tutorial" in asEdit &&
    isTutorialEdit(asEdit.tutorial)
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
  tutorial: Tutorial;

  constructor(params: {
    id: string;
    name: string;
    questions: Question[];
    questionCount: number;
    tutorial: Tutorial;
  }) {
    const { id, name, questions, questionCount, tutorial } = params;
    super(id);

    this.name = name;
    this.questions = questions;
    this.questionCount = questionCount;
    this.tutorial = tutorial;
  }

  toRandomizedJSON() {
    const { id, questions, name, questionCount, tutorial } = this;

    const length = Math.min(questions.length, questionCount);

    if (length !== questionCount) {
      console.warn(`Too few questions for given question count in quiz ${name}.`);
    }

    const randomQuestions = getRandom(questions, length);

    return {
      id,
      name,
      questions: randomQuestions,
      tutorial
    };
  }

  toJSON() {
    const { id, questions, name, questionCount, tutorial } = this;

    return {
      id,
      name,
      questionCount,
      questions: questions.sort((a, b) => a.creationTime - b.creationTime),
      tutorial
    };
  }

  static fromJSON(id: string, quizJson: QuizJson): Quiz {
    const { name, questionCount, tutorial } = quizJson;

    const quiz = new Quiz({
      id,
      questions: [],
      questionCount,
      name,
      tutorial: Tutorial.fromJSON(tutorial)
    });

    return quiz;
  }

  static fromDatastore(id: string, quizDoc: QuizDoc): (questions: Question[]) => Quiz {
    const { name, questionCount, tutorial } = quizDoc;

    return (questions: Question[]) => {
      const quiz = new Quiz({
        id,
        questions,
        questionCount,
        name,
        tutorial: Tutorial.fromDatastore(tutorial)
      });

      return quiz;
    };
  }

  toDatastore() {
    const { name, questionCount, tutorial } = this;

    return { name, questionCount, tutorial: tutorial.toDatastore() };
  }
}
