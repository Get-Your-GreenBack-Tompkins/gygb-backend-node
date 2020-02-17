import { V1DB } from "../db";

import { Quiz, isQuizDocument } from "./models/quiz";
import { isAnswerDocument, AnswerDoc, Answer } from "./models/answer";
import { isQuestionDocument, Question } from "./models/question";

export class QuizDB {
  private db: V1DB;

  constructor(db: V1DB) {
    this.db = db;
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

      const answerData = await d.collection("answers").get();

      const answers = answerData.docs
        .filter((d): d is FirebaseFirestore.QueryDocumentSnapshot<AnswerDoc> =>
          isAnswerDocument(d)
        )
        .map(d => Answer.fromDatastore(d.id, d.data()));

      const question = Question.fromDatastore(
        questionDoc.id,
        questionDoc.data()
      )(answers);

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
