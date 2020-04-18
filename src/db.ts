import firebase from "./firebase";

export enum Collection {
  USERS = "users",
  QUIZ = "quiz",
  ADMINS = "admins"
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

  users() {
    return this._db.collection(Collection.USERS);
  }

  quiz() {
    return this._db.collection(Collection.QUIZ);
  }
}
