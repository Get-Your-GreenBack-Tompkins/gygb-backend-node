import firebase from "./firebase";

export enum Collection {
  USERS = "users",
  QUIZ = "quiz",
  ADMINS = "admins",
  SESSIONS = "sessions",
  TOS = "tos"
}

export class GreenBackDB {
  private _db: FirebaseFirestore.Firestore;

  constructor() {
    this._db = firebase.firestore();
  }

  get raw() {
    return this._db;
  }

  admins() {
    return this._db.collection(Collection.ADMINS);
  }

  tos() {
    return this._db.collection(Collection.TOS);
  }

  users() {
    return this._db.collection(Collection.USERS);
  }

  quiz() {
    return this._db.collection(Collection.QUIZ);
  }

  sessions() {
    return this._db.collection(Collection.SESSIONS);
  }
}
