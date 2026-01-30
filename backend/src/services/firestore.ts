import { getDb } from './firebase.js';
import { v4 as uuidv4 } from 'uuid';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export class FirestoreService<T extends { id?: string }> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private get collection() {
    return getDb().collection(this.collectionName);
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const id = uuidv4();
    return this.createWithId(id, data);
  }

  async createWithId(id: string, data: Omit<T, 'id'>): Promise<T> {
    const timestamp = new Date().toISOString();
    const docData = {
      ...data,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    } as unknown as T;

    await this.collection.doc(id).set(docData as FirebaseFirestore.DocumentData);
    return docData;
  }

  async getById(id: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.collection.doc(id).update(updateData);
    return { ...existing, ...updateData } as T;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      return false;
    }

    await this.collection.doc(id).delete();
    return true;
  }

  async list(
    filters: Record<string, any> = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20 } = pagination;
    let query: FirebaseFirestore.Query = this.collection;

    // Apply filters
    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query = query.where(field, '==', value);
      }
    }

    // Get total count
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Apply pagination
    query = query.orderBy('createdAt', 'desc').limit(limit).offset((page - 1) * limit);

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) => doc.data() as T);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        hasMore: page * limit < total,
      },
    };
  }

  async findOne(filters: Record<string, any>): Promise<T | null> {
    let query: FirebaseFirestore.Query = this.collection;

    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.where(field, '==', value);
      }
    }

    query = query.limit(1);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as T;
  }
}
