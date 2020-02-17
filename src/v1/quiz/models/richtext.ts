import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import sanitize from "sanitize-html";

export type RichTextData = {
  delta: string;
  rendered: string;
  sanitized: string;
};

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

export class RichText { // This isn't technically a "model" (it isn't a document)
  private delta: string;
  private rendered: string;
  private sanitized: string;

  fromJSON(delta: string) {
    const rt = new RichText();
    rt.delta = delta;

    // We'll start with a quite restrictive subset of HTML.
    const opts = {
      allowedTags: ["b", "i", "em", "strong", "a"],
      allowedAttributes: {
        a: ["href"]
      }
    };

    // render the text.
    const converter = new QuillDeltaToHtmlConverter(JSON.parse(delta), {});
    const unsanitizedHtml = converter.convert();

    const sanitizedHtml = sanitize(unsanitizedHtml, opts);

    rt.rendered = unsanitizedHtml;
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
