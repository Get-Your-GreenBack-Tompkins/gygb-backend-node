import { V1DB } from "../db";

import { Quiz, isQuizDocument } from "./models/quiz";
import { isAnswerDocument, AnswerDoc, Answer, isAnswer } from "./models/answer";
import { isQuestionDocument, Question } from "./models/question";
import { RichText } from "./models/richtext";

export enum QuizCollection {
  QUESTIONS = "questions"
}

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
      console.log("Document: ", questionData);
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

    const result = quizDoc.collection(QuizCollection.QUESTIONS);

    await result.doc(questionId).delete();
  }

  async addQuestion(quizId: string) {
    const quizDoc = await this.db.quiz().doc(quizId);
    const quizData = await quizDoc.get();

    if (!isQuizDocument(quizData)) {
      throw new Error("Invalid quiz.");
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

  async addAnswer(quizId: string, questionId: string) {
    const quizDoc = await this.db.quiz().doc(quizId);
    const result = await quizDoc.collection("questions").doc(questionId);
    const doc = await result.get();

    if (isQuestionDocument(doc)) {
      const question = Question.fromDatastore(result.id, doc.data());

      const nextId = question.answerId + 1;

      const answer = Answer.blank({ id: nextId });
      question.answers.push(answer);
      question.answerId = nextId;
      console.log(JSON.stringify(question.toDatastore(), null, 4));
      await result.set(question.toDatastore());

      return nextId;
    } else {
      throw new Error("Invalid question document.");
    }
  }

  async deleteAnswer(quizId: string, questionId: string, answerId: number) {
    const quizDoc = await this.db.quiz().doc(quizId);
    const result = await quizDoc.collection("questions").doc(questionId);
    const doc = await result.get();

    if (isQuestionDocument(doc)) {
      const question = Question.fromDatastore(result.id, doc.data());

      const answerIndex = question.answers.findIndex(a => a.id === answerId);
      if (answerIndex !== -1) {
        question.answers.splice(answerIndex, 1);

        await result.set(question.toDatastore());
      } else {
        throw new Error("Bad answer id.");
      }
    } else {
      throw new Error("Invalid question document.");
    }
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
        console.log(questionDoc.data());
        throw new Error("Invalid question in quiz! (2)");
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
