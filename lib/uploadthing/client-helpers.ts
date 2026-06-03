import { genUploader } from 'uploadthing/client';
import type { OurFileRouter } from '~/app/api/uploadthing/core';

export const { uploadFiles, createUpload } = genUploader<OurFileRouter>();
