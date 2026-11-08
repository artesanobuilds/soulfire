/** Preserve Shift+Enter, IME confirmation and held-key repeats. */
export function isConversationSubmitKey(event: {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  isComposing: boolean;
  keyCode: number;
  repeat: boolean;
}): boolean {
  return (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.altKey &&
    !event.isComposing &&
    event.keyCode !== 229 &&
    !event.repeat
  );
}
