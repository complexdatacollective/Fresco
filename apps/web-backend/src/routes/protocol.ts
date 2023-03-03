import express, { Router } from "express";
import protocolController from '../controllers/protocol';
import multipartUpload from '../middleware/multipart';

const router: Router = express.Router();

// Handle protocol upload
router.post('/', multipartUpload.single('protocolFile'), protocolController)

export default router;