import { Router } from 'express';
import { FirestoreService } from '../services/firestore.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { requireStaff, requireAdmin, isAdmin } from '../middleware/authorization.js';
import type { components } from '@taxhelper/shared/generated/typescript/schema';

type User = components['schemas']['User'];

const userService = new FirestoreService<User>('users');

export const usersRouter: Router = Router();

// Get current user - Any authenticated user
usersRouter.get('/me', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    // Try to find existing user profile
    let user = await userService.findOne({ id: req.user.uid });

    // If no profile exists, create one using the Firebase UID
    if (!user) {
      const userData = {
        email: req.user.email || '',
        role: (req.user.role as User['role']) || 'front_desk',
        available: true,
      };
      user = await userService.createWithId(req.user.uid, userData);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// List users - Staff only
usersRouter.get('/', requireStaff(), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await userService.list({}, { limit: 100 });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get user by ID - Staff only (for viewing other profiles) or own profile
usersRouter.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    // Users can view their own profile, staff can view any
    const isOwnProfile = req.user.uid === req.params.id;
    const userRole = req.user.role;
    const isStaffUser = userRole && ['admin', 'preparer', 'front_desk'].includes(userRole);

    if (!isOwnProfile && !isStaffUser) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'You can only view your own profile',
      });
    }

    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile - Own profile or admin
usersRouter.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    }

    // Users can only update their own profile unless they're admin
    const isOwnProfile = req.user.uid === req.params.id;
    const userIsAdmin = isAdmin(req);

    if (!isOwnProfile && !userIsAdmin) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot update other users' });
    }

    const { displayName, role, available } = req.body;
    const updateData: Partial<User> = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (available !== undefined) updateData.available = available;

    // Only admins can update roles
    if (role !== undefined) {
      if (!userIsAdmin) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'Only admins can update user roles',
        });
      }
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

// Delete user - Admin only
usersRouter.delete('/:id', requireAdmin(), async (req: AuthenticatedRequest, res, next) => {
  try {
    // Prevent self-deletion
    if (req.user?.uid === req.params.id) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Cannot delete your own account',
      });
    }

    const deleted = await userService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
