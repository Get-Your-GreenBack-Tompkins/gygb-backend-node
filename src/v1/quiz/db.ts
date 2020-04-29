import { V1DB } from "../db";

import { ApiError } from "../../api/util";

import { Quiz, isQuizDocument } from "./models/quiz";
import { Answer } from "./models/answer";
import { isQuestionDocument, Question } from "./models/question";
import { RichText } from "../models/richtext";
import { Raffle, isRaffleQueryDocument } from "./models/raffle";
import { Tutorial } from "./models/tutorial";

export enum QuizCollection {
  QUESTIONS = "questions",
  RAFFLES = "raffles"
}

export enum QuizRaffleCollection {
  SUBSCRIBERS = "subscribers"
}

export class QuizError {
  constructor(private message: string) {}

  toJSON() {
    const { message } = this;
    return { message };
  }
}

const quizzes = new Map<string, QuizDB>();

export function registerQuizDB(db: V1DB, quizId: string) {
  const quiz = new QuizDB(db, quizId);

  quizzes.set(quizId, quiz);

  return quiz;
}

export function getQuizDB(quizId: string): QuizDB | null {
  return quizzes.get(quizId) || null;
}

export async function queryQuiz(quizId: string, db: V1DB): Promise<Quiz> {
  const quizDoc = await db.quiz().doc(quizId);

  const quizData = await quizDoc.get();
  const questionCollection = await quizDoc.collection(QuizCollection.QUESTIONS).listDocuments();

  const unresolvedQuestions = questionCollection.map(async d => {
    const questionDoc = await d.get();

    if (!isQuestionDocument(questionDoc)) {
      throw ApiError.internalError(`Invalid question document ${d.id} in quiz ${quizId}`);
    }

    const question = Question.fromDatastore(questionDoc.id, questionDoc.data());

    return question;
  });

  const questions = await Promise.all(unresolvedQuestions);

  if (!isQuizDocument(quizData)) {
    throw ApiError.internalError(`Invalid quiz document (${quizId})`);
  }

  const quiz = Quiz.fromDatastore(quizData.id, quizData.data())(questions);

  return quiz;
}

type Subscription = (() => void) | null;

export class QuizDB {
  private db: V1DB;
  private quizId: string;
  private quiz: Quiz;

  constructor(db: V1DB, quizId: string) {
    this.db = db;
    this.quizId = quizId;
  }

  async getQuizNoCache(): Promise<Quiz> {
    const { quizId } = this;
    return await queryQuiz(quizId, this.db);
  }

  getQuiz(): Quiz {
    return this.quiz;
  }

  async getTutorial(): Promise<Tutorial> {
    const quiz = await this.getQuiz();

    return quiz.tutorial;
  }

  async listen() {
    const { quizId, db } = this;
    this._questionListen();
    this._quizListen();

    const quiz = await queryQuiz(quizId, db);
    this.quiz = quiz;
  }

  _questionsSubscription: Subscription = null;

  _questionListen() {
    const { quizId, db } = this;
    if (this._questionsSubscription) {
      this._questionsSubscription();
      this._questionsSubscription = null;
    }

    // Listen for question changes.
    this._questionsSubscription = this.db
      .quiz()
      .doc(quizId)
      .collection("questions")
      .onSnapshot(
        () => {
          queryQuiz(quizId, db)
            .then(quiz => {
              console.log(`Updating quiz: ${quizId}`);
              this.quiz = quiz;
            })
            .catch(err => console.log(err));
        },
        error => {
          console.error(error);

          console.log("Restarting question listeners...");
          this._questionsSubscription = null;
          this._questionListen();
        }
      );
  }

  _quizSubscription: Subscription = null;

  _quizListen() {
    const { quizId, db } = this;
    if (this._quizSubscription) {
      this._quizSubscription();
      this._quizSubscription = null;
    }

    // Listen for quiz changes.
    this._quizSubscription = this.db
      .quiz()
      .doc(quizId)
      .onSnapshot(
        doc => {
          queryQuiz(doc.id, db)
            .then(quiz => {
              console.log(`Updating quiz: ${quizId}`);
              this.quiz = quiz;
            })
            .catch(err => console.log(err));
        },
        error => {
          console.error(error);

          console.log("Restarting quiz listeners...");
          this._quizSubscription = null;
          this._quizListen();
        }
      );
  }

  _raffle: Raffle | null = null;
  _raffleSubscription: Subscription = null;
  _raffleMonth: number = -1;
  _raffleYear: number = -1;

  async getCurrentRaffle(cache: boolean = true) {
    const { quizId } = this;

    const currentDate = new Date();

    let currentMonth = currentDate.getUTCMonth();
    let currentYear = currentDate.getUTCFullYear();

    let startDate = new Date();
    startDate.setUTCFullYear(currentYear, currentMonth, 1);
    startDate.setUTCHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setUTCFullYear(currentYear, currentMonth + 1, 1);
    endDate.setUTCHours(23, 59, 59, 0);

    if (currentMonth !== this._raffleMonth || currentYear !== this._raffleYear) {
      if (this._raffleSubscription) {
        this._raffleSubscription();
      }

      this._raffle = null;
    }

    if (this._raffle && cache) {
      return this._raffle;
    }

    const potentialRaffles = await this.db
      .quiz()
      .doc(quizId)
      .collection(QuizCollection.RAFFLES)
      .where("month", ">=", startDate)
      .where("month", "<", endDate)
      .get();

    if (potentialRaffles.size == 0) {
      console.log("none found :(");
      if (cache) {
        this._raffle = null;
      }
      return null;
    }

    if (potentialRaffles.size > 1) {
      throw new Error("Somehow we have multiple raffles in a single month. This should not occur.");
    }

    const [raffleDoc] = potentialRaffles.docs;

    if (!isRaffleQueryDocument(raffleDoc)) {
      throw new Error("Invalid raffle document found.");
    }

    const raffle = Raffle.fromDatastore(raffleDoc.id, raffleDoc.data());

    if (!cache) {
      return raffle;
    }

    if (this._raffleSubscription) {
      this._raffleSubscription();
      this._raffleSubscription = null;
    }

    this._raffleSubscription = this.db
      .quiz()
      .doc(quizId)
      .collection(QuizCollection.RAFFLES)
      .where("month", ">=", startDate)
      .where("month", "<", endDate)
      .onSnapshot(
        potentialRaffles => {
          if (potentialRaffles.size == 0) {
            this._raffle = null;
            return;
          }

          if (potentialRaffles.size > 1) {
            throw new Error("Somehow we have multiple raffles in a single month. This should not occur.");
          }

          const [raffleDoc] = potentialRaffles.docs;

          if (!isRaffleQueryDocument(raffleDoc)) {
            throw new Error("Invalid raffle document found.");
          }

          const raffle = Raffle.fromDatastore(raffleDoc.id, raffleDoc.data());

          this._raffle = raffle;
        },
        error => console.error(error)
      );

    this._raffle = raffle;
    this._raffleMonth = startDate.getUTCMonth();
    this._raffleYear = startDate.getUTCFullYear();

    return raffle;
  }

  async addToRaffle({
    raffleId,
    firstName,
    lastName,
    email
  }: {
    raffleId: string;
    firstName: string;
    lastName: string;
    email: string;
  }) {
    const { quizId } = this;
    const subscribers = this.db
      .quiz()
      .doc(quizId)
      .collection(QuizCollection.RAFFLES)
      .doc(raffleId)
      .collection(QuizRaffleCollection.SUBSCRIBERS);

    const num = (await subscribers.where("email", "==", email.trim()).get()).size;

    if (num !== 0) {
      throw ApiError.invalidRequest(`Email ${email} already is subscribed to the raffle.`);
    }

    return (
      await subscribers.add({
        firstName,
        lastName,
        email
      })
    ).id;
  }

  async newRaffle(prize: string, requirement: number): Promise<string> {
    const { quizId } = this;

    if (await this.getCurrentRaffle()) {
      throw new Error("A raffle already exists!");
    }

    const currentDate = new Date();

    let currentMonth = currentDate.getUTCMonth();
    let currentYear = currentDate.getUTCFullYear();

    let startDate = new Date();
    startDate.setUTCFullYear(currentYear, currentMonth, 1);
    startDate.setUTCHours(0, 0, 0, 0);

    const raffleDoc = this.db
      .quiz()
      .doc(quizId)
      .collection(QuizCollection.RAFFLES)
      .doc();

    const raffle = new Raffle({ id: raffleDoc.id, prize, requirement, month: startDate });

    await raffleDoc.set(raffle.toDatastore());

    return raffleDoc.id;
  }

  async setRaffleWinner(id: string) {
    const { quizId } = this;
    const raffle = await this.getCurrentRaffle();
    const raffleDoc = await this.db
      .quiz()
      .doc(quizId)
      .collection(QuizCollection.RAFFLES)
      .doc(raffle.id);

    if (raffle.winner) {
      throw ApiError.invalidRequest("Raffle already has a winner!");
    }

    raffleDoc.set(
      {
        winner: id
      },
      {
        mergeFields: ["winner"]
      }
    );
  }

  async getRaffleEntrants() {
    const { quizId } = this;
    const raffle = await this.getCurrentRaffle();
    const query = await this.db
      .quiz()
      .doc(quizId)
      .collection(QuizCollection.RAFFLES)
      .doc(raffle.id)
      .collection(QuizRaffleCollection.SUBSCRIBERS)
      .get();

    const entrants = query.docs
      .map(d => [d.id, d.data()] as const)
      .map(([id, { firstName, lastName, email }]) => ({
        id,
        firstName: firstName as string,
        lastName: lastName as string,
        email: email as string
      }));

    return entrants;
  }

  async getQuestion(questionId: string): Promise<Question> {
    const { quizId } = this;

    const quizDoc = await this.db.quiz().doc(quizId);

    const questionDoc = quizDoc.collection(QuizCollection.QUESTIONS).doc(questionId);
    const questionData = await questionDoc.get();

    if (!isQuestionDocument(questionData)) {
      throw ApiError.internalError(`Invalid question (${questionId}) in quiz (${quizId})!`);
    }

    const question = Question.fromDatastore(questionData.id, questionData.data());

    return question;
  }

  async deleteQuestion(questionId: string) {
    const { quizId } = this;

    const quizDoc = await this.db.quiz().doc(quizId);

    const result = quizDoc.collection(QuizCollection.QUESTIONS);

    await result.doc(questionId).delete();
  }

  async addQuestion() {
    const { quizId } = this;

    const quizDoc = await this.db.quiz().doc(quizId);
    const quizData = await quizDoc.get();

    if (!isQuizDocument(quizData)) {
      throw ApiError.internalError(`Invalid quiz (${quizId})!`);
    }

    const result = quizDoc.collection(QuizCollection.QUESTIONS);

    const questions = await result.listDocuments();
    const number = questions.length + 1;

    const document = result.doc();

    const question = new Question({
      id: document.id,
      answers: [],
      body: new RichText(),
      header: `Question ${number}`,
      order: number,
      answerId: 0
    });

    await document.set(question.toDatastore());
  }

  async correctAnswers(answers: {
    [questionId: string]: number;
  }): Promise<{
    correct: number;
    incorrect: number;
    total: number;
  }> {
    const correct = await Promise.all(
      Object.keys(answers).map(async questionId => {
        return this.getAnswer(questionId, answers[questionId]);
      })
    );

    const stats = correct.reduce(
      (prev, next) => {
        if (next && next.correct) {
          prev.correct += 1;
        } else {
          prev.incorrect += 1;
        }

        return prev;
      },
      {
        correct: 0,
        incorrect: 0,
        total: correct.length
      }
    );

    return stats;
  }

  async getAnswer(questionId: string, answerId: number): Promise<Answer | null> {
    const { quizId } = this;
    const question = await this.getQuestion(questionId);

    if (!question) {
      throw ApiError.notFound(`No question found for ID ${questionId} in Quiz ${quizId}`);
    }

    const answer = question.answers.find(a => a.id === answerId);

    return answer || null;
  }

  async addAnswer(questionId: string): Promise<number> {
    const { quizId } = this;
    const quizDoc = await this.db.quiz().doc(quizId);
    const result = await quizDoc.collection(QuizCollection.QUESTIONS).doc(questionId);

    const doc = await result.get();

    if (!isQuestionDocument(doc)) {
      throw ApiError.internalError(`Invalid question (${questionId}) in quiz (${quizId})!`);
    }

    const question = Question.fromDatastore(result.id, doc.data());

    const nextId = question.answerId + 1;

    const answer = Answer.blank({ id: nextId });

    question.answers.push(answer);
    question.answerId = nextId;

    const { answers, answerId } = question.toDatastore();
    const update = { answers, answerId };

    await result.set(update, { mergeFields: ["answers", "answerId"] });

    return nextId;
  }

  async deleteAnswer(questionId: string, answerId: number) {
    const { quizId } = this;

    const quizDoc = await this.db.quiz().doc(quizId);
    const result = await quizDoc.collection("questions").doc(questionId);
    const doc = await result.get();

    if (!isQuestionDocument(doc)) {
      throw ApiError.internalError(`Invalid question (${questionId}) in quiz (${quizId})!`);
    }

    const question = Question.fromDatastore(result.id, doc.data());

    const answerIndex = question.answers.findIndex(a => a.id === answerId);

    if (answerIndex === -1) {
      throw ApiError.notFound(
        `Answer of ID ${answerId} not found in question ${questionId} of Quiz ${quizId}`
      );
    }

    question.answers.splice(answerIndex, 1);

    await result.set(question.toDatastore());
  }

  async updateQuestion(question: Question): Promise<number> {
    const { quizId } = this;
    const quizDoc = await this.db.quiz().doc(quizId);

    const { header, body, order, answers } = question.toDatastore();
    const update = { header, body, order, answers };

    const result = await quizDoc
      .collection(QuizCollection.QUESTIONS)
      .doc(question.id)
      .set(update, {
        mergeFields: ["body", "header", "order", "answers"]
      });

    return result.writeTime.nanoseconds;
  }

  async updateQuiz(quiz: Quiz): Promise<number> {
    const { quizId } = this;
    const quizDoc = await this.db.quiz().doc(quizId);

    const { name, questionCount, tutorial } = quiz.toDatastore();
    const update = { name, questionCount, tutorial };

    const result = await quizDoc.set(update, {
      mergeFields: ["name", "questionCount", "tutorial"]
    });

    return result.writeTime.nanoseconds;
  }
}
