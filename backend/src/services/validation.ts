/**
 * Foreign Key Validation Service
 *
 * Validates that referenced entities exist before creating/updating records.
 */

import { FirestoreService } from './firestore.js';

const customersService = new FirestoreService('customers');
const usersService = new FirestoreService('users');

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate that a customer exists
 */
export async function validateCustomerExists(customerId: string): Promise<ValidationResult> {
  const customer = await customersService.getById(customerId);

  if (!customer) {
    return {
      valid: false,
      errors: [`Customer not found: ${customerId}`],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate that a user (staff member) exists
 */
export async function validateUserExists(userId: string): Promise<ValidationResult> {
  const user = await usersService.getById(userId);

  if (!user) {
    return {
      valid: false,
      errors: [`User not found: ${userId}`],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate multiple foreign keys at once
 */
export async function validateForeignKeys(validations: {
  customerId?: string;
  userId?: string;
  assignedPreparer?: string;
  assignedTo?: string;
}): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate customer if provided
  if (validations.customerId) {
    const result = await validateCustomerExists(validations.customerId);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }

  // Validate user/preparer if provided
  const userIdToValidate = validations.userId || validations.assignedPreparer || validations.assignedTo;
  if (userIdToValidate) {
    const result = await validateUserExists(userIdToValidate);
    if (!result.valid) {
      errors.push(...result.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Express middleware factory for validating foreign keys
 */
export function validateForeignKeysMiddleware(fields: {
  customerIdField?: string;
  userIdField?: string;
}) {
  return async (req: any, res: any, next: any) => {
    const validations: any = {};

    if (fields.customerIdField && req.body[fields.customerIdField]) {
      validations.customerId = req.body[fields.customerIdField];
    }

    if (fields.userIdField && req.body[fields.userIdField]) {
      validations.userId = req.body[fields.userIdField];
    }

    if (Object.keys(validations).length === 0) {
      return next();
    }

    const result = await validateForeignKeys(validations);

    if (!result.valid) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Foreign key validation failed',
        details: { errors: result.errors },
      });
    }

    next();
  };
}
