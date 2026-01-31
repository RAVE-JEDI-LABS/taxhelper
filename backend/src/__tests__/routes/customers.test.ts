import request from 'supertest';
import express from 'express';

// Define test data inline
const TEST_USERS = {
  admin: { uid: 'admin-uid-123', email: 'admin@gordonulencpa.com', role: 'admin' },
  preparer: { uid: 'preparer-uid-456', email: 'preparer@gordonulencpa.com', role: 'preparer' },
  frontDesk: { uid: 'frontdesk-uid-789', email: 'frontdesk@gordonulencpa.com', role: 'front_desk' },
  customer: { uid: 'customer-uid-abc', email: 'customer@example.com', role: 'customer' },
};

const MOCK_CUSTOMERS = {
  'customer-id-1': { id: 'customer-id-1', firebaseUid: 'customer-uid-abc', firstName: 'John', lastName: 'Doe', email: 'customer@example.com' },
  'customer-id-2': { id: 'customer-id-2', firebaseUid: 'other-customer-uid', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
};

// Mock cascade-delete service
jest.mock('../../services/cascade-delete', () => ({
  deleteCustomerCascade: jest.fn().mockResolvedValue({
    success: true,
    deleted: { customers: 1, returns: 0, documents: 0, appointments: 0, communications: 0 },
  }),
  previewCustomerDelete: jest.fn().mockResolvedValue({
    customer: { id: 'customer-id-1' },
    returns: 0,
    documents: 0,
    appointments: 0,
    communications: 0,
  }),
}));

// Mock validation service
jest.mock('../../services/validation', () => ({
  validateUserExists: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
  validateCustomerExists: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
  validateForeignKeys: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
}));

// Mock Firestore before importing routes
jest.mock('../../services/firestore', () => ({
  FirestoreService: jest.fn().mockImplementation(() => ({
    list: jest.fn().mockResolvedValue({
      data: Object.values(MOCK_CUSTOMERS),
      total: 2,
      page: 1,
      limit: 20,
    }),
    getById: jest.fn().mockImplementation((id: string) => {
      return Promise.resolve((MOCK_CUSTOMERS as any)[id] || null);
    }),
    findOne: jest.fn().mockImplementation((filters: any) => {
      if (filters.firebaseUid === 'customer-uid-abc') {
        return Promise.resolve(MOCK_CUSTOMERS['customer-id-1']);
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((data: any) => {
      return Promise.resolve({ id: 'new-customer-id', ...data });
    }),
    update: jest.fn().mockImplementation((id: string, data: any) => {
      const existing = (MOCK_CUSTOMERS as any)[id];
      if (!existing) return Promise.resolve(null);
      return Promise.resolve({ ...existing, ...data });
    }),
    delete: jest.fn().mockImplementation((id: string) => {
      return Promise.resolve(id in MOCK_CUSTOMERS);
    }),
  })),
}));

// Import after mocking
import { customersRouter } from '../../routes/customers';

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth middleware that uses X-Test-User header
  app.use((req: any, res, next) => {
    const testUserHeader = req.headers['x-test-user'];
    if (testUserHeader) {
      try {
        req.user = JSON.parse(testUserHeader as string);
        // Set customer context for customer users
        if (req.user.role === 'customer') {
          req.customerId = 'customer-id-1';
        }
      } catch {
        // Invalid header
      }
    }
    next();
  });

  app.use('/api/customers', customersRouter);
  return app;
};

describe('Customers API Routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /api/customers', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/api/customers');
      expect(response.status).toBe(401);
    });

    it('should return 403 for customer role (non-staff)', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('X-Test-User', JSON.stringify(TEST_USERS.customer));
      expect(response.status).toBe(403);
    });

    it('should return customers list for staff', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('X-Test-User', JSON.stringify(TEST_USERS.frontDesk));
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer for staff', async () => {
      const response = await request(app)
        .get('/api/customers/customer-id-1')
        .set('X-Test-User', JSON.stringify(TEST_USERS.preparer));
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('customer-id-1');
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .get('/api/customers/non-existent-id')
        .set('X-Test-User', JSON.stringify(TEST_USERS.admin));
      expect(response.status).toBe(404);
    });

    it('should allow customer to access own record', async () => {
      const response = await request(app)
        .get('/api/customers/customer-id-1')
        .set('X-Test-User', JSON.stringify(TEST_USERS.customer));
      expect(response.status).toBe(200);
    });

    it('should deny customer access to other records', async () => {
      const response = await request(app)
        .get('/api/customers/customer-id-2')
        .set('X-Test-User', JSON.stringify(TEST_USERS.customer));
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/customers', () => {
    it('should return 403 for non-staff', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('X-Test-User', JSON.stringify(TEST_USERS.customer))
        .send({ firstName: 'New', lastName: 'Customer', email: 'new@example.com' });
      expect(response.status).toBe(403);
    });

    it('should create customer for staff', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('X-Test-User', JSON.stringify(TEST_USERS.frontDesk))
        .send({ firstName: 'New', lastName: 'Customer', email: 'new@example.com' });
      expect(response.status).toBe(201);
    });

    it('should require firstName, lastName, and email', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('X-Test-User', JSON.stringify(TEST_USERS.admin))
        .send({ firstName: 'Only' });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should return 403 for non-admin', async () => {
      const response = await request(app)
        .delete('/api/customers/customer-id-1')
        .set('X-Test-User', JSON.stringify(TEST_USERS.preparer));
      expect(response.status).toBe(403);
    });

    it('should allow admin to delete', async () => {
      const response = await request(app)
        .delete('/api/customers/customer-id-1')
        .set('X-Test-User', JSON.stringify(TEST_USERS.admin));
      expect(response.status).toBe(204);
    });
  });
});
