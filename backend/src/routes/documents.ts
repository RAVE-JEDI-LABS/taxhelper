import { Router } from 'express';
import multer from 'multer';
import { FirestoreService } from '../services/firestore.js';
import { getStorage } from '../services/firebase.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

interface Document {
  id?: string;
  customerId: string;
  taxYear: number;
  type?: 'w2' | '1099-r' | '1099-g' | '1099-int' | '1099-div' | '1099-nec' | 'k1' | 'other';
  fileName: string;
  fileUrl?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  ocrExtracted?: boolean;
  extractedData?: Record<string, any>;
  status?: 'pending' | 'processed' | 'verified';
  createdAt?: string;
  updatedAt?: string;
}

const documentService = new FirestoreService<Document>('documents');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  },
});

export const documentsRouter: Router = Router();

// List documents
documentsRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, taxYear, type, status, page, limit } = req.query;

    const filters: Record<string, any> = {};
    if (customerId) filters.customerId = customerId;
    if (taxYear) filters.taxYear = parseInt(taxYear as string);
    if (type) filters.type = type;
    if (status) filters.status = status;

    const result = await documentService.list(filters, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get document by ID
documentsRouter.get('/:id', async (req, res, next) => {
  try {
    const document = await documentService.getById(req.params.id);
    if (!document) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Create document record
documentsRouter.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { customerId, taxYear, type, fileName } = req.body;

    if (!customerId || !taxYear || !fileName) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId, taxYear, and fileName are required',
      });
    }

    const document = await documentService.create({
      customerId,
      taxYear: parseInt(taxYear),
      type: type || 'other',
      fileName,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.uid,
      ocrExtracted: false,
      status: 'pending',
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

// Upload document file
documentsRouter.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const file = req.file;
    const { customerId, taxYear, type } = req.body;

    if (!file) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'No file uploaded' });
    }

    if (!customerId || !taxYear) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'customerId and taxYear are required',
      });
    }

    // Upload to Firebase Storage
    let fileUrl = '';
    try {
      const bucket = getStorage().bucket();
      const filePath = `documents/${customerId}/${taxYear}/${Date.now()}_${file.originalname}`;
      const fileRef = bucket.file(filePath);

      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Get signed URL (valid for 1 year)
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
      fileUrl = url;
    } catch (storageError) {
      console.warn('Storage upload failed (may be using emulator):', storageError);
      fileUrl = `local://documents/${customerId}/${taxYear}/${file.originalname}`;
    }

    // Create document record
    const document = await documentService.create({
      customerId,
      taxYear: parseInt(taxYear),
      type: type || 'other',
      fileName: file.originalname,
      fileUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.uid,
      ocrExtracted: false,
      status: 'pending',
    });

    // TODO: Trigger OCR agent for document processing

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

// Update document (for OCR results)
documentsRouter.patch('/:id', async (req, res, next) => {
  try {
    const document = await documentService.update(req.params.id, req.body);
    if (!document) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Delete document
documentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await documentService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Document not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
