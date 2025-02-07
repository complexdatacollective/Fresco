export class MigrationNotPossibleError extends Error {
  constructor(from: number, to: number) {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MigrationNotPossibleError);
    }

    this.name = "MigrationNotPossibleError";
    this.message = `Migration to this version is not possible (${JSON.stringify(
      from,
    )} -> ${JSON.stringify(to)}).`;
  }
}

export class VersionMismatchError extends Error {
  constructor(from: number, to: number) {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VersionMismatchError);
    }

    this.name = "VersionMismatchError";
    this.message = `Nonsensical migration path (${JSON.stringify(
      from,
    )} -> ${JSON.stringify(to)}).`;
  }
}

export class MigrationStepError extends Error {
  constructor(version: number) {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MigrationStepError);
    }

    this.name = "MigrationStepError";
    this.message = `Migration step failed (${JSON.stringify(version)}).`;
  }
}

export class StringVersionError extends Error {
  constructor(version: number) {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MigrationNotPossibleError);
    }

    this.name = "StringVersionError";

    this.message = `The schema version is not recognised, must be an integer (${JSON.stringify(
      version,
    )}).`;
  }
}
