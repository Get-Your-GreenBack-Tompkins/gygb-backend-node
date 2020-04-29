import { Model } from "../../model";

import { RichText, RichTextData, isRichTextData } from "../../models/richtext";

export type ToSDoc = {
  text: RichTextData;
  version: string;
};

export type ToSJSON = {
  platform: string;
  text: string;
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

  const hasText = "text" in data && isRichTextData(data.text);

  return hasVersion && hasText;
}

export function isToSQueryDocument(
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.QueryDocumentSnapshot<ToSDoc> {
  return isToSDocument(doc);
}

export class ToS extends Model {
  text: RichText;
  version: string;

  constructor(id: string) {
    super(id);
  }

  toJSON() {
    const { id: platform, version, text } = this;

    return {
      platform,
      version,
      text
    };
  }

  toDatastore() {
    const { text, version } = this;

    return {
      version,
      text: text.toDatastore()
    };
  }

  static fromJSON(json: ToSJSON) {
    const tos = new ToS(json.platform);

    tos.text = RichText.fromJSON(json.text);
    tos.version = json.version;

    return tos;
  }

  static fromDatastore(id: string, doc: ToSDoc) {
    const tos = new ToS(id);

    tos.text = RichText.fromDatastore(doc.text);
    tos.version = doc.version;

    return tos;
  }
}
