// Navigation is application-owned. Generated content cannot choose transitions.
export type JourneyState =
  | "home"
  | "suggestion"
  | "practice"
  | "meditation"
  | "review"
  | "finish"
  | "map";
export type ConsentPolicy = {
  useMemoryForThisRequest: boolean;
  intent: "practice" | "conversation" | "reflection";
};
export function allowsMemory(policy: ConsentPolicy, savedPermission: boolean) {
  return (
    policy.useMemoryForThisRequest &&
    savedPermission &&
    policy.intent !== "reflection"
  );
}
// A later response must never overwrite work after Stop, navigation or a newer turn.
export function createRequestGate() {
  let sequence = 0;
  return {
    begin: () => ++sequence,
    cancel: () => {
      sequence++;
    },
    isCurrent: (id: number) => id === sequence,
  };
}
