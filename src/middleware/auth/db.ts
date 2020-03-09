import { ApiError } from "../../api/util";

import { GreenBackDB } from "../../db";

import { Admin, isAdminQueryDocument } from "./models/admin";

export class AuthDB {
  private db: GreenBackDB;

  constructor(db: GreenBackDB) {
    this.db = db;
  }

  async getAdmin(uid: string): Promise<Admin | null> {
    const result = await this.db
      .admins()
      .where("uid", "==", uid)
      .get();

    const len = result.size;

    if (len > 1) {
      throw ApiError.internalError(
        "Multiple administrators found with the same UID!"
      );
    } else if (len == 0) {
      return null;
    }

    const [adminData] = result.docs;

    if (!isAdminQueryDocument(adminData)) {
      throw ApiError.internalError(`Invalid admin document for UID: (${uid})!`);
    }

    const admin = Admin.fromDatastore(adminData.id, adminData.data());

    return admin;
  }

  async isAdmin(uid: string): Promise<boolean> {
    const result = await this.db
      .admins()
      .where("uid", "==", uid)
      .get();

    const len = result.size;

    if (len > 1) {
      throw ApiError.internalError(
        "Multiple administrators found with the same UID!"
      );
    } else {
      return len !== 0;
    }
  }
}
