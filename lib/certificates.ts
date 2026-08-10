// ═══════════════════════════════════════════════════════════════════════════════
// Certificate credential IDs — shared by the certificate page (issuing) and
// /verify (checking), so the two can never drift (UX review R3).
//
// The ID is a deterministic function of (enrollmentId, studentId). It is NOT
// cryptographic — verification works by recomputing the ID for completed
// enrollments server-side and matching, so the ID never needs to be secret or
// reversible, just stable. Kept byte-identical to the original inline
// implementation so every certificate already issued still verifies.
// ═══════════════════════════════════════════════════════════════════════════════

export function generateVerificationId(enrollmentId: string, studentId: string): string {
  const raw = `${enrollmentId}-${studentId}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `SQ1-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/** Normalise user input: trims, uppercases, tolerates missing dashes. */
export function normaliseCredentialId(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  const m = cleaned.match(/^(?:SQ1-?)?([0-9A-F]{4})-?([0-9A-F]{4})$/);
  return m ? `SQ1-${m[1]}-${m[2]}` : null;
}
