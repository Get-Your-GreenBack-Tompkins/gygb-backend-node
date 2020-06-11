import firebase from "./firebase";

export enum Collection {
  USERS = "users",
  QUIZ = "quiz",
  ADMINS = "admins",
  SESSIONS = "sessions",
  TOS = "tos",
  META = "meta",
}

export abstract class MigratableDB {
  protected db: GreenBackDB;
  protected abstract async migrateHook(versionTo: number): Promise<void>;

  constructor(db: GreenBackDB) {
    this.db = db;
  }

  async migrate(db: GreenBackDB): Promise<void> {
    const versionTo = await db.apiVersion();
    const versionFrom = await db.currentVersion();

    if (versionTo > versionFrom) {
      console.log(`Migrating from ${versionFrom} to ${versionTo}...`);
    } else {
      return;
    }

    for (let x = versionFrom + 1; x <= versionTo; x++) {
      console.log(
        `Migrating ${db.constructor.name} from ${versionFrom} to ${versionTo}...`
      );
      await this.migrateHook(x);
    }

    await db.meta().doc("db-info").set({
      currentVersion: versionTo,
    });

    console.log(`Migration from ${versionFrom} to ${versionTo} complete.`);
  }
}

export class GreenBackDB {
  private _db: FirebaseFirestore.Firestore;

  constructor() {
    this._db = firebase.firestore();
  }

  get raw() {
    return this._db;
  }

  async currentVersion(): Promise<number> {
    const dbInfo = await this.meta().doc("db-info").get();

    if (!dbInfo.exists) {
      return 0;
    }

    return dbInfo.data().currentVersion || 0;
  }

  async apiVersion(): Promise<number> {
    return 1;
  }

  meta() {
    return this._db.collection(Collection.META);
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
