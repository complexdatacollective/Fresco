import { z } from 'zod';
import { NodeShapes } from '~/components/Node';

// ---------------------------------------------------------------------------
// Node Shape
// ---------------------------------------------------------------------------

// Derived from the Node component's shape variant.
// Per Bennett et al. (2022): square=man/boy, circle=woman/girl,
// diamond=non-binary/gender-diverse/unknown.
export const NodeShapeSchema = z.enum(NodeShapes);

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
export const ParentTypeSchema = z.enum([
  'biological',
  'social',
  'donor',
  'surrogate',
]);

export const ParentEdgeSchema = z.object({
  relationshipType: ParentTypeSchema,
  isActive: z.boolean(),
  // Explicit gestational carrier flag. Needed because sex/gender cannot reliably
  // indicate who carries a pregnancy (trans men and non-binary people can gestate).
  // Determines pregnancy symbol positioning and gestational exposure tracking.
  // Implicit defaults by parentType: surrogate→true, donor→false, social→false.
  // Must be explicit for: donor who also carries (traditional surrogacy),
  // biological parent in ART who is gestational-only (e.g. IVF with donor egg).
  isGestationalCarrier: z.boolean().optional(),
});

export const PartnerEdgeSchema = z.object({
  relationshipType: z.literal('partner'),
  isActive: z.boolean(),
});

export const EdgeSchema = z.union([ParentEdgeSchema, PartnerEdgeSchema]);

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type ParentType = z.infer<typeof ParentTypeSchema>;
export type ParentEdge = z.infer<typeof ParentEdgeSchema>;
export type PartnerEdge = z.infer<typeof PartnerEdgeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
