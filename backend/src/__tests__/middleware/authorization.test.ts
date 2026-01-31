import {
  requireRole,
  requireStaff,
  requirePreparer,
  requireAdmin,
  isStaff,
  isAdmin,
  isCustomer,
  verifyOwnership,
} from '../../middleware/authorization';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/auth';

describe('Authorization Middleware', () => {
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('requireRole', () => {
    it('should return 401 when user is not authenticated', () => {
      const req = createMockRequest();
      const middleware = requireRole('admin');

      middleware(req, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user has wrong role', () => {
      const req = createMockRequest('customer');
      const middleware = requireRole('admin');

      middleware(req, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next when user has correct role', () => {
      const req = createMockRequest('admin');
      const middleware = requireRole('admin');

      middleware(req, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should accept multiple allowed roles', () => {
      const req = createMockRequest('preparer');
      const middleware = requireRole('admin', 'preparer');

      middleware(req, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireStaff', () => {
    it('should allow admin', () => {
      const req = createMockRequest('admin');
      const middleware = requireStaff();

      middleware(req, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow preparer', () => {
      const req = createMockRequest('preparer');
      const middleware = requireStaff();

      middleware(req, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow front_desk', () => {
      const req = createMockRequest('frontDesk');
      const middleware = requireStaff();

      middleware(req, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny customer', () => {
      const req = createMockRequest('customer');
      const middleware = requireStaff();

      middleware(req, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePreparer', () => {
    it('should allow admin', () => {
      const req = createMockRequest('admin');
      const middleware = requirePreparer();

      middleware(req, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow preparer', () => {
      const req = createMockRequest('preparer');
      const middleware = requirePreparer();

      middleware(req, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny front_desk', () => {
      const req = createMockRequest('frontDesk');
      const middleware = requirePreparer();

      middleware(req, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireAdmin', () => {
    it('should only allow admin', () => {
      const adminReq = createMockRequest('admin');
      const preparerReq = createMockRequest('preparer');
      const middleware = requireAdmin();

      middleware(adminReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      mockNext = createMockNext();
      middleware(preparerReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('isStaff helper', () => {
    it('should return true for staff roles', () => {
      expect(isStaff(createMockRequest('admin'))).toBe(true);
      expect(isStaff(createMockRequest('preparer'))).toBe(true);
      expect(isStaff(createMockRequest('frontDesk'))).toBe(true);
    });

    it('should return false for customer role', () => {
      expect(isStaff(createMockRequest('customer'))).toBe(false);
    });

    it('should return false for unauthenticated request', () => {
      expect(isStaff(createMockRequest())).toBe(false);
    });
  });

  describe('isAdmin helper', () => {
    it('should return true only for admin', () => {
      expect(isAdmin(createMockRequest('admin'))).toBe(true);
      expect(isAdmin(createMockRequest('preparer'))).toBe(false);
      expect(isAdmin(createMockRequest('customer'))).toBe(false);
    });
  });

  describe('isCustomer helper', () => {
    it('should return true only for customer', () => {
      expect(isCustomer(createMockRequest('customer'))).toBe(true);
      expect(isCustomer(createMockRequest('admin'))).toBe(false);
    });
  });

  describe('verifyOwnership', () => {
    it('should allow staff to access any resource', () => {
      const req = createMockRequest('admin');
      expect(verifyOwnership(req, 'any-customer-id')).toBe(true);
    });

    it('should allow customer to access own resource', () => {
      const req = createMockRequest('customer');
      // Customer context is set up in createMockRequest for customer type
      expect(verifyOwnership(req, 'customer-id-1')).toBe(true);
    });

    it('should deny customer access to other resources', () => {
      const req = createMockRequest('customer');
      expect(verifyOwnership(req, 'other-customer-id')).toBe(false);
    });

    it('should deny unauthenticated access', () => {
      const req = createMockRequest();
      expect(verifyOwnership(req, 'any-customer-id')).toBe(false);
    });
  });
});
