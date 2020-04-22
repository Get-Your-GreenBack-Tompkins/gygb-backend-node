import { RichText, RichTextData, isRichTextData } from "./richtext";

import Delta from "quill-delta";

export function header() {
  const delta = new Delta();

  delta.insert(header, { header: 2 });

  return delta;
}

export type TutorialId = string;
export type TutorialDoc = {
  body: RichTextData;
  header: string;
};

export type TutorialEdit = {
  body: string;
  header: string;
};

export type Unknown<K> = { [k in keyof K]: unknown };

export function isTutorialDocument(doc: unknown): doc is TutorialDoc {
  if (typeof doc !== "object" || !doc) {
    return false;
  }

  const data = doc as TutorialDoc;

  if (!data) {
    return false;
  }

  const hasBody = data.body && isRichTextData(data.body);
  const hasHeader = typeof data.header === "string";

  return hasBody && hasHeader;
}

export function isTutorialEdit(data: unknown): data is TutorialEdit {
  const asEdit = data as TutorialEdit;
  return typeof asEdit.body === "string" && typeof asEdit.header === "string";
}

export class Tutorial {
  header: string;
  body: RichText;

  constructor(params: { header: string; body: RichText }) {
    const { header, body } = params;

    this.header = header;
    this.body = body;
  }

  toDatastore(): TutorialDoc {
    return {
      body: this.body.toDatastore(),
      header: this.header
    };
  }

  static fromDatastore(data: TutorialDoc): Tutorial {
    const { header, body } = data;

    const q = new Tutorial({
      header,
      body: RichText.fromDatastore(body)
    });

    return q;
  }

  static fromJSON(id: TutorialId, data: TutorialEdit): Tutorial {
    const { header, body } = data;

    const q = new Tutorial({
      header,
      body: RichText.fromJSON(body)
    });

    return q;
  }

  toJSON() {
    const { body, header } = this;

    return {
      body,
      header
    };
  }
}
