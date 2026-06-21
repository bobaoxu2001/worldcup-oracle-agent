/**
 * Tests for structured verification provenance
 * (lib/data-truth/freshness.ts + the seed records that carry it).
 * Run: npm run test:provenance
 *
 * Covers the four states the feature must handle honestly:
 *   verified · unverified · no-source (claimed but unsourced) · stale.
 */

import {
  provenanceStatus,
  getVerifiedResultCount,
  getRecordedResultCount,
  getDataFreshnessSummary,
  classifyFreshness,
} from "../lib/data-truth/freshness";
import { MANUAL_MATCH_RESULTS } from "../lib/seed/manual-match-results";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

async function main() {
  // 1. VERIFIED: claimed + sourced → trusted, with a linkable source.
  const v = provenanceStatus({ verified: true, sourceName: "Wikipedia (Group D table)", sourceUrl: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_D" });
  check("verified+source → verified", v.verified);
  check("verified label names the source", v.label === "Verified · Wikipedia (Group D table)", v.label);
  check("verified keeps the source URL", !!v.sourceUrl?.startsWith("https://"));

  // 2. NO-SOURCE: claims verified but names no source → downgraded to unverified.
  const noSrc = provenanceStatus({ verified: true });
  check("verified claim without a source is downgraded", !noSrc.verified);
  check("no-source label is 'Unverified'", noSrc.label === "Unverified", noSrc.label);

  // 3. UNVERIFIED-with-source: a source, not cross-checked → shown as "Source: …".
  const srcOnly = provenanceStatus({ sourceName: "ESPN" });
  check("source without verified flag is not verified", !srcOnly.verified);
  check("source-only label is 'Source: ESPN'", srcOnly.label === "Source: ESPN", srcOnly.label);

  // 4. EMPTY: nothing recorded → honest "Unverified", no source.
  for (const empty of [undefined, null, {}]) {
    const s = provenanceStatus(empty);
    check(`empty provenance (${JSON.stringify(empty)}) → unverified, no source`, !s.verified && s.sourceName === null && s.label === "Unverified");
  }

  // 5. Seed-derived counts are consistent and honest.
  const seedVerified = MANUAL_MATCH_RESULTS.filter((r) => provenanceStatus(r).verified).length;
  check("getVerifiedResultCount matches the seed", getVerifiedResultCount() === seedVerified, `${getVerifiedResultCount()}`);
  check("at least one result is verified (feature is exercised)", getVerifiedResultCount() > 0);
  check("verified count never exceeds recorded count", getVerifiedResultCount() <= getRecordedResultCount());
  check("every verified result carries a source URL", MANUAL_MATCH_RESULTS.every((r) => !provenanceStatus(r).verified || !!provenanceStatus(r).sourceUrl));

  // 6. Summary surfaces the verified count.
  const summary = await getDataFreshnessSummary(new Date("2026-06-20T12:00:00Z"));
  check("summary.results.verifiedCount matches helper", summary.results.verifiedCount === getVerifiedResultCount(), `${summary.results.verifiedCount}`);

  // 7. STALE interplay: an old verified result is still flagged stale by recency.
  check("a verified-but-old date is classified 'stale'", classifyFreshness("2026-06-05", new Date("2026-06-20T12:00:00Z")).label === "stale");

  console.log(failures === 0 ? "\nAll provenance checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
