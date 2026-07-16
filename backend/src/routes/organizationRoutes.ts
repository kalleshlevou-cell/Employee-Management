import { Router } from 'express';
import { getOrgTree } from '../controllers/employeeController';
import { protect } from '../middleware/auth';

const router = Router();

// GET /api/organization/tree
router.get('/tree', protect, getOrgTree);

export default router;
