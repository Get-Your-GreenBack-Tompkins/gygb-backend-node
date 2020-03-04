import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import sanitize from "sanitize-html";

export type RichTextData = {
  delta: string;
  rendered: string;
  sanitized: string;
};

export function textToDelta(text: string) {
  return { ops: [{ insert: text }] };
}

export function renderDeltaString(delta: string) {
  // Parse the delta string.
  const parsedDelta = JSON.parse(delta);

  // We'll start with a quite restrictive subset of HTML.
  const opts = {
    allowedTags: ["b", "i", "em", "strong", "a"],
    allowedAttributes: {
      a: ["href"]
    }
  };

  // TODO Confirm ops exists.
  const converter = new QuillDeltaToHtmlConverter(parsedDelta.ops, {});
  const unsanitizedHtml = converter.convert();
  const sanitizedHtml = sanitize(unsanitizedHtml, opts);

  return { __superDangerousHtml: unsanitizedHtml, sanitizedHtml };
}

export function isRichTextData(data: unknown) {
  if (typeof data !== "object") {
    return false;
  }

  const asRTD = data as RichTextData;

  return (
    typeof asRTD.delta === "string" &&
    typeof asRTD.rendered === "string" &&
    typeof asRTD.sanitized === "string"
  );
}

export class RichText {
  // This isn't technically a "model" (it isn't a document)
  private delta: string;
  private rendered: string;
  private sanitized: string;

  constructor(text?: string) {
    if (text) {
      const delta = JSON.stringify(textToDelta(text));
      const { __superDangerousHtml, sanitizedHtml } = renderDeltaString(delta);

      this.delta = delta;
      this.rendered = __superDangerousHtml;
      this.sanitized = sanitizedHtml;
    } else {
      this.delta = "[]";
      this.rendered = "";
      this.sanitized = "";
    }
  }

  static fromJSON(delta: string): RichText {
    const rt = new RichText();
    rt.delta = delta;

    const { __superDangerousHtml, sanitizedHtml } = renderDeltaString(delta);

    rt.rendered = __superDangerousHtml;
    rt.sanitized = sanitizedHtml;

    return rt;
  }

  toJSON() {
    return this.sanitized;
  }

  toDatastore() {
    const { delta, rendered, sanitized } = this;

    return { delta, rendered, sanitized };
  }

  static fromDatastore(data: RichTextData) {
    const rt = new RichText();
    rt.delta = data.delta;
    rt.rendered = data.rendered;
    rt.sanitized = data.sanitized;
    return rt;
  }
}
