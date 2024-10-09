import { describe, expect, it } from 'vitest';
import { appSettingPreprocessedSchema, appSettingSchema } from '../appSettings';

describe('App Settings Schema Validators', () => {
  describe('App Setting Schema', () => {
    it('should allow valid settings', () => {
      const validSettings = {
        configured: true,
        allowAnonymousRecruitment: false,
        limitInterviews: true,
        initializedAt: new Date(),
        installationId: 'installation123',
        sandboxMode: false,
        disableAnalytics: true,
        publicUrl: 'https://example.com',
        hasUploadThingToken: 'secret123',
      };

      expect(appSettingSchema.parse(validSettings)).toEqual(validSettings);
    });

    it('should reject missing required fields', () => {
      const invalidSettings = {
        allowAnonymousRecruitment: false,
        initializedAt: new Date(),
        installationId: 'installation123',
        sandboxMode: false,
      };

      expect(() => appSettingSchema.parse(invalidSettings)).toThrow();
    });

    it('should allow optional fields to be undefined', () => {
      const settings = {
        configured: true,
        allowAnonymousRecruitment: false,
        limitInterviews: true,
        initializedAt: new Date(),
        installationId: 'installation123',
        sandboxMode: false,
        disableAnalytics: true,
      };

      expect(appSettingSchema.parse(settings)).toEqual(settings);
    });
  });

  describe('App Setting Preprocessed Schema', () => {
    it('should parse and convert string date to Date object', () => {
      const validSettings = {
        configured: 'true',
        allowAnonymousRecruitment: 'false',
        limitInterviews: 'true',
        initializedAt: '2023-10-01T00:00:00.000Z',
        installationId: 'installation123',
        sandboxMode: 'false',
        disableAnalytics: 'true',
      };

      const result = appSettingPreprocessedSchema.parse(validSettings);
      expect(result.initializedAt).toBeInstanceOf(Date);
    });

    it('should preprocess boolean strings to booleans', () => {
      const validSettings = {
        configured: 'true',
        allowAnonymousRecruitment: 'false',
        limitInterviews: 'true',
        initializedAt: '2023-10-01T00:00:00.000Z',
        installationId: 'installation123',
        sandboxMode: 'false',
        disableAnalytics: 'true',
      };

      const result = appSettingPreprocessedSchema.parse(validSettings);
      expect(result.configured).toBe(true);
      expect(result.allowAnonymousRecruitment).toBe(false);
      expect(result.limitInterviews).toBe(true);
      expect(result.sandboxMode).toBe(false);
      expect(result.disableAnalytics).toBe(true);
    });

    it('should reject invalid boolean strings for boolean fields', () => {
      const invalidSettings = {
        configured: 'Yes',
        allowAnonymousRecruitment: 'No',
        limitInterviews: 'Y',
        initializedAt: '2023-10-01T00:00:00.000Z',
        installationId: 'installation123',
        sandboxMode: 'Yes',
        disableAnalytics: 'Yes',
      };

      expect(() =>
        appSettingPreprocessedSchema.parse(invalidSettings),
      ).toThrow();
    });

    it('should reject invalid date strings', () => {
      const invalidSettings = {
        configured: 'true',
        allowAnonymousRecruitment: 'false',
        limitInterviews: 'true',
        initializedAt: 'invalid-date',
        installationId: 'installation123',
        sandboxMode: 'false',
        disableAnalytics: 'true',
      };

      expect(() =>
        appSettingPreprocessedSchema.parse(invalidSettings),
      ).toThrow();
    });

    it('should reject invalid URL strings', () => {
      const invalidSettings = {
        configured: 'true',
        allowAnonymousRecruitment: 'false',
        limitInterviews: 'true',
        initializedAt: '2023-10-01T00:00:00.000Z',
        installationId: 'installation123',
        sandboxMode: 'false',
        disableAnalytics: 'true',
        publicUrl: 'invalid-url',
      };

      expect(() =>
        appSettingPreprocessedSchema.parse(invalidSettings),
      ).toThrow();
    });

    it('should allow valid URL strings', () => {
      const validSettings = {
        configured: 'true',
        allowAnonymousRecruitment: 'false',
        limitInterviews: 'true',
        initializedAt: '2023-10-01T00:00:00.000Z',
        installationId: 'installation123',
        sandboxMode: 'false',
        disableAnalytics: 'true',
        publicUrl: 'https://example.com',
      };

      expect(appSettingPreprocessedSchema.parse(validSettings)).toEqual({
        configured: true,
        allowAnonymousRecruitment: false,
        limitInterviews: true,
        initializedAt: new Date('2023-10-01T00:00:00.000Z'),
        installationId: 'installation123',
        sandboxMode: false,
        disableAnalytics: true,
        publicUrl: 'https://example.com',
      });
    });

    it('should allow undefined optional fields', () => {
      const validSettings = {
        configured: 'true',
        allowAnonymousRecruitment: 'false',
        limitInterviews: 'true',
        initializedAt: '2023-10-01T00:00:00.000Z',
        installationId: 'installation123',
        sandboxMode: 'false',
        disableAnalytic: 'true',
      };

      expect(appSettingPreprocessedSchema.parse(validSettings)).toEqual({
        configured: true,
        allowAnonymousRecruitment: false,
        limitInterviews: true,
        initializedAt: new Date('2023-10-01T00:00:00.000Z'),
        installationId: 'installation123',
        sandboxMode: false,
        disableAnalytics: true,
      });
    });
  });
});
