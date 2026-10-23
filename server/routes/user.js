import express from 'express';
import {
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    getProfile,
    updateProfile
} from '../controllers/UserController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Profile routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// User administration routes
router.get('/', authMiddleware, getUsers);
router.post('/', authMiddleware, addUser);
router.post('/add', authMiddleware, addUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

export default router;
