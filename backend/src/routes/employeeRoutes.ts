import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateManager,
  getReportees,
  getOrgTree,
  getDashboardStats,
  importCSV,
} from '../controllers/employeeController';
import { protect, checkRole } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Dashboard stats - must be placed BEFORE dynamic :id routes
router.get('/dashboard/stats', protect, checkRole(['Super Admin', 'HR Manager']), getDashboardStats);

// Org hierarchy tree
router.get('/organization/tree', protect, getOrgTree);

// Base directory requests
router.get('/', protect, getEmployees);
router.post('/', protect, checkRole(['Super Admin', 'HR Manager']), createEmployee);

// CSV Upload endpoint
router.post('/csv-import', protect, checkRole(['Super Admin', 'HR Manager']), upload.single('file'), importCSV);

// Member-specific requests
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, updateEmployee);
router.delete('/:id', protect, checkRole(['Super Admin']), deleteEmployee);
router.get('/:id/reportees', protect, getReportees);
router.patch('/:id/manager', protect, checkRole(['Super Admin', 'HR Manager']), updateManager);

export default router;
