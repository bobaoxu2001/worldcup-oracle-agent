/**
 * Verification provenance — PURE, dependency-free helpers shared by the manual
 * results & daily-news seed records and by client UI badges.
 *
 * This module deliberately imports nothing with server/Node dependencies (no DB,
 * no live-sports cache), so it is safe to import from React client components.
 * The aggregating, IO-touching freshness helpers live in ./freshness and
 * re-export these for server-side callers.
 */

/** Structured verification provenance, carried as optional fields on seed records. */
export interface VerificationProvenance {
  sourceName?: string;
  sourceUrl?: string;
  verified?: boolean;
  verifiedAt?: string;
}

export interface ProvenanceStatus {
  verified: boolean;
  /** Short, display-ready label, e.g. "Verified · Wikipedia (Group D table)". */
  label: string;
  sourceName: string | null;
  sourceUrl: string | null;
}

/**
 * Normalise a record's provenance into a display-ready status. Honest by
 * construction: a record counts as `verified` ONLY when it both claims it AND
 * names a source — a `verified: true` with no source is downgraded to unverified
 * rather than shown as a trusted claim.
 */
export function provenanceStatus(p: VerificationProvenance | null | undefined): ProvenanceStatus {
  const sourceName = p?.sourceName?.trim() || null;
  const sourceUrl = p?.sourceUrl?.trim() || null;
  const verified = !!p?.verified && !!sourceName;
  return {
    verified,
    label: verified ? `Verified · ${sourceName}` : sourceName ? `Source: ${sourceName}` : "Unverified",
    sourceName,
    sourceUrl,
  };
}
