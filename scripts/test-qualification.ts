/**
 * Sanity checks for the group-stage → Round-of-32 resolver
 * (lib/schedule/qualification.ts). Run: npm run test:qualification
 *
 * Contract-based, so it never goes stale as results land: it asserts the
 * STRUCTURE of a resolved knockout field (32 distinct teams, 12 winners, 12
 * runners-up, 8 best thirds correctly ranked) rather than pinning specific
 * teams. Also checks the pre-completion state stays unresolved.
 */

import {
  buildGroupFixtures,
  mergeManualIntoGroups,
  type GroupFixtures,
} from "../lib/schedule/buildSchedule";
import { resolveQualification } from "../lib/schedule/qualification";
import { GROUPS, getTeam } from "../lib/seed/world-cup-2026-groups";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

// Live data: the merged group fixtures with all manual results folded in.
const groups = mergeManualIntoGroups(buildGroupFixtures());
const q = resolveQualification(groups);

console.log(`Group stage complete: ${q.complete}\n`);

if (q.complete) {
  // 1. Exactly 32 distinct teams in the Round of 32.
  const teams = q.r32.flatMap((m) => [m.home, m.away]);
  check("16 Round-of-32 matches", q.r32.length === 16, `${q.r32.length}`);
  check("32 distinct teams in the R32", new Set(teams).size === 32, `${new Set(teams).size}`);

  // 2. Every group winner and runner-up appears exactly once.
  const winners = GROUPS.map((g) => q.standings.find((s) => s.group === g.name)!.rows[0].slug);
  const runners = GROUPS.map((g) => q.standings.find((s) => s.group === g.name)!.rows[1].slug);
  check("all 12 group winners are in the R32", winners.every((w) => teams.includes(w)));
  check("all 12 runners-up are in the R32", runners.every((r) => teams.includes(r)));

  // 3. Exactly 8 qualified thirds; they are the top-8 by points → GD → GF.
  const qualified = q.thirds.filter((t) => t.qualified);
  check("exactly 8 third-placed teams qualify", qualified.length === 8, `${qualified.length}`);
  check("all qualified thirds are in the R32", qualified.every((t) => teams.includes(t.slug)));
  check("missed thirds are NOT in the R32", q.thirds.filter((t) => !t.qualified).every((t) => !teams.includes(t.slug)));

  // 4. The third ranking is monotonic on (points, GD, GF).
  let monotonic = true;
  for (let i = 1; i < q.thirds.length; i++) {
    const a = q.thirds[i - 1].row;
    const b = q.thirds[i].row;
    const aKey = [a.points, a.goalDiff, a.goalsFor];
    const bKey = [b.points, b.goalDiff, b.goalsFor];
    // aKey must be >= bKey lexicographically.
    if (aKey[0] < bKey[0] ||
        (aKey[0] === bKey[0] && aKey[1] < bKey[1]) ||
        (aKey[0] === bKey[0] && aKey[1] === bKey[1] && aKey[2] < bKey[2])) {
      monotonic = false;
    }
  }
  check("third-placed ranking is monotonic on points → GD → GF", monotonic);

  // 5. The qualified/eliminated boundary is honest: no eliminated third outranks
  //    a qualified one on the ordering key.
  const lastIn = qualified[qualified.length - 1].row;
  const firstOut = q.thirds.find((t) => !t.qualified)?.row;
  check(
    "8th-best third is not worse than the 9th",
    !firstOut ||
      lastIn.points > firstOut.points ||
      (lastIn.points === firstOut.points && lastIn.goalDiff > firstOut.goalDiff) ||
      (lastIn.points === firstOut.points && lastIn.goalDiff === firstOut.goalDiff && lastIn.goalsFor >= firstOut.goalsFor),
    firstOut ? `${getTeam(qualified[7].slug).name} ≥ ${getTeam(q.thirds.find((t) => !t.qualified)!.slug).name}` : "no missed thirds"
  );

  // 6. Annex C assignment is sane: 8 distinct slots → 8 distinct, qualifying groups.
  const slots = Object.keys(q.thirdAssignment ?? {});
  const assignedGroups = Object.values(q.thirdAssignment ?? {});
  check("Annex C assigns 8 distinct third slots", new Set(slots).size === 8, `${new Set(slots).size}`);
  check(
    "Annex C groups match the qualifying third groups",
    new Set(assignedGroups).size === 8 &&
      assignedGroups.every((g) => q.thirdGroups.includes(g))
  );
}

// 7. Pre-completion: with NO results, the field must stay unresolved.
const empty: GroupFixtures[] = buildGroupFixtures();
const q0 = resolveQualification(empty);
check("an empty group stage is not complete", q0.complete === false);
check("an unresolved field exposes no R32 matchups", q0.r32.length === 0);

console.log(failures === 0 ? "\nAll qualification checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
