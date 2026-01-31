import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { FirestoreService } from '../services/firestore.js';

// Valid user roles matching OpenAPI schema
export type UserRole = 'admin' | 'preparer' | 'front_desk' | 'customer';

// Customer interface for ownership checks
interface CustomerRecord {
  id?: string;
  firebaseUid?: string;
}

// Lazy-loaded customer service to avoid circular dependencies
let customerService: FirestoreService<CustomerRecord> | null = null;

function getCustomerService(): FirestoreService<CustomerRecord> {
  if (!customerService) {
    customerService = new FirestoreService<CustomerRecord>('customers');
  }
  return customerService;
}

// Extend AuthenticatedRequest to include customer context
declare module './auth.js' {
  interface AuthenticatedRequest {
    customerId?: string;
    customerRecord?: CustomerRecord;
  }
}

/**
 * Middleware to require specific user roles
 * Usage: requireRole('admin', 'preparer')
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role as UserRole | undefined;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation',
      });
    }

    next();
  };
}

/**
 * Require staff role (admin, preparer, or front_desk)
 */
export function requireStaff() {
  return requireRole('admin', 'preparer', 'front_desk');
}

/**
 * Require preparer role (admin or preparer)
 */
export function requirePreparer() {
  return requireRole('admin', 'preparer');
}

/**
 * Require admin role only
 */
export function requireAdmin() {
  return requireRole('admin');
}

/**
 * Check if user is staff (for use in route handlers)
 */
export function isStaff(req: AuthenticatedRequest): boolean {
  const role = req.user?.role as UserRole | undefined;
  return role ? ['admin', 'preparer', 'front_desk'].includes(role) : false;
}

/**
 * Check if user is admin (for use in route handlers)
 */
export function isAdmin(req: AuthenticatedRequest): boolean {
  return req.user?.role === 'admin';
}

/**
 * Check if user is a customer (for use in route handlers)
 */
export function isCustomer(req: AuthenticatedRequest): boolean {
  return req.user?.role === 'customer';
}

/**
 * Middleware to load customer context for portal users
 * This finds the customer record linked to the authenticated Firebase user
 * and attaches it to the request for downstream authorization checks
 */
export function loadCustomerContext() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userRole = req.user.role as UserRole | undefined;

    // Only load customer context for customer role
    if (userRole !== 'customer') {
      return next();
    }

    try {
      const service = getCustomerService();
      const customer = await service.findOne({ firebaseUid: req.user.uid });

      if (customer) {
        req.customerId = customer.id;
        req.customerRecord = customer;
      }

      next();
    } catch (error) {
      console.error('Error loading customer context:', error);
      // Don't fail the request, just continue without customer context
      next();
    }
  };
}

/**
 * Middleware to require resource ownership for customer portal users
 * Staff can access any resource, customers can only access their own
 *
 * This middleware should be used AFTER loadCustomerContext()
 *
 * @param resourceCustomerIdGetter - Function to extract customerId from request
 */
export function requireResourceOwnership(
  resourceCustomerIdGetter?: (req: AuthenticatedRequest) => string | undefined
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role as UserRole | undefined;

    // Staff can access any resource
    if (userRole && ['admin', 'preparer', 'front_desk'].includes(userRole)) {
      return next();
    }

    // For customers, verify ownership
    if (userRole === 'customer') {
      // Customer must have a linked customer record
      if (!req.customerId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'No customer profile linked to this account',
        });
      }

      // If a getter is provided, check resource ownership
      if (resourceCustomerIdGetter) {
        const resourceCustomerId = resourceCustomerIdGetter(req);

        if (resourceCustomerId && resourceCustomerId !== req.customerId) {
          return res.status(403).json({
            code: 'FORBIDDEN',
            message: 'You do not have access to this resource',
          });
        }
      }

      return next();
    }

    // Unknown role
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Insufficient permissions',
    });
  };
}

/**
 * Middleware to filter list queries to only show customer's own resources
 * For staff, no filtering is applied
 * For customers, adds customerId filter to query
 */
export function filterByOwnership() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role as UserRole | undefined;

    // For customers, force customerId filter
    if (userRole === 'customer') {
      if (!req.customerId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'No customer profile linked to this account',
        });
      }

      // Add customerId to query params for filtering
      req.query.customerId = req.customerId;
    }

    next();
  };
}

/**
 * Verify that a resource belongs to the authenticated customer
 * Utility function for use in route handlers
 */
export function verifyOwnership(
  req: AuthenticatedRequest,
  resourceCustomerId: string | undefined
): boolean {
  // Staff can access any resource
  if (isStaff(req)) {
    return true;
  }

  // Customers can only access their own resources
  if (isCustomer(req) && req.customerId) {
    return resourceCustomerId === req.customerId;
  }

  return false;
}
