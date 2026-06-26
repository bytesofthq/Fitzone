import express from 'express';
import { 
  getMembers, 
  getMemberById, 
  createMember, 
  updateMember, 
  deleteMember, 
  checkExpiry 
} from '../Controllers/memberController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection middleware to all member routes
router.use(protect);

// Precedence route: Must declare specific endpoints first
router.get('/check-expiry', checkExpiry);

// General CRUD endpoints
router.get('/', getMembers);
router.get('/:id', getMemberById);
router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
