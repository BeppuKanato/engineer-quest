export const codeDraftKey = (courseId: string, userId: string) => `engineer-quest:learning-code:${encodeURIComponent(userId)}:${encodeURIComponent(courseId)}`;
export function readCodeDraft(courseId: string, userId: string): string | undefined {
  try { return localStorage.getItem(codeDraftKey(courseId, userId)) ?? undefined; } catch { return undefined; }
}
export function writeCodeDraft(courseId: string, userId: string, code: string): boolean {
  try { localStorage.setItem(codeDraftKey(courseId, userId), code); return true; } catch { return false; }
}
