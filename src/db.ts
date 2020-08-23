import { firestore } from "firebase-admin";

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
        `Migrating ${this.constructor.name} to version ${x}...`
      );
      await this.migrateHook(x);
    }
  }
}

export class GreenBackDB {
  private _db: firestore.Firestore;

  constructor(firestore: firestore.Firestore) {
    this._db = firestore;
  }

  get raw() {
    return this._db;
  }

  async finishMigrations() {
    const versionTo = await this.apiVersion();
    const versionFrom = await this.currentVersion();

    await this.meta().doc("db-info").set({
      currentVersion: versionTo,
    });
  
    if (versionFrom !== versionTo) {
      console.log(`Migration from ${versionFrom} to ${versionTo} complete.`);
    } else {
      console.log(`Initialized with API v${versionTo}`);
    }
  }

  async currentVersion(): Promise<number> {
    const dbInfo = await this.meta().doc("db-info").get();

    if (!dbInfo.exists) {
      return 0;
    }

    return dbInfo.data().currentVersion || 0;
  }

  async apiVersion(): Promise<number> {
    return 2;
  }

  async corsWhitelist(): Promise<string[]> {
    const config = await this.meta().doc("site-config").get();

    // Default to an empty whitelist if not setup.
    if (!config.exists) {
      return [];
    }

    return config.data().corsWhitelist || [];
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
