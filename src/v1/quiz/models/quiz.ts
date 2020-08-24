import { Model } from "../../model";

import { Question, QuestionDoc } from "./question";
import {
  TutorialDoc,
  isTutorialDocument,
  Tutorial,
  isTutorialEdit
} from "./tutorial";
import { PrizeInfo } from "./raffle";

export type QuizId = string;
export type QuizDoc = {
  questionCount: number;
  name: string;
  tutorial: TutorialDoc;
  questions: QuestionDoc[];
  defaultRaffle: PrizeInfo;
};

export type QuizJson = {
  questionCount: number;
  name: string;
  tutorial: { header: string; body: string };
  defaultRaffle: PrizeInfo;
};

export function isRaffleInfo(data: unknown): data is PrizeInfo {
  const asEdit = data as PrizeInfo;
  return typeof asEdit.prize === "string" && typeof asEdit.requirement === "number";
}

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
    isTutorialDocument(data.tutorial) &&
    "defaultRaffle" in data &&
    isRaffleInfo(data.defaultRaffle)
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
    isTutorialDocument(data.tutorial) &&
    "defaultRaffle" in data &&
    isRaffleInfo(data.defaultRaffle)
  );
}

export function isQuizEdit(data: unknown): data is QuizJson {
  if (data === null || typeof data !== "object") {
    return false;
  }

  const asEdit = data as QuizJson;

  return (
    data &&
    typeof data === "object" &&
    "name" in asEdit &&
    typeof asEdit.name === "string" &&
    "questionCount" in asEdit &&
    typeof asEdit.questionCount === "number" &&
    "tutorial" in asEdit &&
    isTutorialEdit(asEdit.tutorial) &&
    "defaultRaffle" in asEdit &&
    isRaffleInfo(asEdit.defaultRaffle)
  );
}

// Based on https://stackoverflow.com/a/19270021
function getRandom<T>(arr: T[], n: number): T[] {
  const result = new Array(n);
  let len = arr.length;
  const taken = new Array(len);

  if (n > len) {
    n = len;
  }

  while (n-- > 0) {
    const x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }

  return result;
}

export class DefaultRaffleInfo implements PrizeInfo {
  prize: string;
  requirement: number;

  constructor(params: { prize: string; requirement: number }) {
    const { prize, requirement } = params;

    this.prize = prize;
    this.requirement = requirement;
  }

  toJSON() {
    const { prize, requirement } = this;

    return { prize, requirement };
  }

  toDatastore() {
    const { prize, requirement } = this;

    return { prize, requirement };
  }

  static fromJSON(json: PrizeInfo): DefaultRaffleInfo {
    const { prize, requirement } = json;

    return new DefaultRaffleInfo({
      prize: `${prize}`,
      requirement
    });
  }

  static fromDatastore(data: PrizeInfo): DefaultRaffleInfo {
    const { prize, requirement } = data;

    const dr = new DefaultRaffleInfo({
      prize,
      requirement
    });

    return dr;
  }
}

export class Quiz extends Model {
  id: QuizId;
  name: string;
  questionCount: number;
  questions: Question[];
  tutorial: Tutorial;
  defaultRaffle: DefaultRaffleInfo;

  constructor(params: {
    id: string;
    name: string;
    questions: Question[];
    questionCount: number;
    tutorial: Tutorial;
    defaultRaffle: DefaultRaffleInfo;
  }) {
    const {
      id,
      name,
      questions,
      questionCount,
      tutorial,
      defaultRaffle
    } = params;

    super(id);

    this.name = name;
    this.questions = questions;
    this.questionCount = questionCount;
    this.tutorial = tutorial;
    this.defaultRaffle = defaultRaffle;
  }

  toRandomizedJSON() {
    const { id, questions, name, questionCount, tutorial } = this;

    const length = Math.min(questions.length, questionCount);

    if (length !== questionCount) {
      console.warn(
        `Too few questions for given question count in quiz ${name}.`
      );
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
    const {
      id,
      questions,
      name,
      questionCount,
      tutorial,
      defaultRaffle
    } = this;

    return {
      id,
      name,
      questionCount,
      questions: questions.sort((a, b) => a.creationTime - b.creationTime).map(q => q.toJSON()),
      tutorial: tutorial.toJSON(),
      defaultRaffle: defaultRaffle.toJSON()
    };
  }

  static fromJSON(id: string, quizJson: QuizJson): Quiz {
    const { name, questionCount, tutorial, defaultRaffle } = quizJson;

    const quiz = new Quiz({
      id,
      questions: [],
      questionCount: questionCount,
      name,
      tutorial: Tutorial.fromJSON(tutorial),
      defaultRaffle: DefaultRaffleInfo.fromJSON(defaultRaffle)
    });

    return quiz;
  }

  static fromDatastore(
    id: string,
    quizDoc: QuizDoc
  ): (questions: Question[]) => Quiz {
    const { name, questionCount, tutorial, defaultRaffle } = quizDoc;

    return (questions: Question[]) => {
      const quiz = new Quiz({
        id,
        questions,
        questionCount,
        name,
        tutorial: Tutorial.fromDatastore(tutorial),
        defaultRaffle: DefaultRaffleInfo.fromDatastore(defaultRaffle)
      });

      return quiz;
    };
  }

  toDatastore() {
    const { name, questionCount, tutorial, defaultRaffle } = this;

    return { name, questionCount, tutorial: tutorial.toDatastore(), defaultRaffle: defaultRaffle.toDatastore() };
  }
}
