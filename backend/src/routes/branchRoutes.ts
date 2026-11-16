import { Router } from 'express';
import { getBranchSummary, syncBranchPricing } from '../controllers/branchController';

const router = Router();

// GET /api/branch/summary - summary stats for this branch
router.get('/summary', getBranchSummary);
router.post('/summary', getBranchSummary);

// POST /api/branch/sync-pricing - receive pricing & discount updates from Master Admin
router.post('/sync-pricing', syncBranchPricing);

export default router;
