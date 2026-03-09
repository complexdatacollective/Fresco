import {
  type GroupEntry,
  type Hints,
  type PedigreeInput,
  type PedigreeLayout,
} from '~/lib/pedigree-layout/types';
import { alignped1 } from '~/lib/pedigree-layout/alignped1';
import { alignped3 } from '~/lib/pedigree-layout/alignped3';
import { alignped4 } from '~/lib/pedigree-layout/alignped4';
import { autohint } from '~/lib/pedigree-layout/autohint';
import { checkHint } from '~/lib/pedigree-layout/checkHint';
import { kindepth } from '~/lib/pedigree-layout/kindepth';
import { ancestor } from '~/lib/pedigree-layout/utils';

/**
 * Main pedigree layout algorithm.
 *
 * Takes pedigree data and computes the aligned layout with positions.
 */
export function alignPedigree(
  ped: PedigreeInput,
  options: {
    packed?: boolean;
    width?: number;
    align?: boolean | number[];
    hints?: Hints;
  } = {},
): PedigreeLayout {
  const { packed = true, width = 10, align = true } = options;
  let { hints } = options;

  const n = ped.id.length;

  // Generate or validate hints
  if (!hints) {
    try {
      hints = autohint(ped, { packed, align: false }, alignPedigree);
    } catch {
      hints = { order: Array.from({ length: n }, (_, i) => i + 1) };
    }
  } else {
    hints = checkHint(hints, n);
  }

  // Compute depth (0-based) and add 1 for 1-based levels
  const depth = kindepth(ped.parents, true);
  const level = depth.map((d) => d + 1);

  const horder = hints.order;

  // Build relation matrix (if any)
  const relation = ped.relation ?? null;

  // Build group list from parent groups
  let grouplist: GroupEntry[] = [];

  // Add from hints (GroupHint → GroupEntry)
  if (hints.groups) {
    for (const gh of hints.groups) {
      // GroupEntry: [member1, member2, ..., anchorSide, anchorType]
      grouplist.push([...gh.members, 0, gh.anchor]);
    }
  }

  // Add partner relations (code 4)
  if (relation) {
    for (const rel of relation) {
      if (rel.code === 4) {
        grouplist.push([rel.id1, rel.id2, 0, 0]);
      }
    }
  }

  // Add parent groups from children's parents arrays
  const groupSet = new Set<string>();
  for (let i = 0; i < n; i++) {
    const pConns = ped.parents[i]!;
    if (pConns.length < 2) continue;
    // Only group social-parent and co-parent connections for layout grouping
    const socialParents = pConns
      .filter(
        (p) =>
          p.edgeType === 'social-parent' || p.edgeType === 'co-parent',
      )
      .map((p) => p.parentIndex)
      .sort((a, b) => a - b);
    if (socialParents.length < 2) continue;
    const key = socialParents.join(',');
    if (!groupSet.has(key)) {
      groupSet.add(key);
      grouplist.push([...socialParents, 0, 0]);
    }
  }

  // Deduplicate grouplist by hash (first two members)
  const seen = new Set<string>();
  grouplist = grouplist.filter((entry) => {
    const members = entry.slice(0, entry.length - 2);
    const key = members.join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Find founders: people whose group members are all founders (no parents)
  const isFounder = (idx: number) => ped.parents[idx]!.length === 0;

  const founderGroups = grouplist.filter((entry) => {
    const members = entry.slice(0, entry.length - 2);
    return members.every((m) => isFounder(m));
  });

  // Collect unique founders from founder groups
  const founderMembers = new Set<number>();
  const dupMembers = new Set<number>();
  for (const entry of founderGroups) {
    const members = entry.slice(0, entry.length - 2);
    for (const m of members) {
      if (founderMembers.has(m)) {
        dupMembers.add(m);
      }
      founderMembers.add(m);
    }
  }

  // Pick one representative per founder group (preferring duplicates as anchors)
  const representatives = new Set<number>();
  for (const entry of founderGroups) {
    const members = entry.slice(0, entry.length - 2);
    // If any member appears in multiple groups, they're the anchor
    const anchor = members.find((m) => dupMembers.has(m));
    if (anchor !== undefined) {
      representatives.add(anchor);
    } else {
      // Otherwise pick the last member (arbitrary but consistent)
      representatives.add(members[members.length - 1]!);
    }
  }

  // Also add lone founders (no groups)
  for (let i = 0; i < n; i++) {
    if (isFounder(i) && !founderMembers.has(i)) {
      // Check if this person has children — only layout roots
      const hasChildren = ped.parents.some((pConns) =>
        pConns.some((p) => p.parentIndex === i),
      );
      if (hasChildren) {
        representatives.add(i);
      }
    }
  }

  const founders = [...representatives].sort(
    (a, b) => (horder[a] ?? 0) - (horder[b] ?? 0),
  );

  if (founders.length === 0) {
    // Fallback: use all people with no parents
    for (let i = 0; i < n; i++) {
      if (isFounder(i)) founders.push(i);
    }
    if (founders.length === 0) {
      throw new Error('No founders found in pedigree');
    }
  }

  // Layout first founder
  let rval = alignped1(
    founders[0]!,
    ped.parents,
    level,
    horder,
    packed,
    grouplist,
  );

  // Merge remaining founders
  if (founders.length > 1) {
    grouplist = rval.grouplist;
    for (let i = 1; i < founders.length; i++) {
      const rval2 = alignped1(
        founders[i]!,
        ped.parents,
        level,
        horder,
        packed,
        grouplist,
      );
      grouplist = rval2.grouplist;
      rval = alignped3(rval, rval2, packed);
    }
  }

  // Unhash: separate nid and group from .5 encoding
  const maxdepth = rval.nid.length;
  const nid: number[][] = rval.nid.map((row) =>
    row.map((v) => Math.floor(v)),
  );
  const groupMat: number[][] = rval.nid.map((row) =>
    row.map((v) => (v !== Math.floor(v) ? 1 : 0)),
  );

  // Detect consanguinity: group pairs with common ancestors get group=2
  for (let i = 0; i < maxdepth; i++) {
    for (let j = 0; j < groupMat[i]!.length; j++) {
      if (groupMat[i]![j]! > 0) {
        const a1 = ancestor(nid[i]![j]!, ped.parents);
        const a2 = ancestor(nid[i]![j + 1]!, ped.parents);
        const combined = [...a1, ...a2];
        if (combined.length !== new Set(combined).size) {
          groupMat[i]![j] = 2;
        }
      }
    }
  }

  // Extract twin info
  let twins: number[][] | null = null;
  if (relation?.some((r) => r.code < 4)) {
    twins = nid.map((row) => row.map(() => 0));
    const twinRelations = relation.filter((r) => r.code < 4);

    // ntemp: only show nid where connected to parents (fam > 0)
    const ntemp: number[][] = rval.fam.map((famRow, i) =>
      famRow.map((f, j) => (f > 0 ? nid[i]![j]! : -1)),
    );

    for (const rel of twinRelations) {
      let lpos = -1;
      let rpos = -1;
      for (let row = 0; row < maxdepth; row++) {
        for (let col = 0; col < ntemp[row]!.length; col++) {
          if (ntemp[row]![col] === rel.id1 && lpos === -1) {
            lpos = row * ntemp[0]!.length + col;
          }
          if (ntemp[row]![col] === rel.id2 && rpos === -1) {
            rpos = row * ntemp[0]!.length + col;
          }
        }
      }

      if (lpos >= 0 && rpos >= 0) {
        const minPos = Math.min(lpos, rpos);
        const minRow = Math.floor(minPos / ntemp[0]!.length);
        const minCol = minPos % ntemp[0]!.length;
        twins[minRow]![minCol] = rel.code;
      }
    }
  }

  // Run position optimization (fall back to unoptimized if QP solver fails)
  let pos: number[][];
  const doAlign =
    align === true || (Array.isArray(align) && align.length > 0);
  const maxLevel = Math.max(...level);
  if (doAlign && maxLevel > 1) {
    try {
      const groupBool = groupMat.map((row) => row.map((v) => v > 0));
      pos = alignped4(rval, groupBool, level, width, align);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        'alignped4 QP optimization failed, using unoptimized positions',
        e,
      );
      pos = rval.pos.map((row) => [...row]);
    }
  } else {
    pos = rval.pos.map((row) => [...row]);
  }

  return {
    n: rval.n,
    nid,
    pos,
    fam: rval.fam,
    group: groupMat,
    twins,
  };
}
