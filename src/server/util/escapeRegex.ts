// Escape regex metacharacters so user-supplied input used in a MongoDB $regex
// is treated as a literal substring — prevents ReDoS and regex/operator injection.
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
