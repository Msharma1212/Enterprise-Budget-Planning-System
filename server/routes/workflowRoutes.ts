import { Router } from "express";
import { WorkflowController } from "../controllers/workflowController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @route   GET /api/v1/workflows
 * @desc    Get all corporate workflow audit/history log records
 * @access  Private
 */
router.get("/", authenticateToken as any, WorkflowController.getWorkflowLogs as any);

/**
 * @route   GET /api/v1/workflows/budget/:budgetId
 * @desc    Get approval/status timeline for a specific budget allocation spreadsheet
 * @access  Private
 */
router.get("/budget/:budgetId", authenticateToken as any, WorkflowController.getBudgetWorkflowHistory as any);

/**
 * @route   POST /api/v1/workflows/transition
 * @desc    Submit, Approve, Reject or Change status of a budget plan
 * @access  Private
 */
router.post("/transition", authenticateToken as any, WorkflowController.transitionBudgetStatus as any);

export const workflowRouter = router;
