import Delta from "quill-delta";

import { RichText, renderDeltaString, emptyDelta } from "./richtext";

describe("Rich Text", () => {
  it("", () => {
    const rt = new RichText();
    rt.toDatastore();
    rt.toJSON();
    RichText.fromDatastore;
    RichText.fromJSON;
  });

  it("renders plain text correctly", () => {
    const rt = new RichText("plaintext");

    expect(rt.toDatastore()).toEqual({
      delta: '{"ops":[{"insert":"plaintext"}]}',
      rendered: "<p>plaintext</p>",
      sanitized: "plaintext"
    });
    expect(rt.toJSON()).toEqual("plaintext");
  });

  it("escapes 'bold' text correctly", () => {
    const rt = new RichText("<b>bold</b>");

    expect(rt.toDatastore()).toEqual({
      delta: '{"ops":[{"insert":"<b>bold</b>"}]}',
      rendered: "<p>&lt;b&gt;bold&lt;&#x2F;b&gt;</p>",
      sanitized: "&lt;b&gt;bold&lt;/b&gt;"
    });
    expect(rt.toJSON()).toEqual("&lt;b&gt;bold&lt;/b&gt;");
  });

  it("renders bold text correctly", () => {
    const delta = new Delta({
      ops: [{ insert: "bold", attributes: { bold: true } }]
    });
    const deltaString = JSON.stringify(delta);
    const rt = RichText.fromJSON(deltaString);

    expect(rt.toDatastore()).toEqual({
      delta: deltaString,
      rendered: "<p><strong>bold</strong></p>",
      sanitized: "<strong>bold</strong>"
    });
  });
});

describe("Rich Text utilities", () => {
  it("generates empty delta", () => {
    expect(emptyDelta()).toEqual({ ops: [] });
  });

  it("sanitizes iframe element", () => {
    const delta = new Delta({
      ops: [
        {
          insert: {
            video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          }
        }
      ]
    });
    const deltaString = JSON.stringify(delta);
    const { __superDangerousHtml, sanitizedHtml } = renderDeltaString(
      deltaString
    );

    expect(__superDangerousHtml).toEqual(
      '<iframe class="ql-video" frameborder="0" allowfullscreen="true" src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>'
    );
    expect(sanitizedHtml).toEqual("");
  });
});
