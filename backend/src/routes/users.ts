import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

interface User {
  id?: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'preparer' | 'front_desk';
  createdAt?: string;
  updatedAt?: string;
}

const userService = new FirestoreService<User>('users');

export const usersRouter = Router();

// Get current user
usersRouter.get('/me', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    // Try to find existing user profile
    let user = await userService.findOne({ id: req.user.uid });

    // If no profile exists, create one
    if (!user) {
      user = await userService.create({
        id: req.user.uid,
        email: req.user.email || '',
        role: req.user.role as User['role'] || 'front_desk',
      });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// List users (admin only)
usersRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await userService.list({}, { limit: 100 });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
usersRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
usersRouter.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.user?.uid !== req.params.id && req.user?.role !== 'admin') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot update other users' });
    }

    const { displayName, role } = req.body;
    const updateData: Partial<User> = {};

    if (displayName) updateData.displayName = displayName;

    // Only admins can update roles
    if (role && req.user?.role === 'admin') {
      updateData.role = role;
    }

    const user = await userService.update(req.params.id, updateData);
    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});
