import { V1DB } from "../db";
import { ToS, isToSDocument } from "./models/tos";
import { ApiError } from "../../api/util";

export class ToSDB {
  private db: V1DB;

  constructor(db: V1DB) {
    this.db = db;
  }

  async updateToS(tos: ToS) {
    await this.db
      .tos()
      .doc(tos.id)
      .set(tos.toDatastore());
  }

  async getToS(platform: "hotshot" | "quiz"): Promise<ToS | null> {
    const tosDoc = await this.db
      .tos()
      .doc(platform)
      .get();

    if (!tosDoc.exists) {
      throw ApiError.notFound("No ToS document found.");
    }

    if (!isToSDocument(tosDoc)) {
      throw ApiError.internalError("Invalid ToS document found in database.");
    }

    return ToS.fromDatastore(tosDoc.id, tosDoc.data());
  }
}
