import { Router } from "express";
import { DepartmentController } from "../controllers/departmentController.js";
import { authenticateToken, authorizeRoles } from "../middleware/authMiddleware.js";
import { UserRole } from "../../src/types.js";

const router = Router();

/**
 * @route   GET /api/v1/departments
 * @desc    Lists all active corporate departments with integrated budgeting and employee metrics
 * @access  Private (Any authenticated employee can view the directory)
 */
router.get("/", authenticateToken as any, DepartmentController.getDepartments as any);

/**
 * @route   GET /api/v1/departments/:id
 * @desc    Fetch specific department information
 * @access  Private
 */
router.get("/:id", authenticateToken as any, DepartmentController.getDepartment as any);

/**
 * @route   POST /api/v1/departments
 * @desc    Create a new department unit (restricted to Admin and Finance Managers)
 * @access  Private (Admin, Finance Manager roles only)
 */
router.post(
  "/",
  authenticateToken as any,
  authorizeRoles([UserRole.ADMIN, UserRole.FINANCE_MANAGER]) as any,
  DepartmentController.createDepartment as any
);

/**
 * @route   PUT /api/v1/departments/:id
 * @desc    Update department info, change name, code, or update manager mapping
 * @access  Private (Admin, Finance Manager roles only)
 */
router.put(
  "/:id",
  authenticateToken as any,
  authorizeRoles([UserRole.ADMIN, UserRole.FINANCE_MANAGER]) as any,
  DepartmentController.updateDepartment as any
);

/**
 * @route   DELETE /api/v1/departments/:id
 * @desc    Decommission a department from active status. Validates referential constraints first.
 * @access  Private (Admin role only)
 */
router.delete(
  "/:id",
  authenticateToken as any,
  authorizeRoles([UserRole.ADMIN]) as any,
  DepartmentController.deleteDepartment as any
);

export const departmentRouter = router;
