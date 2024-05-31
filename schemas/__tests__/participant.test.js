import { describe, expect, it } from 'vitest';
import {
  FormSchema,
  ParticipantRowSchema,
  participantIdentifierOptionalSchema,
  participantIdentifierSchema,
  participantLabelRequiredSchema,
  participantLabelSchema,
} from '../participant';

describe('Participant Schema Validators', () => {
  describe('Participant Identifier Schema', () => {
    it('should allow valid identifiers', () => {
      expect(participantIdentifierSchema.parse('abcd1234')).toBe('abcd1234');
    });

    it('should reject strings longer than 255 characters', () => {
      expect(() => participantIdentifierSchema.parse('a'.repeat(256))).toThrow(
        'Identifier too long. Maximum of 255 characters.',
      );
    });

    it('should reject empty strings', () => {
      expect(() => participantIdentifierSchema.parse('')).toThrow(
        'Identifier cannot be empty',
      );
    });

    it('should reject strings with only whitespace characters', () => {
      expect(() => participantIdentifierSchema.parse('   ')).toThrow(
        'Identifier requires one or more non-whitespace characters.',
      );
    });

    it('should allow and trim valid identifiers with leading and trailing whitespace characters', () => {
      expect(participantIdentifierSchema.parse('  abcd1234  ')).toBe(
        'abcd1234',
      );
    });
  });
  describe('Participant Identifier Optional Schema', () => {
    it('should allow valid identifiers', () => {
      expect(participantIdentifierOptionalSchema.parse('abcd1234')).toBe(
        'abcd1234',
      );
    });

    it('should reject strings longer than 255 characters', () => {
      expect(() =>
        participantIdentifierOptionalSchema.parse('a'.repeat(256)),
      ).toThrow('Identifier too long. Maximum of 255 characters.');
    });

    it('should accept empty strings', () => {
      expect(participantIdentifierOptionalSchema.parse('')).toBe('');
    });

    it('should accept and trim whitespace characters to empty string', () => {
      expect(participantIdentifierOptionalSchema.parse('     ')).toBe('');
    });

    it('should allow and trim valid identifiers with leading and trailing whitespace characters', () => {
      expect(participantIdentifierOptionalSchema.parse('  abcd1234  ')).toBe(
        'abcd1234',
      );
    });
  });
  describe('Participant Label (Optional) Schema', () => {
    it('should allow valid labels', () => {
      expect(participantLabelSchema.parse('Label1')).toBe('Label1');
    });
    it('should allow empty strings', () => {
      expect(participantLabelSchema.parse('')).toBe('');
    });
    it('should allow and trim label with only whitespace characters to empty string', () => {
      expect(participantLabelSchema.parse('   ')).toBe('');
    });
  });
  describe('Participant Label Required Schema', () => {
    it('should allow valid labels', () => {
      expect(participantLabelRequiredSchema.parse('abcd')).toBe('abcd');
    });
    it('should reject empty strings', () => {
      expect(() => participantLabelRequiredSchema.parse('')).toThrow(
        'Label requires one or more non-whitespace characters.',
      );
    });
    it('should reject label with only whitespace characters', () => {
      expect(() => participantLabelRequiredSchema.parse('     ')).toThrow(
        'Label requires one or more non-whitespace characters.',
      );
    });
  });
});

describe('Participant Row Schema - CSV import row', () => {
  it('should allow valid identifier and optional label', () => {
    expect(
      ParticipantRowSchema.parse({
        identifier: 'abcd1234',
        label: 'Label1',
      }),
    ).toEqual({
      identifier: 'abcd1234',
      label: 'Label1',
    });
  });

  it('should allow valid identifier without label', () => {
    expect(
      ParticipantRowSchema.parse({
        identifier: 'abcd1234',
      }),
    ).toEqual({
      identifier: 'abcd1234',
    });
  });

  it('should allow valid identifier with empty string label', () => {
    expect(
      ParticipantRowSchema.parse({
        identifier: 'abcd1234',
        label: '',
      }),
    ).toEqual({
      identifier: 'abcd1234',
      label: '',
    });
  });

  it('should allow valid label and optional identifier', () => {
    expect(
      ParticipantRowSchema.parse({
        label: 'Label1',
        identifier: 'abcd1234',
      }),
    ).toEqual({
      label: 'Label1',
      identifier: 'abcd1234',
    });
  });

  it('should allow valid label without identifier', () => {
    expect(
      ParticipantRowSchema.parse({
        label: 'Label1',
      }),
    ).toEqual({
      label: 'Label1',
    });
  });

  it('should allow valid label with empty string identifier', () => {
    expect(
      ParticipantRowSchema.parse({
        label: 'Label1',
        identifier: '',
      }),
    ).toEqual({
      label: 'Label1',
      identifier: '',
    });
  });

  it('should reject if both identifier and label are empty strings', () => {
    expect(() =>
      ParticipantRowSchema.parse({
        identifier: '',
        label: '',
      }),
    ).toThrow('Identifier cannot be empty');
  });

  it('should reject invalid identifier even when label is provided', () => {
    expect(() =>
      ParticipantRowSchema.parse({
        label: 'Label1',
        identifier: 'a'.repeat(256),
      }),
    ).toThrow('Identifier too long. Maximum of 255 characters.');
  });

  it('should reject empty label and no identifier', () => {
    expect(() =>
      ParticipantRowSchema.parse({
        label: '',
      }),
    ).toThrow('Label requires one or more non-whitespace characters.');
  });

  it('should reject empty identifier and no label', () => {
    expect(() =>
      ParticipantRowSchema.parse({
        identifier: '',
      }),
    ).toThrow('Identifier requires one or more non-whitespace characters.');
  });

  it('should reject whitespace label and no identifier', () => {
    expect(() =>
      ParticipantRowSchema.parse({
        label: '    ',
      }),
    ).toThrow('Label requires one or more non-whitespace characters.');
  });

  it('should reject whitespace identifier and no label', () => {
    expect(() =>
      ParticipantRowSchema.parse({
        identifier: '    ',
      }),
    ).toThrow('Identifier requires one or more non-whitespace characters.');
  });
});

describe('CSV Schema', () => {
  it('should allow valid CSV with multiple rows', () => {
    const validCsv = [
      { identifier: 'abcd1234', label: 'Label1' },
      { identifier: 'xyz7890', label: '' },
      { identifier: 'abcd5678' },
      { label: 'Label2', identifier: 'abcd3456' },
      { label: 'Label3' },
    ];

    expect(FormSchema.parse({ csvFile: validCsv })).toEqual({
      csvFile: validCsv,
    });
  });

  it('should reject invalid CSV with an invalid row', () => {
    const invalidCsv = [
      { identifier: ' abcd1234', label: 'Label1' },
      { identifier: '', label: '    ' },
    ];

    expect(() => FormSchema.parse({ csvFile: invalidCsv })).toThrow();
  });
});
