import { ApiError } from "../../api/util";

import { auth } from "firebase-admin";

export class AuthDB {
  _auth: auth.Auth;

  constructor(auth: auth.Auth) {
    this._auth = auth;
  }

  async addAdmin(email: string) {
    try {
      const record = await this._auth.getUserByEmail(email);

      await this._auth.setCustomUserClaims(record.uid, { admin: true });
    } catch (err) {
      console.error(err);

      throw ApiError.notFound("No user was found under that email.");
    }
  }

  async removeAdmin(email: string) {
    const record = await this._auth.getUserByEmail(email);

    if (!record) {
      throw ApiError.notFound("No user was found under that email.");
    }

    await this._auth.setCustomUserClaims(record.uid, { admin: false });
  }

  async getAdmins(): Promise<string[]> {
    async function* getAllUsers(initialBatch: auth.ListUsersResult) {
      yield initialBatch.users;

      let batch = initialBatch;

      while (batch.pageToken) {
        batch = await this._auth.listUsers(undefined, batch.pageToken);

        yield batch.users;
      }
    }

    const users = [];

    const initialBatch = await this._auth.listUsers();

    for await (const usersBatch of getAllUsers(initialBatch)) {
      users.push(
        ...usersBatch.filter(u => {
          const claims = u.customClaims as { [key: string]: unknown };

          if (!claims) {
            return false;
          }

          return "admin" in claims && claims.admin === true;
        })
      );
    }

    return users.map(u => u.email);
  }
}
