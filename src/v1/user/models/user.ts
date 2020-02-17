import { Model } from "../../model";

export type UserDoc = {
  email: string;
  marketingConsent: boolean;
  photoConsent: boolean;
  sources: string[];
};

export enum UserSource {
  IOS = "ios",
  WEB = "web"
}

export function isUserDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<UserDoc> {
  const data = doc.data();

  const hasEmail = "email" in data && typeof data.email === "string";
  const hasSources =
    "sources" in data &&
    Array.isArray(data.sources) &&
    data.sources.every(d => d === UserSource.IOS || UserSource.WEB);
  const hasMarketingConsent =
    "marketingConsent" in data && typeof data.marketingConsent === "boolean";
  const hasPhotoConsent =
    "photoConsent" in data && typeof data.photoConsent === "boolean";

  return hasEmail && hasSources && hasMarketingConsent && hasPhotoConsent;
}

export function isUserQueryDocument(
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.QueryDocumentSnapshot<UserDoc> {
  return isUserDocument(doc);
}

export class User extends Model {
  id: string;
  email: string;
  sources: UserSource[];
  marketingConsent: boolean;
  photoConsent: boolean;

  toJSON() {
    const { id, email, sources, marketingConsent, photoConsent } = this;

    return {
      id,
      email,
      sources,
      marketingConsent,
      photoConsent
    };
  }

  toDatastore() {
    const { email, marketingConsent, photoConsent } = this;

    return {
      email,
      marketingConsent,
      photoConsent
    };
  }

  static fromDatastore(id: string, doc: UserDoc) {
    const user = new User();

    user.id = id;
    user.email = doc.email;
    user.marketingConsent = doc.marketingConsent;
    user.photoConsent = doc.photoConsent;
    user.sources = doc.sources.map(s => s as UserSource);

    return user;
  }
}
