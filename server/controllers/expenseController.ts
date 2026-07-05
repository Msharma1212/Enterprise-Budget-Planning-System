import { Response } from "express";
import { ExpenseModel, SQLExpenseRow } from "../models/expenseModel.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { Expense } from "../../src/types.js";

export class ExpenseController {
  /**
   * GET /api/v1/expenses
   */
  public static getExpenses(req: AuthenticatedRequest, res: Response): void {
    try {
      const list = ExpenseModel.getExpenses();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/expenses/:id
   */
  public static getExpenseById(req: AuthenticatedRequest, res: Response): void {
    try {
      const { id } = req.params;
      const found = ExpenseModel.getExpenseById(id);
      if (!found) {
        res.status(404).json({ error: `Expenditure transaction ID [${id}] not registered in EPM General Ledger.` });
        return;
      }
      res.json(found);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/expenses
   */
  public static createExpense(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "EPM Session invalid or expired." });
        return;
      }

      const { departmentId, amount, category, date, description, budgetId, vendorName, invoiceNumber, invoiceUrl } = req.body;
      
      // Validations
      if (!departmentId || !amount || !category || !date) {
        res.status(400).json({ error: "Paying Division, Amount, Category, and Date are all required ledger attributes." });
        return;
      }

      if (Number(amount) <= 0) {
        res.status(400).json({ error: "Corporate Accounting Violation: Expense amount cannot be zero or negative." });
        return;
      }

      const operator = req.user;
      const expensePayload: Partial<Expense> = {
        departmentId,
        amount: Number(amount),
        category,
        date,
        description: description || `${category} allocation spending`,
        budgetId,
        vendorName,
        invoiceNumber,
        invoiceUrl
      };

      const result = ExpenseModel.createExpense(
        expensePayload,
        operator.id,
        operator.name,
        operator.role
      );

      res.status(201).json({
        success: true,
        message: "Expenditure transaction successfully registered in corporate ledger.",
        row: result.row,
        warning: result.warning
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/v1/expenses/:id
   */
  public static updateExpense(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "EPM Session invalid or expired." });
        return;
      }

      const { id } = req.params;
      const { departmentId, amount, category, date, description, budgetId, vendorName, invoiceNumber, invoiceUrl } = req.body;

      if (amount !== undefined && Number(amount) <= 0) {
        res.status(400).json({ error: "Corporate Accounting Violation: Expense amount cannot be zero or negative." });
        return;
      }

      const operator = req.user;
      const updatePayload: Partial<Expense> = {};
      if (departmentId !== undefined) updatePayload.departmentId = departmentId;
      if (amount !== undefined) updatePayload.amount = Number(amount);
      if (category !== undefined) updatePayload.category = category;
      if (date !== undefined) updatePayload.date = date;
      if (description !== undefined) updatePayload.description = description;
      if (budgetId !== undefined) updatePayload.budgetId = budgetId;
      if (vendorName !== undefined) updatePayload.vendorName = vendorName;
      if (invoiceNumber !== undefined) updatePayload.invoiceNumber = invoiceNumber;
      if (invoiceUrl !== undefined) updatePayload.invoiceUrl = invoiceUrl;

      const result = ExpenseModel.updateExpense(
        id,
        updatePayload,
        operator.id,
        operator.name,
        operator.role
      );

      res.json({
        success: true,
        message: `Expenditure transaction ID [${id}] successfully updated in General Ledger.`,
        row: result.row,
        warning: result.warning
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/v1/expenses/:id
   */
  public static deleteExpense(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "EPM Session invalid or expired." });
        return;
      }

      const { id } = req.params;
      const operator = req.user;

      const removed = ExpenseModel.deleteExpense(
        id,
        operator.id,
        operator.name,
        operator.role
      );

      res.json({
        success: true,
        message: `Expenditure transaction ID [${id}] successfully retracted from General Ledger.`,
        row: removed
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/expenses/upload-invoice
   * Simple base64/file upload simulation return handler
   */
  public static uploadInvoice(req: AuthenticatedRequest, res: Response): void {
    try {
      // Simulate file upload delay
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      res.json({
        success: true,
        invoiceUrl: `/uploads/INV-${randomId}.pdf`,
        fileName: `INV-${randomId}.pdf`
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to upload digital copy of the invoice." });
    }
  }
}
