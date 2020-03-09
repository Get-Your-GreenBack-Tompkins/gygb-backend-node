import { V1DB } from "../db";

import { ApiError } from "../../api/util";

import { Quiz, isQuizDocument } from "./models/quiz";
import { isAnswerDocument, AnswerDoc, Answer, isAnswer } from "./models/answer";
import { isQuestionDocument, Question } from "./models/question";
import { RichText } from "./models/richtext";

export enum QuizCollection {
  QUESTIONS = "questions"
}

export class QuizError {
  constructor(private message: string) {}

  toJSON() {
    const { message } = this;
    return { message };
  }
}

export class QuizDB {
  private db: V1DB;

  constructor(db: V1DB) {
    this.db = db;
  }

  async getQuestion(id: string, questionId: string): Promise<Question> {
    const quizDoc = await this.db.quiz().doc(id);

    const questionDoc = quizDoc
      .collection(QuizCollection.QUESTIONS)
      .doc(questionId);
    const questionData = await questionDoc.get();

    if (!isQuestionDocument(questionData)) {
      throw ApiError.internalError(
        `Invalid question (${questionId}) in quiz (${id})!`
      );
    }

    const question = Question.fromDatastore(
      questionData.id,
      questionData.data()
    );

    return question;
  }

  async deleteQuestion(quizId: string, questionId: string) {
    const quizDoc = await this.db.quiz().doc(quizId);

    const result = quizDoc.collection(QuizCollection.QUESTIONS);

    await result.doc(questionId).delete();
  }

  async addQuestion(quizId: string) {
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

  async correctAnswers(
    quizId: string,
    answers: { [questionId: string]: number }
  ): Promise<{
    correct: number;
    incorrect: number;
    total: number;
  }> {
    const correct = await Promise.all(
      Object.keys(answers).map(async questionId => {
        return this.isCorrect(quizId, questionId, answers[questionId]);
      })
    );

    const stats = correct.reduce(
      (prev, next) => {
        if (next) {
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

  async isCorrect(
    quizId: string,
    questionId: string,
    answerId: number
  ): Promise<boolean> {
    const question = await this.getQuestion(quizId, questionId);

    if (!question) {
      throw ApiError.notFound(
        `No question found for ID ${questionId} in Quiz ${quizId}`
      );
    }

    const { correct } = question.answers.find(a => a.id === answerId);

    return correct;
  }

  async addAnswer(quizId: string, questionId: string): Promise<number> {
    const quizDoc = await this.db.quiz().doc(quizId);
    const result = await quizDoc
      .collection(QuizCollection.QUESTIONS)
      .doc(questionId);

    const doc = await result.get();

    if (!isQuestionDocument(doc)) {
      throw ApiError.internalError(
        `Invalid question (${questionId}) in quiz (${quizId})!`
      );
    }

    const question = Question.fromDatastore(result.id, doc.data());

    const nextId = question.answerId + 1;

    const answer = Answer.blank({ id: nextId });

    question.answers.push(answer);
    question.answerId = nextId;

    const { answers, answerId } = question.toDatastore();
    const update = { answers, answerId };
    console.log(JSON.stringify(question.toDatastore(), null, 4));
    await result.set(update, { mergeFields: ["answers", "answerId"] });

    return nextId;
  }

  async deleteAnswer(quizId: string, questionId: string, answerId: number) {
    const quizDoc = await this.db.quiz().doc(quizId);
    const result = await quizDoc.collection("questions").doc(questionId);
    const doc = await result.get();

    if (!isQuestionDocument(doc)) {
      throw ApiError.internalError(
        `Invalid question (${questionId}) in quiz (${quizId})!`
      );
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

  async updateQuestion(quizId: string, question: Question): Promise<number> {
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

  async getQuiz(id: string): Promise<Quiz> {
    const quizDoc = await this.db.quiz().doc(id);

    const quizData = await quizDoc.get();
    const questionCollection = await quizDoc
      .collection(QuizCollection.QUESTIONS)
      .listDocuments();

    const unresolvedQuestions = questionCollection.map(async d => {
      const questionDoc = await d.get();

      if (!isQuestionDocument(questionDoc)) {
        throw ApiError.internalError(
          `Invalid question document ${d.id} in quiz ${id}`
        );
      }

      const question = Question.fromDatastore(
        questionDoc.id,
        questionDoc.data()
      );

      return question;
    });

    const questions = await Promise.all(unresolvedQuestions);

    if (!isQuizDocument(quizData)) {
      throw ApiError.internalError(`Invalid quiz document (${id})`);
    }

    const quiz = Quiz.fromDatastore(quizData.id, quizData.data())(questions);

    return quiz;
  }
}
