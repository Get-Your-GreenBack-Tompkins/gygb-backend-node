import { V1DB } from "../db";

import { ApiError } from "../../api/util";

import { MigratableDB } from "../../db";

import { Quiz, isQuizDocument } from "./models/quiz";
import { Answer } from "./models/answer";
import { isQuestionDocument, Question } from "./models/question";
import { RichText } from "../models/richtext";
import { Raffle, isRaffleQueryDocument, RaffleDoc, isRaffleDocument, RaffleEntrant } from "./models/raffle";
import { Tutorial } from "./models/tutorial";

export enum QuizCollection {
  QUESTIONS = "questions",
  RAFFLES = "raffles",
}

export enum QuizRaffleCollection {
  SUBSCRIBERS = "subscribers",
}

export class QuizError {
  constructor(private message: string) {}

  toJSON() {
    const { message } = this;
    return { message };
  }
}

const quizzes = new Map<string, QuizDB>();

export function getQuizDB(quizId: string): QuizDB | null {
  return quizzes.get(quizId) || null;
}

export async function queryQuiz(quizId: string, db: V1DB): Promise<Quiz> {
  const quizDoc = await db.quiz().doc(quizId);

  const quizData = await quizDoc.get();
  const questionCollection = await quizDoc.collection(QuizCollection.QUESTIONS).listDocuments();

  const unresolvedQuestions = questionCollection.map(async (d) => {
    const questionDoc = await d.get();

    if (!isQuestionDocument(questionDoc)) {
      throw ApiError.internalError(`Invalid question document ${d.id} in quiz ${quizId}`);
    }

    const question = Question.fromDatastore(questionDoc.id, questionDoc.data());

    // Setup creation time for sane sorting in admin panel.
    question.creationTime = questionDoc.createTime.seconds;

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

export class QuizDB extends MigratableDB {

  private quizId: string;
  private quiz: Quiz;

  constructor(db: V1DB, quizId: string) {
    super(db);

    this.quizId = quizId;
  }

  protected async migrateHook(versionTo: number): Promise<void> {
    const { quizId } = this;
    switch (versionTo) {
      case 2:
          await this.db.quiz().doc(quizId).update({
             defaultRaffle: {
               prize: "Default Prize",
               requirement: 0.6
             }
          });
        break;
    }
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
      .collection(QuizCollection.QUESTIONS)
      .onSnapshot(
        () => {
          queryQuiz(quizId, db)
            .then((quiz) => {
              console.log(`Updating quiz: ${quizId}`);
              this.quiz = quiz;
            })
            .catch((err) => console.log(err));
        },
        (error) => {
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
        (doc) => {
          queryQuiz(doc.id, db)
            .then((quiz) => {
              console.log(`Updating quiz: ${quizId}`);
              this.quiz = quiz;
            })
            .catch((err) => console.log(err));
        },
        (error) => {
          console.error(error);

          console.log("Restarting quiz listeners...");
          this._quizSubscription = null;
          this._quizListen();
        }
      );
  }

  _raffle: Raffle | null = null;
  _raffleSubscription: Subscription = null;
  _raffleMonth = -1;
  _raffleYear = -1;

  async getCurrentRaffle(cache: boolean = true, generate: boolean = true): Promise<Raffle> {
    const { quizId } = this;

    const currentDate = new Date();

    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();

    const startDate = new Date();
    startDate.setUTCFullYear(currentYear, currentMonth, 1);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date();
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
      if (generate) {
        console.log("No raffle found, attempting to generate the raffle automatically...");

        if (!this.quiz.defaultRaffle) {
          throw new Error("No default raffle options exist! You must manually create the raffle.");
        }

        const id = await this.newRaffle(this.quiz.defaultRaffle.prize, this.quiz.defaultRaffle.requirement);
        console.log("id: ", id);
        return await this.getCurrentRaffle(false, false);
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
        (potentialRaffles) => {
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
        (error) => console.error(error)
      );

    this._raffle = raffle;
    this._raffleMonth = startDate.getUTCMonth();
    this._raffleYear = startDate.getUTCFullYear();

    return raffle;
  }

  async getRafflesNoCache() {
    const { quizId } = this;

    const raffleDocs = await this.db.quiz().doc(quizId).collection(QuizCollection.RAFFLES).listDocuments();

    const rawRaffles = await Promise.all(raffleDocs.map(async (r) => [r.id, await r.get()] as const));

    const raffles = rawRaffles
      .filter(
        (val): val is [string, FirebaseFirestore.DocumentSnapshot<RaffleDoc>] =>
          val[1].exists && isRaffleDocument(val[1])
      )
      .map(([id, doc]) => {
        return Raffle.fromDatastore(id, doc.data());
      });

    return raffles;
  }

  async addToRaffle({
    raffleId,
    firstName,
    lastName,
    email,
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
        email,
      })
    ).id;
  }

  async newRaffle(prize: string, requirement: number): Promise<string> {
    const { quizId } = this;

    if (await this.getCurrentRaffle(false, false)) {
      throw new Error("A raffle already exists!");
    }

    const currentDate = new Date();

    const currentMonth = currentDate.getUTCMonth();
    const currentYear = currentDate.getUTCFullYear();

    const startDate = new Date();
    startDate.setUTCFullYear(currentYear, currentMonth, 1);
    startDate.setUTCHours(0, 0, 0, 0);

    const raffleDoc = this.db.quiz().doc(quizId).collection(QuizCollection.RAFFLES).doc();

    const raffle = new Raffle({ id: raffleDoc.id, prize, requirement, month: startDate });

    await raffleDoc.set(raffle.toDatastore());

    return raffleDoc.id;
  }

  async editRaffle(raffleEdit: { requirement?: number; prize?: string } = {}) {
    const { quizId } = this;
    const raffle = await this.getCurrentRaffle(false, false);
    await this.db
      .quiz()
      .doc(quizId)
      .collection(QuizCollection.RAFFLES)
      .doc(raffle.id)
      .set(
        {
          ...raffleEdit,
        },
        { mergeFields: ["requirement", "prize"] }
      );
  }

  async setRaffleWinner(entrant: RaffleEntrant) {
    const { quizId } = this;
    const raffle = await this.getCurrentRaffle(false, false);
    const raffleDoc = await this.db.quiz().doc(quizId).collection(QuizCollection.RAFFLES).doc(raffle.id);

    await raffleDoc
      .collection(QuizRaffleCollection.SUBSCRIBERS)
      .doc(entrant.id)
      .set(
        {
          winner: true,
        },
        { mergeFields: ["winner"] }
      );

    await raffleDoc.set(
      {
        winner: entrant,
      },
      {
        mergeFields: ["winner"],
      }
    );
  }

  async getRaffleEntrants() {
    const { quizId } = this;
    const raffle = await this.getCurrentRaffle(false);
    const query = await this.db
      .quiz()
      .doc(quizId)
      .collection(QuizCollection.RAFFLES)
      .doc(raffle.id)
      .collection(QuizRaffleCollection.SUBSCRIBERS)
      .get();

    const entrants = query.docs
      .map((d) => [d.id, d.data()] as const)
      .map(([id, { firstName, lastName, email }]) => ({
        id,
        firstName: firstName as string,
        lastName: lastName as string,
        email: email as string,
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

    const document = result.doc();

    const question = new Question({
      id: document.id,
      answers: [],
      body: new RichText(),
      header: "New Question",
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
      Object.keys(answers).map(async (questionId) => {
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
        total: correct.length,
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

    const answer = question.answers.find((a) => a.id === answerId);

    return answer || null;
  }

  async addAnswer(questionId: string): Promise<number> {
    const { quizId } = this;
    const quizDoc = await this.db.quiz().doc(quizId);
    const result = await quizDoc.collection(QuizCollection.QUESTIONS).doc(questionId);

    const doc = await result.get();

    if (!doc.exists || !isQuestionDocument(doc)) {
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
    const result = await quizDoc.collection(QuizCollection.QUESTIONS).doc(questionId);
    const doc = await result.get();

    if (!doc.exists || !isQuestionDocument(doc)) {
      throw ApiError.internalError(`Invalid question (${questionId}) in quiz (${quizId})!`);
    }

    const question = Question.fromDatastore(result.id, doc.data());

    const answerIndex = question.answers.findIndex((a) => a.id === answerId);

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

    const { header, body, answers } = question.toDatastore();
    const update = { header, body, answers };

    const result = await quizDoc.collection(QuizCollection.QUESTIONS).doc(question.id);

    if ((await result.get()).exists) {
      const metrics = await result.set(update, {
        mergeFields: ["body", "header", "answers"],
      });
      return metrics.writeTime.nanoseconds;
    }

    throw ApiError.invalidRequest(`${question.id} is not a valid question in ${quizId}!`);
  }

  async updateQuiz(quiz: Quiz): Promise<number> {
    const { quizId } = this;
    const quizDoc = await this.db.quiz().doc(quizId);

    const { name, questionCount, tutorial, defaultRaffle } = quiz.toDatastore();
    const update = { name, questionCount, tutorial, defaultRaffle };

    const result = await quizDoc.set(update, {
      mergeFields: ["name", "questionCount", "tutorial", "defaultRaffle"],
    });

    return result.writeTime.nanoseconds;
  }
}

export function registerQuizDB(db: V1DB, quizId: string) {
  const quiz = new QuizDB(db, quizId);

  quizzes.set(quizId, quiz);

  return quiz;
}
