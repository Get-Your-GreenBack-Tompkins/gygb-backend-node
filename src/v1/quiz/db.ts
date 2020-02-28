import { V1DB } from "../db";

import { Quiz, isQuizDocument } from "./models/quiz";
import { isAnswerDocument, AnswerDoc, Answer, isAnswer } from "./models/answer";
import { isQuestionDocument, Question } from "./models/question";

export class QuizDB {
  private db: V1DB;

  constructor(db: V1DB) {
    this.db = db;
  }

  async getQuestion(id: string, questionId: string): Promise<Question> {
    const quizDoc = await this.db.quiz().doc(id);

    const questionDoc = quizDoc.collection("questions").doc(questionId);
    const questionData = await questionDoc.get();

    if (!isQuestionDocument(questionData)) {
      throw new Error("Invalid question in quiz!");
    }

    const question = Question.fromDatastore(
      questionData.id,
      questionData.data()
    );

    return question;
  }

  async updateQuestion(quizId: string, question: Question): Promise<number> {
    const quizDoc = await this.db.quiz().doc(quizId);

    const result = await quizDoc
      .collection("questions")
      .doc(question.id)
      .set(question.toDatastore());

    return result.writeTime.nanoseconds;
  }

  async getQuiz(id: string): Promise<Quiz> {
    const quizDoc = await this.db.quiz().doc(id);

    const quizData = await quizDoc.get();
    const questionCollection = await quizDoc
      .collection("questions")
      .listDocuments();

    const unresolvedQuestions = questionCollection.map(async d => {
      const questionDoc = await d.get();

      if (!isQuestionDocument(questionDoc)) {
        throw new Error("Invalid question in quiz!");
      }

      const question = Question.fromDatastore(
        questionDoc.id,
        questionDoc.data()
      );

      return question;
    });

    const questions = await Promise.all(unresolvedQuestions);

    if (isQuizDocument(quizData)) {
      const quiz = Quiz.fromDatastore(quizData.id, quizData.data())(questions);

      return quiz;
    } else {
      throw new Error("Invalid quiz!");
    }
  }
}
