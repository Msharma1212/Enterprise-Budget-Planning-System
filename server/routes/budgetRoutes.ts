import { Router } from "express";
import { BudgetController } from "../controllers/budgetController.js";
import { authenticateToken, authorizeRoles } from "../middleware/authMiddleware.js";
import { UserRole } from "../../src/types.js";

const router = Router();

/**
 * @route   GET /api/v1/budgets
 * @desc    Get all active corporate budget sheets
 * @access  Private (Any authenticated member)
 */
router.get("/", authenticateToken as any, BudgetController.getBudgets as any);

/**
 * @route   GET /api/v1/budgets/:id
 * @desc    Fetch a specific budget planning record
 * @access  Private
 */
router.get("/:id", authenticateToken as any, BudgetController.getBudget as any);

/**
 * @route   POST /api/v1/budgets
 * @desc    Create/provision a new corporate budget plan
 * @access  Private (Admin, Finance Manager, Department Manager roles only)
 */
router.post(
  "/",
  authenticateToken as any,
  authorizeRoles([UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER]) as any,
  BudgetController.createBudget as any
);

/**
 * @route   PUT /api/v1/budgets/:id
 * @desc    Update values or status inside a corporate budget sheet
 * @access  Private (Admin, Finance Manager, Department Manager roles only)
 */
router.put(
  "/:id",
  authenticateToken as any,
  authorizeRoles([UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER]) as any,
  BudgetController.updateBudget as any
);

/**
 * @route   DELETE /api/v1/budgets/:id
 * @desc    Delete/retract a corporate budget plan
 * @access  Private (Admin, Finance Manager, Department Manager roles only)
 */
router.delete(
  "/:id",
  authenticateToken as any,
  authorizeRoles([UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.DEPARTMENT_MANAGER]) as any,
  BudgetController.deleteBudget as any
);

export const budgetRouter = router;
