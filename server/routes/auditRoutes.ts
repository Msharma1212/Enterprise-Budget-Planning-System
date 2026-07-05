import { Router } from "express";
import { AuditController } from "../controllers/auditController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @route   GET /api/v1/audits
 * @desc    Get paginated, searchable, filterable enterprise audit logs
 * @access  Private (Admin Only)
 */
router.get("/", authenticateToken as any, AuditController.getLogs as any);

/**
 * @route   GET /api/v1/audits/stats
 * @desc    Get analytics and summary statistics for audit trails
 * @access  Private (Admin Only)
 */
router.get("/stats", authenticateToken as any, AuditController.getStats as any);

/**
 * @route   POST /api/v1/audits/purge
 * @desc    Initialize/purge current audit trail database (requires admin)
 * @access  Private (Admin Only)
 */
router.post("/purge", authenticateToken as any, AuditController.purgeLogs as any);

export const auditRouter = router;
