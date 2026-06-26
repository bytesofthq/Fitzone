import express from 'express';
import { registerAdmin, loginAdmin, logoutAdmin } from '../Controllers/adminController.js';

const router = express.Router();

// Public routes for admin accounts
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);

export default router;
