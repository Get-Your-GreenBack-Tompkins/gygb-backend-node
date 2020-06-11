import { Model } from "../../model";

export type ToSDoc = {
  link: string;
  version: string;
};

export type ToSJSON = {
  platform: string;
  link: string;
  version: string;
};

export enum ToSPlatform {
  IOS = "ios",
  WEB = "quiz"
}

export function isToSDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<ToSDoc> {
  const data = doc.data();

  if (!data) {
    return false;
  }

  const hasVersion = "version" in data && typeof data.version === "string";

  const hasLink = "link" in data && typeof data.link === "string";

  return hasVersion && hasLink;
}

export function isToSQueryDocument(
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.QueryDocumentSnapshot<ToSDoc> {
  return isToSDocument(doc);
}

export class ToS extends Model {
  link: string;
  version: string;

  constructor(id: string) {
    super(id);
  }

  toJSON() {
    const { id: platform, version, link } = this;

    return {
      platform,
      version,
      link
    };
  }

  toDatastore() {
    const { link, version } = this;

    return {
      version,
      link
    };
  }

  static fromJSON(json: ToSJSON) {
    const tos = new ToS(json.platform);

    tos.link = json.link;
    tos.version = json.version;

    return tos;
  }

  static fromDatastore(id: string, doc: ToSDoc) {
    const tos = new ToS(id);

    tos.link = doc.link;
    tos.version = doc.version;

    return tos;
  }
}
