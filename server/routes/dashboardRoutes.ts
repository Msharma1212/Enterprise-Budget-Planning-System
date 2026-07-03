import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @route   GET /api/v1/dashboard/metrics
 * @desc    Fetch aggregated cards, chart vectors, and relational SQL blueprints for dashboard visualization
 * @access  Private
 */
router.get("/metrics", authenticateToken as any, DashboardController.getMetrics as any);

export const dashboardRouter = router;
