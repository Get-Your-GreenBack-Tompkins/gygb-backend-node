import { V1DB } from "../db";

import { Quiz, isQuizDocument } from "./models/quiz";
import { isAnswerDocument, AnswerDoc, Answer, isAnswer } from "./models/answer";
import { isQuestionDocument, Question } from "./models/question";
import { RichText } from "./models/richtext";

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

  async deleteQuestion(quizId: string, questionId: string) {
    const quizDoc = await this.db.quiz().doc(quizId);

    const result = quizDoc.collection("questions");

    await result.doc(questionId).delete();
  }

  async addQuestion(quizId: string) {
    const quizDoc = await this.db.quiz().doc(quizId);
    const quizData = await quizDoc.get();

    if (!isQuizDocument(quizData)) {
      throw new Error("Invalid quiz.");
    }

    const result = await quizDoc.collection("questions");

    const questions = await result.listDocuments();
    const question = new Question();
    const number = questions.length + 1;
    question.answers = [];
    question.body = new RichText();
    question.header = new RichText(`Question ${number}`);
    question.order = number;
    question.answerId = 0;
    await result.add(question.toDatastore());
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
