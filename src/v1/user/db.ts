import { V1DB } from "../db";
import {
  User,
  UserDoc,
  isUserQueryDocument,
  isUserDocument
} from "./models/user";

export class UserDB {
  private db: V1DB;

  constructor(db: V1DB) {
    this.db = db;
  }

  async createUser(user: UserDoc) {
    const addDoc = await this.db.users().add(user);
    const userDoc = await addDoc.get();

    if (!isUserDocument(userDoc)) {
      throw new Error("Failed to create a valid user document.");
    }

    return User.fromDatastore(userDoc.id, userDoc.data());
  }

  async getEmailList(): Promise<User[]> {
    const users = await this.db
      .users()
      .where("marketingConsent", "==", true)
      .get();

    const marketingUsers = users.docs
      .filter((d): d is FirebaseFirestore.QueryDocumentSnapshot<UserDoc> =>
        isUserQueryDocument(d)
      )
      .map(d => User.fromDatastore(d.id, d.data()));

    return marketingUsers;
  }

  async updateUser(user: User) {
    throw new Error("User updates not yet implemented!");
  }

  async getUser(email: string): Promise<User | null> {
    const users = await this.db
      .users()
      .where("email", "==", email)
      .get();

    if (users.docs.length > 1) {
      throw new Error("Multiple users exist with the same email!");
    }

    if (users.docs.length == 0) {
      return null;
    }

    const [userDoc] = users.docs;

    if (!isUserQueryDocument(userDoc)) {
      throw new Error("Invalid user document in database.");
    }

    return User.fromDatastore(userDoc.id, userDoc.data());
  }
}
