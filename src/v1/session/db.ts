import { V1DB } from "../db";
import {
  Session,
  SessionDoc,
  isSessionDocument,
} from "./models/session";
import { v4 as uuidv4 } from "uuid";

export class SessionDB {
  private db: V1DB;

  constructor(db: V1DB) {
    this.db = db;
  }

  async createSession(session: SessionDoc) {
    const newId = uuidv4();
    await this.db.sessions().doc(newId).set(session);
    const sessionDoc = await this.db.sessions().doc(newId).get();

    if (!isSessionDocument(sessionDoc)) {
      throw new Error("Failed to create a valid session document");
    }

    return Session.fromDatastore(sessionDoc.id, sessionDoc.data());
  }

  async updateSession(updates: { id: string; email: string; endTime: Date }) {

    const { id, email, endTime } = updates;

    const foundDoc = await this.db.sessions().doc(id);
    await foundDoc.update({ email, endTime });

    const updatedDoc = await this.db.sessions().doc(id).get();

    if (!isSessionDocument(updatedDoc)) {
      throw new Error("Failed to update session document");
    }

    return Session.fromDatastore(updatedDoc.id, updatedDoc.data());
  }

}