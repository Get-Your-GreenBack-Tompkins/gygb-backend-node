import { V1DB } from "../db";

export class UserDB {
  private db: V1DB;

  constructor(db: V1DB) {
    this.db = db;
  }
}
