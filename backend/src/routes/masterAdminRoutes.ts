import { Router } from 'express';
import {
  getMasterDashboard,
  getBranches,
  addBranch,
  updateBranch,
  deleteBranch,
  testBranchConnection,
  broadcastPricingToAllBranches,
} from '../controllers/masterAdminController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protect all master admin routes
router.use(authMiddleware);

// Consolidated Dashboard
router.get('/dashboard', getMasterDashboard);

// Branch Registry CRUD
router.get('/branches', getBranches);
router.post('/branches', addBranch);
router.put('/branches/:id', updateBranch);
router.delete('/branches/:id', deleteBranch);

// Live Connection Tester
router.post('/branches/test', testBranchConnection);

// Central Pricing & Promotional Discount Broadcast
router.post('/broadcast-pricing', broadcastPricingToAllBranches);

export default router;
