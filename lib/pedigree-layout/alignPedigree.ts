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
import { type ParentEdgeType } from '~/lib/pedigree-layout/types';
import { ancestor } from '~/lib/pedigree-layout/utils';

const AUXILIARY_EDGE_TYPES = new Set<ParentEdgeType>(['donor', 'surrogate']);

function isAuxiliaryEdge(edgeType: ParentEdgeType): boolean {
  return AUXILIARY_EDGE_TYPES.has(edgeType);
}

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

  // Force auxiliary parents (donors/surrogates) to the same level as the
  // social parents of the children they connect to.
  for (let i = 0; i < n; i++) {
    const pConns = ped.parents[i]!;
    if (pConns.length === 0) continue;
    const socialLevel = Math.max(
      ...pConns
        .filter((p) => p.edgeType === 'parent')
        .map((p) => level[p.parentIndex]!),
      -1,
    );
    if (socialLevel < 0) continue;
    for (const p of pConns) {
      if (isAuxiliaryEdge(p.edgeType)) {
        level[p.parentIndex] = socialLevel;
      }
    }
  }

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

  // Build set of known partner pairs from relation and partners data.
  // Used below to avoid grouping unpartnered parents (e.g. a known
  // biological father) with the partnered couple.
  const partnerPairs = new Set<string>();
  if (relation) {
    for (const rel of relation) {
      if (rel.code === 4) {
        const a = Math.min(rel.id1, rel.id2);
        const b = Math.max(rel.id1, rel.id2);
        partnerPairs.add(`${a},${b}`);
      }
    }
  }
  if (ped.partners) {
    for (const pc of ped.partners) {
      const a = Math.min(pc.partnerIndex1, pc.partnerIndex2);
      const b = Math.max(pc.partnerIndex1, pc.partnerIndex2);
      partnerPairs.add(`${a},${b}`);
    }
  }

  // Add parent groups from children's parents arrays.
  // When some parents of a child are in an explicit partner pair and
  // others are not, only the partnered parents form a group. The
  // unpartnered parents are left out so they receive auxiliary
  // (dashed) connector treatment instead. When NO parents of a child
  // are partnered, all parents are grouped (co-parent case).
  const groupSet = new Set<string>();
  for (let i = 0; i < n; i++) {
    const pConns = ped.parents[i]!;
    if (pConns.length < 2) continue;
    const socialParents = pConns
      .filter((p) => p.edgeType === 'parent')
      .map((p) => p.parentIndex)
      .sort((a, b) => a - b);
    if (socialParents.length < 2) continue;

    // Determine which parents are in explicit partner pairs with each other
    const partnered = new Set<number>();
    for (let a = 0; a < socialParents.length; a++) {
      for (let b = a + 1; b < socialParents.length; b++) {
        const pairKey = `${socialParents[a]},${socialParents[b]}`;
        if (partnerPairs.has(pairKey)) {
          partnered.add(socialParents[a]!);
          partnered.add(socialParents[b]!);
        }
      }
    }

    const members =
      partnered.size >= 2
        ? [...partnered].sort((a, b) => a - b)
        : socialParents;

    const key = members.join(',');
    if (!groupSet.has(key)) {
      groupSet.add(key);
      grouplist.push([...members, 0, 0]);
    }
  }

  // Deduplicate grouplist by sorted member set
  const seen = new Set<string>();
  grouplist = grouplist.filter((entry) => {
    const members = entry.slice(0, entry.length - 2);
    const key = [...members].sort((a, b) => a - b).join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Remove groups that are strict subsets of larger groups
  grouplist = grouplist.filter((entry, idx) => {
    const members = new Set(entry.slice(0, entry.length - 2));
    return !grouplist.some((other, otherIdx) => {
      if (idx === otherIdx) return false;
      const otherMembers = other.slice(0, other.length - 2);
      if (otherMembers.length <= members.size) return false;
      return [...members].every((m) => otherMembers.includes(m));
    });
  });

  // Find connected components using union-find over the pedigree graph.
  // Two people are connected if they share a group (partnership) or a
  // parent-child relationship. We pick one founder per component.
  const isFounder = (idx: number) => ped.parents[idx]!.length === 0;

  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  }
  function union(a: number, b: number) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  // Union group members (partnerships)
  for (const entry of grouplist) {
    const members = entry.slice(0, entry.length - 2);
    for (let i = 1; i < members.length; i++) {
      union(members[0]!, members[i]!);
    }
  }

  // Union parent-child relationships
  for (let i = 0; i < n; i++) {
    for (const p of ped.parents[i]!) {
      union(i, p.parentIndex);
    }
  }

  // Pick one founder per connected component.
  // Prefer social parents (in a group or with parent edges)
  // over auxiliary-only parents (donors/surrogates).
  const isAuxiliaryOnly = (idx: number) =>
    ped.parents.every((pConns) =>
      pConns
        .filter((p) => p.parentIndex === idx)
        .every((p) => isAuxiliaryEdge(p.edgeType)),
    );

  const componentFounder = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    if (!isFounder(i)) continue;
    // Only include founders who have children or are in a group
    const hasChildren = ped.parents.some((pConns) =>
      pConns.some((p) => p.parentIndex === i),
    );
    const inGroup = grouplist.some((entry) => {
      const members = entry.slice(0, entry.length - 2);
      return members.includes(i);
    });
    if (!hasChildren && !inGroup) continue;

    const comp = find(i);
    const existing = componentFounder.get(comp);
    if (existing === undefined) {
      componentFounder.set(comp, i);
    } else {
      // Prefer social parents over auxiliary-only parents
      const existingAux = isAuxiliaryOnly(existing);
      const candidateAux = isAuxiliaryOnly(i);
      if (existingAux && !candidateAux) {
        componentFounder.set(comp, i);
      } else if (existingAux === candidateAux) {
        if ((horder[i] ?? 0) < (horder[existing] ?? 0)) {
          componentFounder.set(comp, i);
        }
      }
    }
  }

  const founders = [...componentFounder.values()].sort(
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

  // Merge remaining founders (disconnected components only)
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

  // Discover missing ancestors and their descendants. alignped1 only traverses
  // downward, so when a group member (e.g., "mother") is discovered via her
  // partner, mother's parents and their other children are not discovered.
  //
  // We call alignped1 for each missing founder to get their full subtree,
  // then splice new (unplaced) entries directly into the main layout.
  // This avoids alignped3's boundary-only overlap limitation.
  const collectPlaced = () => {
    const s = new Set<number>();
    for (let lev2 = 0; lev2 < rval.nid.length; lev2++) {
      for (let col = 0; col < (rval.n[lev2] ?? 0); col++) {
        const pid = Math.floor(rval.nid[lev2]![col]!);
        if (pid >= 0) s.add(pid);
      }
    }
    return s;
  };

  for (let pass = 0; pass < n; pass++) {
    const placedIds = collectPlaced();
    const unplacedFounder = (() => {
      for (let i = 0; i < n; i++) {
        if (placedIds.has(i)) continue;
        if (!isFounder(i)) continue;
        // Skip auxiliary-only parents — handled in a dedicated pass later
        if (isAuxiliaryOnly(i)) continue;
        const hasPlacedChild = ped.parents.some(
          (pConns, ci) =>
            placedIds.has(ci) && pConns.some((p) => p.parentIndex === i),
        );
        if (hasPlacedChild) return i;
      }
      return -1;
    })();

    if (unplacedFounder < 0) break;

    // Get the full subtree for this founder
    const sub = alignped1(
      unplacedFounder,
      ped.parents,
      level,
      horder,
      packed,
      rval.grouplist,
    );

    // Splice new entries from the subtree into the main layout.
    // For each level, find entries in sub that aren't already in rval,
    // and insert them next to an already-placed neighbor.
    const maxlev = rval.nid.length;

    for (let lev2 = 0; lev2 < maxlev; lev2++) {
      const subN = sub.n[lev2] ?? 0;
      if (subN === 0) continue;

      // Collect new entries from the subtree
      const newEntries: {
        nid: number;
        pos: number;
        fam: number;
        subCol: number;
      }[] = [];
      let anchorSubCol = -1;
      let anchorMainCol = -1;

      for (let col = 0; col < subN; col++) {
        const pid = Math.floor(sub.nid[lev2]![col]!);
        if (pid < 0) continue;
        if (placedIds.has(pid)) {
          // This person is already in the main layout — use as anchor
          if (anchorSubCol < 0) {
            anchorSubCol = col;
            // Find their column in the main layout
            const mainN = rval.n[lev2] ?? 0;
            for (let mc = 0; mc < mainN; mc++) {
              if (Math.floor(rval.nid[lev2]![mc]!) === pid) {
                anchorMainCol = mc;
                break;
              }
            }
          }
        } else {
          newEntries.push({
            nid: sub.nid[lev2]![col]!,
            pos: sub.pos[lev2]![col]!,
            fam: sub.fam[lev2]![col]!,
            subCol: col,
          });
        }
      }

      if (newEntries.length === 0) continue;

      const mainN = rval.n[lev2] ?? 0;
      // Determine insertion point: after the anchor if found,
      // otherwise append at the end. Scan past group members (.5
      // entries) and siblings sharing the same fam so we don't split
      // existing partner groups or sibling families.
      let insertAt: number;
      if (anchorMainCol >= 0) {
        // Find the effective family of the anchor. For .5 group members
        // (married-in partners), always use the partner's fam — the .5
        // member's own fam may point to their biological parents from a
        // different family, which would cause insertAt to stop too early.
        const anchorNid = rval.nid[lev2]![anchorMainCol]!;
        const isHalf = anchorNid > 0 && anchorNid !== Math.floor(anchorNid);
        let anchorFam: number;
        if (isHalf && anchorMainCol > 0) {
          anchorFam = rval.fam[lev2]![anchorMainCol - 1]!;
        } else {
          anchorFam = rval.fam[lev2]![anchorMainCol]!;
          if (anchorFam === 0 && anchorMainCol + 1 < mainN) {
            anchorFam = rval.fam[lev2]![anchorMainCol + 1]!;
          }
        }
        insertAt = anchorMainCol + 1;
        while (insertAt < mainN) {
          const nidVal = rval.nid[lev2]![insertAt]!;
          const isGroupMember = nidVal > 0 && nidVal !== Math.floor(nidVal);
          const famVal = rval.fam[lev2]![insertAt]!;
          const isSameFamily = anchorFam > 0 && famVal === anchorFam;
          if (isGroupMember || isSameFamily) {
            insertAt++;
          } else {
            break;
          }
        }
      } else {
        insertAt = mainN;
      }

      // Ensure arrays are large enough
      const newTotal = mainN + newEntries.length;
      while (rval.nid[lev2]!.length < newTotal) {
        rval.nid[lev2]!.push(0);
        rval.pos[lev2]!.push(0);
        rval.fam[lev2]!.push(0);
      }

      // Shift existing entries after insertAt to make room
      for (let mc = mainN - 1; mc >= insertAt; mc--) {
        rval.nid[lev2]![mc + newEntries.length] = rval.nid[lev2]![mc]!;
        rval.pos[lev2]![mc + newEntries.length] = rval.pos[lev2]![mc]!;
        rval.fam[lev2]![mc + newEntries.length] = rval.fam[lev2]![mc]!;
      }

      // Insert new entries, positioning relative to anchor or end
      const basePos = insertAt > 0 ? rval.pos[lev2]![insertAt - 1]! + 1 : 0;
      for (let k = 0; k < newEntries.length; k++) {
        const col = insertAt + k;
        rval.nid[lev2]![col] = newEntries[k]!.nid;
        rval.pos[lev2]![col] = basePos + k;
        rval.fam[lev2]![col] = 0; // Will be set below
      }

      rval.n[lev2] = newTotal;

      // First, shift existing fam pointers on levels below that reference
      // columns shifted by this insertion (must happen BEFORE setting new
      // fam pointers to avoid double-shifting).
      for (let belowLev = lev2 + 1; belowLev < maxlev; belowLev++) {
        const belowN = rval.n[belowLev] ?? 0;
        for (let cc = 0; cc < belowN; cc++) {
          const famVal = rval.fam[belowLev]![cc]!;
          // fam is 1-based column in (belowLev - 1). If the insertion
          // was at belowLev's parent level (lev2 == belowLev - 1),
          // shift fam pointers that reference columns >= insertAt.
          if (lev2 === belowLev - 1 && famVal > insertAt) {
            rval.fam[belowLev]![cc] = famVal + newEntries.length;
          }
        }
      }

      // Then, set fam pointers for children of the new founders.
      // fam is a 1-based column index into the parent level pointing to
      // the left member of the parent group.
      if (lev2 < maxlev - 1) {
        const childLev = lev2 + 1;
        const childN = rval.n[childLev] ?? 0;
        const newPersonIds = newEntries.map((e) => Math.floor(e.nid));
        for (let cc = 0; cc < childN; cc++) {
          const childNidVal = rval.nid[childLev]![cc]!;
          const childPid = Math.floor(childNidVal);
          if (childPid < 0) continue;
          const childParents = ped.parents[childPid];
          if (!childParents) continue;
          const hasNewParent = childParents.some((p) =>
            newPersonIds.includes(p.parentIndex),
          );
          if (hasNewParent && rval.fam[childLev]![cc] === 0) {
            rval.fam[childLev]![cc] = insertAt + 1; // 1-based
          }
        }
      }

      // Set fam pointers for the newly inserted entries themselves,
      // pointing to their parents' position in the main layout.
      if (lev2 > 0) {
        const parentLev = lev2 - 1;
        const parentN = rval.n[parentLev] ?? 0;
        for (let k = 0; k < newEntries.length; k++) {
          const col = insertAt + k;
          const nidVal = rval.nid[lev2]![col]!;
          const personIdx = Math.floor(nidVal);
          if (personIdx < 0) continue;
          const personParents = ped.parents[personIdx];
          if (!personParents || personParents.length === 0) continue;
          for (let pc = 0; pc < parentN; pc++) {
            const parentPid = Math.floor(rval.nid[parentLev]![pc]!);
            if (parentPid < 0) continue;
            if (
              personParents.some(
                (p) => p.parentIndex === parentPid && p.edgeType === 'parent',
              )
            ) {
              rval.fam[lev2]![col] = pc + 1; // 1-based
              break;
            }
          }
        }
      }

      // Crossing minimization: when the anchor is a .5 group member,
      // its partner's same-fam siblings sit between the anchor and the
      // new entries. The partner family's sibling bar would cross over
      // the anchor's biological parent connector. Fix by moving those
      // siblings to before the partner (the outside edge).
      if (anchorMainCol >= 0) {
        const anchNidVal = rval.nid[lev2]![anchorMainCol]!;
        const isHalfAnch =
          anchNidVal > 0 && anchNidVal !== Math.floor(anchNidVal);

        if (isHalfAnch && anchorMainCol > 0) {
          const partnerCol = anchorMainCol - 1;
          const partnerFamVal = rval.fam[lev2]![partnerCol]!;

          if (partnerFamVal > 0) {
            // Collect partner's siblings (and their .5 partners) between
            // anchor+1 and insertAt
            const sibCols: number[] = [];
            for (let c = anchorMainCol + 1; c < insertAt; c++) {
              const nv = rval.nid[lev2]![c]!;
              const isGM = nv > 0 && nv !== Math.floor(nv);
              const famVal = rval.fam[lev2]![c]!;
              if (isGM || famVal === partnerFamVal) {
                sibCols.push(c);
              } else {
                break;
              }
            }

            if (sibCols.length > 0) {
              const K = sibCols.length;
              const A = anchorMainCol;

              // Save sibling data
              const savedSibs = sibCols.map((c) => ({
                nid: rval.nid[lev2]![c]!,
                pos: rval.pos[lev2]![c]!,
                fam: rval.fam[lev2]![c]!,
              }));

              // Save cols [0..A] (everything before and including the anchor)
              const savedFront: {
                nid: number;
                pos: number;
                fam: number;
              }[] = [];
              for (let c = 0; c <= A; c++) {
                savedFront.push({
                  nid: rval.nid[lev2]![c]!,
                  pos: rval.pos[lev2]![c]!,
                  fam: rval.fam[lev2]![c]!,
                });
              }

              // Place siblings at [0..K-1]
              for (let k = 0; k < K; k++) {
                rval.nid[lev2]![k] = savedSibs[k]!.nid;
                rval.pos[lev2]![k] = savedSibs[k]!.pos;
                rval.fam[lev2]![k] = savedSibs[k]!.fam;
              }

              // Place original front at [K..K+A]
              for (let c = 0; c < savedFront.length; c++) {
                rval.nid[lev2]![K + c] = savedFront[c]!.nid;
                rval.pos[lev2]![K + c] = savedFront[c]!.pos;
                rval.fam[lev2]![K + c] = savedFront[c]!.fam;
              }

              // Cols after A+K stay in place (new entries and beyond)

              // Fix fam pointers on the child level that reference
              // columns on this level (fam is 1-based column index)
              if (lev2 + 1 < maxlev) {
                const childLev = lev2 + 1;
                const childN = rval.n[childLev] ?? 0;
                for (let cc = 0; cc < childN; cc++) {
                  const fv = rval.fam[childLev]![cc]!;
                  if (fv <= 0) continue;
                  if (fv <= A + 1) {
                    // Was pointing to old cols [0..A], now at [K..K+A]
                    rval.fam[childLev]![cc] = fv + K;
                  } else if (fv >= A + 2 && fv <= A + K + 1) {
                    // Was pointing to old cols [A+1..A+K], now at [0..K-1]
                    rval.fam[childLev]![cc] = fv - (A + 1);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Ensure all row arrays have the same width
    const maxWidth = Math.max(...rval.n);
    for (let lev2 = 0; lev2 < maxlev; lev2++) {
      while (rval.nid[lev2]!.length < maxWidth) {
        rval.nid[lev2]!.push(0);
        rval.pos[lev2]!.push(0);
        rval.fam[lev2]!.push(0);
      }
    }
  }

  // Place unplaced auxiliary parents (donors/surrogates) adjacent to the
  // social parent group of their shared children.
  {
    const placedIds = collectPlaced();
    const maxlev = rval.nid.length;

    for (let i = 0; i < n; i++) {
      if (placedIds.has(i)) continue;

      // Check if this person is an auxiliary parent of any placed child
      let childIdx = -1;
      for (let ci = 0; ci < n; ci++) {
        const pConns = ped.parents[ci]!;
        if (!placedIds.has(ci)) continue;
        const auxConn = pConns.find(
          (p) => p.parentIndex === i && isAuxiliaryEdge(p.edgeType),
        );
        if (auxConn) {
          childIdx = ci;
          break;
        }
      }
      if (childIdx < 0) continue;

      // Find the social parents of this child in the layout
      const socialParentIndices = ped.parents[childIdx]!.filter(
        (p) => p.edgeType === 'parent',
      ).map((p) => p.parentIndex);

      const lev2 = level[i]!;
      if (lev2 < 0 || lev2 >= maxlev) continue;
      const mainN = rval.n[lev2] ?? 0;

      // Find the rightmost social parent column on this level
      let insertAfter = -1;
      for (let col = 0; col < mainN; col++) {
        const pid = Math.floor(rval.nid[lev2]![col]!);
        if (socialParentIndices.includes(pid)) {
          insertAfter = col;
        }
      }

      // Insert after the social parent group (or at end if not found)
      const insertAt = insertAfter >= 0 ? insertAfter + 1 : mainN;
      const newTotal = mainN + 1;

      while (rval.nid[lev2]!.length < newTotal) {
        rval.nid[lev2]!.push(0);
        rval.pos[lev2]!.push(0);
        rval.fam[lev2]!.push(0);
      }

      // Shift existing entries after insertAt
      for (let mc = mainN - 1; mc >= insertAt; mc--) {
        rval.nid[lev2]![mc + 1] = rval.nid[lev2]![mc]!;
        rval.pos[lev2]![mc + 1] = rval.pos[lev2]![mc]!;
        rval.fam[lev2]![mc + 1] = rval.fam[lev2]![mc]!;
      }

      // Position with spacing after the previous column
      const basePos = insertAt > 0 ? rval.pos[lev2]![insertAt - 1]! + 1 : 0;
      rval.nid[lev2]![insertAt] = i;
      rval.pos[lev2]![insertAt] = basePos;
      rval.fam[lev2]![insertAt] = 0;
      rval.n[lev2] = newTotal;

      // Shift fam pointers on levels below
      for (let belowLev = lev2 + 1; belowLev < maxlev; belowLev++) {
        const belowN = rval.n[belowLev] ?? 0;
        for (let cc = 0; cc < belowN; cc++) {
          const famVal = rval.fam[belowLev]![cc]!;
          if (lev2 === belowLev - 1 && famVal > insertAt) {
            rval.fam[belowLev]![cc] = famVal + 1;
          }
        }
      }

      placedIds.add(i);
    }

    // Ensure all row arrays have the same width
    const maxWidth = Math.max(...rval.n);
    for (let lev2 = 0; lev2 < maxlev; lev2++) {
      while (rval.nid[lev2]!.length < maxWidth) {
        rval.nid[lev2]!.push(0);
        rval.pos[lev2]!.push(0);
        rval.fam[lev2]!.push(0);
      }
    }
  }

  // Unhash: separate nid and group from .5 encoding
  const maxdepth = rval.nid.length;
  // Record which nodes were .5 group members (married-in partners)
  const groupMember: boolean[][] = rval.nid.map((row) =>
    row.map((v) => v > 0 && v !== Math.floor(v)),
  );
  const nid: number[][] = rval.nid.map((row) => row.map((v) => Math.floor(v)));
  const groupMat: number[][] = rval.nid.map((row) => {
    const g = new Array<number>(row.length).fill(0);
    for (let j = 0; j < row.length; j++) {
      if (row[j] !== Math.floor(row[j]!)) {
        // .5 member: place group line to the left (or right if first column)
        if (j > 0) {
          g[j - 1] = 1;
        } else {
          g[j] = 1;
        }
      }
    }
    return g;
  });

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
  const doAlign = align === true || (Array.isArray(align) && align.length > 0);
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
    groupMember,
  };
}
