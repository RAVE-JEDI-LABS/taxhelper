import { Request, Response, NextFunction } from 'express';
import { TEST_USERS, TEST_CUSTOMERS } from '../setup';

type UserType = keyof typeof TEST_USERS;

/**
 * Create a mock authenticated request for testing
 */
export function createMockRequest(userType?: UserType, overrides: Partial<Request> = {}): any {
  const req: any = {
    headers: {},
    body: {},
    params: {},
    query: {},
    user: userType ? TEST_USERS[userType] : undefined,
    customerId: undefined as string | undefined,
    customerRecord: undefined,
    ...overrides,
  };

  // If it's a customer, set up customer context
  if (userType === 'customer') {
    req.customerId = TEST_CUSTOMERS.customer1.id;
    req.customerRecord = TEST_CUSTOMERS.customer1;
  }

  return req;
}

/**
 * Create a mock response for testing
 */
export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };

  return res;
}

/**
 * Create a mock next function for testing
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Generate authorization header for a specific user type
 */
export function getAuthHeader(userType: UserType): Record<string, string> {
  const user = TEST_USERS[userType];
  // In tests, we'll mock the auth middleware to use these headers
  return {
    Authorization: `Bearer mock-token-${user.uid}`,
    'X-Test-User': JSON.stringify(user),
  };
}

/**
 * Mock the Firebase auth verification to return a specific user
 */
export function mockAuthVerification(userType: UserType) {
  const { getAuth } = require('../../services/firebase');
  const user = TEST_USERS[userType];

  (getAuth().verifyIdToken as jest.Mock).mockResolvedValue({
    uid: user.uid,
    email: user.email,
    role: user.role,
  });
}

/**
 * Mock Firestore operations for customer lookup
 */
export function mockCustomerLookup(customerId: string) {
  const { getDb } = require('../../services/firebase');
  const customer = customerId === TEST_CUSTOMERS.customer1.id
    ? TEST_CUSTOMERS.customer1
    : TEST_CUSTOMERS.customer2;

  const mockDoc = {
    exists: true,
    data: () => customer,
  };

  const mockDocRef = {
    get: jest.fn().mockResolvedValue(mockDoc),
  };

  const mockCollection = {
    doc: jest.fn().mockReturnValue(mockDocRef),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      empty: false,
      docs: [mockDoc],
    }),
  };

  (getDb().collection as jest.Mock).mockReturnValue(mockCollection);
}
