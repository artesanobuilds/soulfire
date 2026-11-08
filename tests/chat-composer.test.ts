import { describe, expect, it } from "vitest";
import { isConversationSubmitKey } from "../src/lib/chat-composer";

const enter = {
  key: "Enter",
  shiftKey: false,
  altKey: false,
  isComposing: false,
  keyCode: 13,
  repeat: false,
};
describe("conversation submit shortcut", () => {
  it("sends with plain Enter, preserving existing Ctrl/Meta shortcuts", () => {
    expect(isConversationSubmitKey(enter)).toBe(true);
    expect(isConversationSubmitKey({ ...enter, ...{ ctrlKey: true } })).toBe(
      true,
    );
    expect(isConversationSubmitKey({ ...enter, ...{ metaKey: true } })).toBe(
      true,
    );
  });
  it.each([
    { shiftKey: true },
    { altKey: true },
    { isComposing: true },
    { keyCode: 229 },
    { repeat: true },
    { key: "Escape" },
  ])("does not submit for %j", (change) => {
    expect(isConversationSubmitKey({ ...enter, ...change })).toBe(false);
  });
});
