/**
 * Test data constants for SILOS protocol E2E tests.
 *
 * This file contains the specific values needed to navigate through the
 * "happy path" of the SILOS protocol, which exercises the maximum number
 * of stage types and varied interactions.
 *
 * The happy path follows the "male" eligibility path:
 * - Sex assigned at birth: Male (avoids female confirmation branch)
 * - HIV Status: Negative (shows PrEP stage instead of ART)
 * - Uses poppers and meth (enables chemsex stages)
 * - Adds sex partners (enables sociogram and partner stages)
 * - Healthcare access: true (enables healthcare nomination)
 */

// ============================================================
// Ego Variable UUIDs (from protocol codebook)
// ============================================================

export const EGO_VARIABLES = {
  // Demographics
  dateOfBirth: '596c2ac2-9fd4-42f4-a0f3-cfa7f1676551',
  sexualIdentity: '4d9cd886-2834-48ce-ba80-38a0dc9a5dd6',
  sexAssignedAtBirth: 'f3d7559b-3a07-4719-8e4a-1db49d270f7b',
  gender: 'a06f06f5-b688-487c-8e3b-ca916aed2b84',
  race: '92869afe-a300-404c-a390-5fbc3f48cf25',
  hispanic: 'dc6779f2-4c6f-48bb-9e9c-2f6f014cf620',
  yearsLived: '817b4886-bf32-431b-adce-81cbc3fcf233',
  hivStatus: 'fe681ff5-adaf-40b8-8376-20b5f53c93c7',

  // Female confirmation (critical skip logic variable)
  femaleConfirmed: 'f249c2d1-3f54-49a9-83d8-81e2387df5e5',

  // Perceived by others
  perceivedRace: '8a4af15c-394b-45eb-915d-6a150191758a',
  perceivedHispanic: '4f26a2c2-53c0-4802-b955-c84c8ca46c12',
  perceivedGender: '648cb03d-7119-405f-98d7-9d4b6e5ec097',
  perceivedSexualIdentity: '0848da8d-c6b0-48c1-8520-b62dfc45212d',

  // Substance use
  marijuanaUsed: '4ff3010b-4706-4e40-9a9e-0735b50c489f',
  cocaineUsed: '14cd06ba-6a48-403b-99a4-3ba97ed9523f',
  heroinUsed: '9e3c5efd-412d-40e3-9e30-fc53d8a8eb0a',
  painkillersUsed: '62b4364d-9802-4faa-8c35-61db120d24d6',
  poppersUsed: '220b8a1a-2001-4e22-a240-195bca3f63dd',
  methUsed: '6655b2bb-59bb-4584-b1bb-19de37fdf0f3',

  // Healthcare
  healthcareAccess: '606361d0-6c1d-4763-b3f0-e8c122a08a68',

  // PrEP/ART
  egoPrEP: '3736e8f1-af8c-4594-a1a1-d9a413e7a137',
  egoART: 'd1fd1340-481f-4750-aa41-1508d607ab52',

  // Social support
  personInNeed: '7c2c9953-1d3a-498f-a83d-11b6378213f4',
  shareJoySorrow: 'c08cb514-c349-4402-a2fb-49e6b238ea06',
} as const;

// ============================================================
// Node Type UUIDs
// ============================================================

export const NODE_TYPES = {
  ego: '78ffb94c-6eba-4805-bc71-8154f7cbc9cf',
  person: '5f90648c-c728-4a92-acb2-fd066b6705cb',
  venue: '18ddf7b2-3c18-4ba1-be01-16232962975e',
  app: '1205e173-8d5a-4240-8303-b197d20e0482',
  provider: '2be424d0-12a6-4d16-94ea-5c7844ebdc67',
} as const;

// ============================================================
// Person Node Variable UUIDs (for form field names)
// Form fields use UUIDs as data-field-name, not human-readable names
// ============================================================

export const PERSON_VARIABLES = {
  // Common person variables
  name: 'b1eb909a-13cd-4dc6-ab90-c77e7bc2c5d3',
  Age: '6621dc88-9cde-43a1-85ec-6fc7689b2211',
  Relationship: '8f5d456b-06fb-4958-9a92-da6e87008bce',
  SexPartnerAge: '9dace85f-af41-4091-9209-389f0a24104a',
} as const;

// ============================================================
// Happy Path Test Data
// ============================================================

/**
 * Ego Information form data (Stage 4)
 * Uses Male sex at birth to avoid female confirmation branch.
 */
export const EGO_FORM_DATA = {
  // Date of birth - use ISO format (YYYY-MM-DD) for HTML date inputs
  // Must be within the protocol's allowed range (1996-01-01 to 2007-12-31)
  dateOfBirth: '2000-06-15',

  // Sexual identity
  sexualIdentity: 'Gay',

  // Sex assigned at birth - CRITICAL: Must be Male to avoid ineligibility
  sexAssignedAtBirth: 'Male',

  // Gender identity
  gender: 'Cisgender Male',

  // Race (categorical, can select multiple)
  race: ['Black'],

  // Hispanic/Latino
  hispanic: 'Not Hispanic or Latino',

  // Years in Chicagoland
  yearsLived: '10',

  // HIV Status - Negative to show PrEP stage (not ART)
  hivStatus: 'HIV Negative',
};

/**
 * Perceived by others form data (Stage 7)
 */
export const EGO_PERCEIVED_DATA = {
  perceivedRace: 'Black',
  perceivedHispanic: 'Not Hispanic or Latino',
  perceivedGender: 'Cisgender Man',
  perceivedSexualIdentity: 'Gay',
};

/**
 * Substance use form data (Stage 10)
 * Enable poppers and meth to see chemsex stages.
 */
export const EGO_SUBSTANCES_DATA = {
  marijuanaUsed: true,
  cocaineUsed: false,
  heroinUsed: false,
  painkillersUsed: false,
  poppersUsed: true, // Enables Poppers chemsex stage
  methUsed: true, // Enables Methamphetamine chemsex stage
};

/**
 * Self-nomination data (Stage 3)
 */
export const SELF_NOMINATION = {
  name: 'Me',
};

/**
 * Close ties to add (Stage 12 - first prompt)
 * Field names must match protocol codebook exactly (case-sensitive)
 */
export const CLOSE_TIES = [
  { name: 'Friend1', Age: '30', Relationship: 'Friend' },
  { name: 'Friend2', Age: '28', Relationship: 'Family / Relative' },
];

/**
 * Drug partners to add (Stage 12 - second prompt)
 * Can reuse close ties or add new ones
 */
export const DRUG_PARTNERS = [
  // Friend1 is also a drug partner (drag from side panel)
];

/**
 * Sex partners to add (Stage 13)
 * Add at least one to enable sociogram and partner stages.
 * Field names must match protocol codebook exactly (case-sensitive)
 * NOTE: name field has maxLength: 7 validation
 */
export const SEX_PARTNERS = [
  { name: 'SexP1', SexPartnerAge: '25' },
  { name: 'SexP2', SexPartnerAge: '32' },
];

/**
 * Venues to add (Stages 36-37)
 */
export const VENUES = [{ name: 'Club1' }, { name: 'Bar1' }];

/**
 * Apps to add (Stage 47)
 */
export const APPS = [{ name: 'Grindr' }];

/**
 * Healthcare providers to add (Stage 49)
 */
export const HEALTHCARE_PROVIDERS = [{ name: 'Clinic1' }];

// ============================================================
// Bin Assignment Data
// ============================================================

/**
 * OrdinalBin assignments (Stage 16 - closeness)
 */
export const ORDINAL_BIN_ASSIGNMENTS = {
  Friend1: 'Very Close',
  Friend2: 'Somewhat Close',
  SexP1: 'Very Close',
  SexP2: 'Somewhat Close',
};

/**
 * CategoricalBin assignments (Stage 17 - relationship type)
 */
export const CATEGORICAL_BIN_ASSIGNMENTS = {
  Friend1: 'Friend',
  Friend2: 'Family',
  SexP1: 'Partner',
  SexP2: 'Partner',
};

/**
 * Lives in Chicago assignments (Stage 18)
 * Mark at least one as "y" to enable Alter Census Tract stage.
 */
export const LIVES_IN_CHICAGO = {
  Friend1: 'y',
  Friend2: 'y',
  SexP1: 'y',
  SexP2: 'n',
};

/**
 * Anal sex check assignments (Stage 24)
 * Mark at least one as having anal sex to enable follow-up stages.
 */
export const ANAL_SEX_ASSIGNMENTS = {
  SexP1: 'Anal_sex',
  SexP2: 'No_anal_sex',
};

/**
 * Partner HIV status (for Alter PrEP/ART stages)
 */
export const PARTNER_HIV_STATUS = {
  SexP1: 'HIV_Negative', // Shows Alter PrEP
  SexP2: 'Dont_know',
};

/**
 * Partner place met (Stage 30)
 * Mark one as "Physical_Place_or_Venue" and one as "Online_Mobile_App"
 * to enable both Name Place Met and Name App Met stages.
 */
export const PARTNER_PLACE_MET = {
  SexP1: 'Physical_Place_or_Venue',
  SexP2: 'Online_Mobile_App',
};

/**
 * Venue type assignments (Stage 39)
 */
export const VENUE_TYPE_ASSIGNMENTS = {
  Club1: 'Bar or Club',
  Bar1: 'Bar or Club',
};

// ============================================================
// Healthcare Data
// ============================================================

/**
 * Healthcare access form data (Stage 48)
 */
export const HEALTHCARE_ACCESS_DATA = {
  healthcareAccess: true, // Enables Healthcare Nomination stage
};

// ============================================================
// Social Support Data (Stage 53)
// ============================================================

export const SOCIAL_SUPPORT_DATA = {
  personInNeed: 'Agree',
  shareJoySorrow: 'Agree',
};

// ============================================================
// PrEP Data (Stage 22)
// ============================================================

export const EGO_PREP_DATA = {
  egoPrEP: 'Yes',
};

// ============================================================
// Stage Checkpoints
// ============================================================

/**
 * Checkpoint stages for validating progress through the protocol.
 * These are key stages where we can verify the test is on track.
 */
export const CHECKPOINTS = [
  { index: 2, name: 'Self-Nomination', description: 'Ego node created' },
  { index: 3, name: 'Ego Information', description: 'Demographics collected' },
  { index: 8, name: 'Ego Census Tract', description: 'Geospatial works' },
  { index: 11, name: 'Name Generators', description: 'Alters created' },
  { index: 13, name: 'Sociogram', description: 'Edges created' },
  { index: 16, name: 'Ordinal Bins', description: 'Drag-drop works' },
  { index: 35, name: 'Venue Nomination', description: 'Different node type' },
  { index: 47, name: 'App Nomination', description: 'App nodes work' },
  { index: 48, name: 'Healthcare Access', description: 'Late-protocol form' },
  { index: 52, name: 'Social Support', description: 'Final stages' },
] as const;

// ============================================================
// Expected Stage Counts by Path
// ============================================================

export const EXPECTED_STAGES = {
  // Male path (happy path) - approximately 47 stages
  male: 47,

  // Female ineligible path - terminates early at stage 6
  femaleIneligible: 6,
} as const;
