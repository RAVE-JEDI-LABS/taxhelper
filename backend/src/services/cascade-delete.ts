/**
 * Cascading Delete Service
 *
 * Handles deletion of entities and all related child records.
 * Uses Firestore batched writes for atomicity.
 */

import { getDb } from './firebase.js';
import { FirestoreService } from './firestore.js';
import type { components } from '@taxhelper/shared/generated/typescript/schema';

type TaxReturn = components['schemas']['TaxReturn'];
type Document = components['schemas']['Document'];
type Appointment = components['schemas']['Appointment'];
type Communication = components['schemas']['Communication'];
type Customer = components['schemas']['Customer'];

const returnsService = new FirestoreService<TaxReturn>('returns');
const documentsService = new FirestoreService<Document>('documents');
const appointmentsService = new FirestoreService<Appointment>('appointments');
const communicationsService = new FirestoreService<Communication>('communications');
const customersService = new FirestoreService<Customer>('customers');

export interface DeleteResult {
  success: boolean;
  deleted: {
    customers: number;
    returns: number;
    documents: number;
    appointments: number;
    communications: number;
  };
  error?: string;
}

/**
 * Delete a customer and all related records
 *
 * This cascades to:
 * - Tax Returns
 * - Documents
 * - Appointments
 * - Communications
 */
export async function deleteCustomerCascade(customerId: string): Promise<DeleteResult> {
  const db = getDb();
  const batch = db.batch();

  const result: DeleteResult = {
    success: false,
    deleted: {
      customers: 0,
      returns: 0,
      documents: 0,
      appointments: 0,
      communications: 0,
    },
  };

  try {
    // Verify customer exists
    const customer = await customersService.getById(customerId);
    if (!customer) {
      return {
        ...result,
        error: `Customer not found: ${customerId}`,
      };
    }

    // Get all related records
    const [returns, documents, appointments, communications] = await Promise.all([
      returnsService.list({ customerId }),
      documentsService.list({ customerId }),
      appointmentsService.list({ customerId }),
      communicationsService.list({ customerId }),
    ]);

    // Delete tax returns
    for (const taxReturn of returns.data) {
      if (taxReturn.id) {
        const ref = db.collection('returns').doc(taxReturn.id);
        batch.delete(ref);
        result.deleted.returns++;
      }
    }

    // Delete documents
    for (const doc of documents.data) {
      if (doc.id) {
        const ref = db.collection('documents').doc(doc.id);
        batch.delete(ref);
        result.deleted.documents++;
      }
      // Note: Should also delete the file from Firebase Storage
      // This would require importing storage and handling async
      // For now, we just delete the Firestore record
    }

    // Delete appointments
    for (const appointment of appointments.data) {
      if (appointment.id) {
        const ref = db.collection('appointments').doc(appointment.id);
        batch.delete(ref);
        result.deleted.appointments++;
      }
    }

    // Delete communications
    for (const comm of communications.data) {
      if (comm.id) {
        const ref = db.collection('communications').doc(comm.id);
        batch.delete(ref);
        result.deleted.communications++;
      }
    }

    // Delete the customer
    const customerRef = db.collection('customers').doc(customerId);
    batch.delete(customerRef);
    result.deleted.customers = 1;

    // Commit the batch
    await batch.commit();

    result.success = true;
    return result;
  } catch (error) {
    console.error('Cascade delete failed:', error);
    return {
      ...result,
      error: error instanceof Error ? error.message : 'Unknown error during cascade delete',
    };
  }
}

/**
 * Delete a tax return and related documents
 */
export async function deleteReturnCascade(returnId: string): Promise<{
  success: boolean;
  deleted: { returns: number; documents: number };
  error?: string;
}> {
  const db = getDb();
  const batch = db.batch();

  const result = {
    success: false,
    deleted: { returns: 0, documents: 0 },
  };

  try {
    // Get the return
    const taxReturn = await returnsService.getById(returnId);
    if (!taxReturn) {
      return { ...result, error: `Tax return not found: ${returnId}` };
    }

    // Get documents for this return (same customer + tax year)
    const documents = await documentsService.list({
      customerId: taxReturn.customerId!,
      taxYear: taxReturn.taxYear!,
    });

    // Delete documents
    for (const doc of documents.data) {
      if (doc.id) {
        const ref = db.collection('documents').doc(doc.id);
        batch.delete(ref);
        result.deleted.documents++;
      }
    }

    // Delete the return
    const returnRef = db.collection('returns').doc(returnId);
    batch.delete(returnRef);
    result.deleted.returns = 1;

    await batch.commit();

    result.success = true;
    return result;
  } catch (error) {
    console.error('Return cascade delete failed:', error);
    return {
      ...result,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check what would be deleted (dry run)
 */
export async function previewCustomerDelete(customerId: string): Promise<{
  customer: any;
  returns: number;
  documents: number;
  appointments: number;
  communications: number;
} | null> {
  const customer = await customersService.getById(customerId);
  if (!customer) {
    return null;
  }

  const [returns, documents, appointments, communications] = await Promise.all([
    returnsService.list({ customerId }),
    documentsService.list({ customerId }),
    appointmentsService.list({ customerId }),
    communicationsService.list({ customerId }),
  ]);

  return {
    customer,
    returns: returns.meta.total,
    documents: documents.meta.total,
    appointments: appointments.meta.total,
    communications: communications.meta.total,
  };
}
