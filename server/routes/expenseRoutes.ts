import { Router } from "express";
import { ExpenseController } from "../controllers/expenseController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @route   GET /api/v1/expenses
 * @desc    Get all general ledger transaction entries
 * @access  Private
 */
router.get("/", authenticateToken as any, ExpenseController.getExpenses as any);

/**
 * @route   GET /api/v1/expenses/:id
 * @desc    Fetch detailed transaction info by ID
 * @access  Private
 */
router.get("/:id", authenticateToken as any, ExpenseController.getExpenseById as any);

/**
 * @route   POST /api/v1/expenses
 * @desc    Register new departmental actual expense entry
 * @access  Private
 */
router.post("/", authenticateToken as any, ExpenseController.createExpense as any);

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Modify transaction details of general ledger entry
 * @access  Private
 */
router.put("/:id", authenticateToken as any, ExpenseController.updateExpense as any);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Retract spending transaction from active ledger
 * @access  Private
 */
router.delete("/:id", authenticateToken as any, ExpenseController.deleteExpense as any);

/**
 * @route   POST /api/v1/expenses/upload-invoice
 * @desc    Upload file PDF/Image invoice for attachment link
 * @access  Private
 */
router.post("/upload-invoice", authenticateToken as any, ExpenseController.uploadInvoice as any);

export const expenseRouter = router;
