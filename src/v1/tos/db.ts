import { MigratableDB } from "../../db";

import { V1DB } from "../db";
import { ToS, isToSDocument } from "./models/tos";
import { ApiError } from "../../api/util";

export class ToSDB extends MigratableDB {
  constructor(db: V1DB) {
    super(db);
  }

  protected async migrateHook(versionTo: number): Promise<void> {
    switch (versionTo) {
      case 1:
        for (const id of ["hotshot", "quiz"]) {
          await this.db.tos().doc(id).update({
            link: "https://example.com"
          });
        }
        break;
    }
  }

  async updateToS(tos: ToS) {
    await this.db.tos().doc(tos.id).set(tos.toDatastore());
  }

  async getToS(platform: "hotshot" | "quiz"): Promise<ToS | null> {
    const tosDoc = await this.db.tos().doc(platform).get();

    if (!tosDoc.exists) {
      throw ApiError.notFound("No ToS document found.");
    }

    if (!isToSDocument(tosDoc)) {
      throw ApiError.internalError("Invalid ToS document found in database.");
    }

    return ToS.fromDatastore(tosDoc.id, tosDoc.data());
  }
}
