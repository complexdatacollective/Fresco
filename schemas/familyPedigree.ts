// ---------------------------------------------------------------------------
// Edge Model — Network Data
// ---------------------------------------------------------------------------

// Relationship types for parent-child edges, derived from NSGC standardized
// pedigree nomenclature (Bennett et al., 2022, Figure 5):
//   biological — intended parent with genetic and/or gestational connection
//   social     — intended parent with no biological connection (adoptive, step, foster)
//   donor      — gamete contributor not intending to raise the child ("D" label).
//                Also used when a person is both egg donor AND gestational carrier
//                (traditional surrogacy), per the paper's recommendation.
//   surrogate  — gestational carrier only, not providing gametes ("S" label)
type ParentType = 'biological' | 'social' | 'donor' | 'surrogate' | 'adoptive';

export type ParentEdge = {
  relationshipType: ParentType;
  isActive: boolean;
  // Explicit gestational carrier flag. Needed because sex/gender cannot reliably
  // indicate who carries a pregnancy (trans men and non-binary people can gestate).
  // Determines pregnancy symbol positioning and gestational exposure tracking.
  // Implicit defaults by parentType: surrogate→true, donor→false, social→false.
  // Must be explicit for: donor who also carries (traditional surrogacy),
  // biological parent in ART who is gestational-only (e.g. IVF with donor egg).
  isGestationalCarrier?: boolean;
};
