import multer from 'multer';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from 'node:crypto';

const multipart = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // OS temp directory
      const tempDir = mkdtempSync(join(tmpdir(), `protocol-${randomUUID()}`));
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50mb
  },
});

export default multipart;