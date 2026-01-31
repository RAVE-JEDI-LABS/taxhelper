import request from 'supertest';
import express from 'express';

// Define test data inline
const TEST_USERS = {
  admin: { uid: 'admin-uid-123', email: 'admin@gordonulencpa.com', role: 'admin' },
  preparer: { uid: 'preparer-uid-456', email: 'preparer@gordonulencpa.com', role: 'preparer' },
  frontDesk: { uid: 'frontdesk-uid-789', email: 'frontdesk@gordonulencpa.com', role: 'front_desk' },
  customer: { uid: 'customer-uid-abc', email: 'customer@example.com', role: 'customer' },
};

const MOCK_RETURNS = {
  'return-id-1': { id: 'return-id-1', customerId: 'customer-id-1', taxYear: 2024, status: 'in_preparation', returnType: '1040' },
  'return-id-2': { id: 'return-id-2', customerId: 'customer-id-2', taxYear: 2024, status: 'documents_pending', returnType: '1040' },
};

// Mock cascade-delete service
jest.mock('../../services/cascade-delete', () => ({
  deleteReturnCascade: jest.fn().mockResolvedValue({
    success: true,
    deleted: { returns: 1, documents: 0 },
  }),
}));

// Mock validation service
jest.mock('../../services/validation', () => ({
  validateForeignKeys: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
}));

// Mock Firestore before importing routes
jest.mock('../../services/firestore', () => ({
  FirestoreService: jest.fn().mockImplementation((collection: string) => {
    if (collection === 'returns') {
      return {
        list: jest.fn().mockImplementation((filters: any) => {
          let data = Object.values(MOCK_RETURNS);
          if (filters.customerId) {
            data = data.filter((r: any) => r.customerId === filters.customerId);
          }
          return Promise.resolve({ data, total: data.length, page: 1, limit: 20 });
        }),
        getById: jest.fn().mockImplementation((id: string) => {
          return Promise.resolve((MOCK_RETURNS as any)[id] || null);
        }),
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data: any) => {
          return Promise.resolve({ id: 'new-return-id', ...data });
        }),
        update: jest.fn().mockImplementation((id: string, data: any) => {
          const existing = (MOCK_RETURNS as any)[id];
          if (!existing) return Promise.resolve(null);
          return Promise.resolve({ ...existing, ...data });
        }),
        delete: jest.fn().mockImplementation((id: string) => {
          return Promise.resolve(id in MOCK_RETURNS);
        }),
      };
    }
    if (collection === 'customers') {
      return {
        findOne: jest.fn().mockImplementation((filters: any) => {
          if (filters.firebaseUid === 'customer-uid-abc') {
            return Promise.resolve({ id: 'customer-id-1', firebaseUid: 'customer-uid-abc' });
          }
          return Promise.resolve(null);
        }),
      };
    }
    return {};
  }),
}));

// Import after mocking
import { returnsRouter } from '../../routes/returns';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware
  app.use((req: any, res, next) => {
    const testUserHeader = req.headers['x-test-user'];
    if (testUserHeader) {
      try {
        req.user = JSON.parse(testUserHeader as string);
        if (req.user.role === 'customer') {
          req.customerId = 'customer-id-1';
        }
      } catch {
        // Invalid header
      }
    }
    next();
  });

  app.use('/api/returns', returnsRouter);
  return app;
};

describe('Returns API Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/returns', () => {
    it('should return all returns for staff', async () => {
      const response = await request(app)
        .get('/api/returns')
        .set('X-Test-User', JSON.stringify(TEST_USERS.preparer));
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter returns for customers', async () => {
      const response = await request(app)
        .get('/api/returns')
        .set('X-Test-User', JSON.stringify(TEST_USERS.customer));
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/returns/:id', () => {
    it('should return return for staff', async () => {
      const response = await request(app)
        .get('/api/returns/return-id-1')
        .set('X-Test-User', JSON.stringify(TEST_USERS.preparer));
      expect(response.status).toBe(200);
    });

    it('should allow customer to access own return', async () => {
      const response = await request(app)
        .get('/api/returns/return-id-1')
        .set('X-Test-User', JSON.stringify(TEST_USERS.customer));
      expect(response.status).toBe(200);
    });

    it('should deny customer access to other returns', async () => {
      const response = await request(app)
        .get('/api/returns/return-id-2')
        .set('X-Test-User', JSON.stringify(TEST_USERS.customer));
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/returns', () => {
    it('should return 403 for non-preparer', async () => {
      const response = await request(app)
        .post('/api/returns')
        .set('X-Test-User', JSON.stringify(TEST_USERS.frontDesk))
        .send({ customerId: 'customer-id-1', taxYear: 2024, returnType: '1040' });
      expect(response.status).toBe(403);
    });

    it('should create return for preparer', async () => {
      const response = await request(app)
        .post('/api/returns')
        .set('X-Test-User', JSON.stringify(TEST_USERS.preparer))
        .send({ customerId: 'customer-id-1', taxYear: 2024, returnType: '1040' });
      expect(response.status).toBe(201);
    });
  });

  describe('DELETE /api/returns/:id', () => {
    it('should return 403 for non-admin', async () => {
      const response = await request(app)
        .delete('/api/returns/return-id-1')
        .set('X-Test-User', JSON.stringify(TEST_USERS.preparer));
      expect(response.status).toBe(403);
    });

    it('should allow admin to delete', async () => {
      const response = await request(app)
        .delete('/api/returns/return-id-1')
        .set('X-Test-User', JSON.stringify(TEST_USERS.admin));
      expect(response.status).toBe(204);
    });
  });
});
