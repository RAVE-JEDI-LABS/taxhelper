// Mock Firebase Admin SDK
jest.mock('../services/firebase', () => ({
  initializeFirebase: jest.fn(),
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      get: jest.fn(),
    })),
  })),
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
  getStorage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(() => ({
        save: jest.fn(),
        getSignedUrl: jest.fn(),
      })),
    })),
  })),
}));

// Mock Twilio
jest.mock('../services/twilio', () => ({
  validateTwilioSignature: jest.fn(() => true),
  generateStreamTwiML: jest.fn(),
  generateTransferTwiML: jest.fn(),
  generateVoicemailTwiML: jest.fn(),
  generateHangupTwiML: jest.fn(),
  generateWhisperTwiML: jest.fn(),
  updateCall: jest.fn(),
  sendSms: jest.fn(),
}));

// Mock ElevenLabs
jest.mock('../services/elevenlabs', () => ({
  createConversation: jest.fn(),
}));

// Test user fixtures
export const TEST_USERS = {
  admin: {
    uid: 'admin-uid-123',
    email: 'admin@gordonulencpa.com',
    role: 'admin',
  },
  preparer: {
    uid: 'preparer-uid-456',
    email: 'preparer@gordonulencpa.com',
    role: 'preparer',
  },
  frontDesk: {
    uid: 'frontdesk-uid-789',
    email: 'frontdesk@gordonulencpa.com',
    role: 'front_desk',
  },
  customer: {
    uid: 'customer-uid-abc',
    email: 'customer@example.com',
    role: 'customer',
  },
};

// Test customer fixtures
export const TEST_CUSTOMERS = {
  customer1: {
    id: 'customer-id-1',
    firebaseUid: 'customer-uid-abc',
    firstName: 'John',
    lastName: 'Doe',
    email: 'customer@example.com',
    phone: '+1234567890',
    entityType: 'individual',
    portalAccess: true,
  },
  customer2: {
    id: 'customer-id-2',
    firebaseUid: 'other-customer-uid',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    entityType: 'individual',
    portalAccess: true,
  },
};

// Test tax return fixtures
export const TEST_RETURNS = {
  return1: {
    id: 'return-id-1',
    customerId: 'customer-id-1',
    taxYear: 2024,
    status: 'in_preparation',
    returnType: '1040',
    assignedPreparer: 'preparer-uid-456',
  },
  return2: {
    id: 'return-id-2',
    customerId: 'customer-id-2',
    taxYear: 2024,
    status: 'documents_pending',
    returnType: '1040',
  },
};

// Console output suppression for cleaner test output
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
