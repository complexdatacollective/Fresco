import { z as zm } from 'zod/mini';

export const s3ConfigSchema = zm.object({
  s3Endpoint: zm.string().check(zm.minLength(1, 'Endpoint URL is required.')),
  s3PublicUrl: zm.url('Public URL must be a valid URL.'),
  s3Bucket: zm.string().check(zm.minLength(1, 'Bucket name is required.')),
  s3Region: zm.string().check(zm.minLength(1, 'Region is required.')),
  s3AccessKeyId: zm
    .string()
    .check(zm.minLength(1, 'Access Key ID is required.')),
  s3SecretAccessKey: zm
    .string()
    .check(zm.minLength(1, 'Secret Access Key is required.')),
});

export type S3EnvValues = zm.infer<typeof s3ConfigSchema>;
