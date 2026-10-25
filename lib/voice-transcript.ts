export function joinAssistantTranscript(previous: string, incoming: string): string {
  const current = previous.trim();
  const next = incoming.trim();

  if (!next) return current;
  if (!current) return next;
  if (current.endsWith(next)) return current;
  if (next.startsWith(current)) return next;

  return current + " " + next;
}