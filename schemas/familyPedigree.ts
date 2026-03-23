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
// Stage Configuration — Protocol Definition
// ---------------------------------------------------------------------------

// Simplified form field definition for protocol-level form configuration.
// Describes which variable to collect and which input component to render.
export const FormFieldSchema = z.object({
  variable: z.string(),
  component: z.string(),
});

export const FormConfigSchema = z.object({
  fields: z.array(FormFieldSchema),
});

export const NominationPromptSchema = z.object({
  id: z.string(),
  text: z.string(),
  // Attribute to be toggled/nominated in this step (e.g. a disease variable)
  variable: z.string(),
});

export const NodeConfigSchema = z.object({
  // Node type for alter nodes in the codebook
  type: z.string(),
  // Categorical variable on the node determining its shape
  shapeVariable: z.string(),
  // Maps variable option values to pedigree shapes
  shapeMapping: z.record(z.string(), NodeShapeSchema),
  // Boolean variable marking the ego node
  egoVariable: z.string(),
  // String variable storing the relationship to ego (e.g. 'sibling', 'parent')
  relationshipVariable: z.string(),
  // Form fields collected when creating a node
  form: FormConfigSchema,
});

export const EdgeConfigSchema = z.object({
  // Edge type in the codebook (single type for both parent and partner edges)
  type: z.string(),
  // Variable storing the relationship type value (discriminant for the Edge union)
  relationshipTypeVariable: z.string(),
  // Variable storing whether the relationship is currently active
  isActiveVariable: z.string(),
  // Variable storing gestational carrier status (parent edges only)
  isGestationalCarrierVariable: z.string(),
});

export const FamilyPedigreeStageSchema = z.object({
  type: z.literal('FamilyPedigree'),

  // Ego shape — references a variable in the ego codebook
  egoShapeVariable: z.string(),
  egoShapeMapping: z.record(z.string(), NodeShapeSchema),

  nodeConfig: NodeConfigSchema,
  edgeConfig: EdgeConfigSchema,

  // Prompt shown during the family building phase
  censusPrompt: z.string(),
  // Optional attribute nomination steps (e.g. disease nomination)
  nominationPrompts: z.array(NominationPromptSchema).optional(),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type ParentType = z.infer<typeof ParentTypeSchema>;
export type ParentEdge = z.infer<typeof ParentEdgeSchema>;
export type PartnerEdge = z.infer<typeof PartnerEdgeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormConfig = z.infer<typeof FormConfigSchema>;
export type NominationPrompt = z.infer<typeof NominationPromptSchema>;
export type NodeConfig = z.infer<typeof NodeConfigSchema>;
export type EdgeConfig = z.infer<typeof EdgeConfigSchema>;
export type FamilyPedigreeStage = z.infer<typeof FamilyPedigreeStageSchema>;
