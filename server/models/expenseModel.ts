import { Expense } from "../../src/types.js";
import { dbService } from "../../src/dbService.js";

export interface SQLExpenseRow {
  expense_id: string;
  department_id: string;
  budget_id: string | null;
  amount: number;
  category: string;
  expense_date: string;
  vendor_name: string | null;
  invoice_number: string | null;
  description: string | null;
  invoice_url: string | null;
  created_by: string;
}

export class ExpenseModel {
  /**
   * Helper: Map from internal type to relational SQL row representation
   */
  public static mapToSQLRow(e: Expense): SQLExpenseRow {
    return {
      expense_id: e.id,
      department_id: e.departmentId,
      budget_id: e.budgetId || null,
      amount: e.amount,
      category: e.category,
      expense_date: e.date,
      vendor_name: e.vendorName || null,
      invoice_number: e.invoiceNumber || null,
      description: e.description || null,
      invoice_url: e.invoiceUrl || null,
      created_by: e.recordedBy
    };
  }

  /**
   * Helper: Map from relational SQL row to internal model
   */
  public static mapFromSQLRow(row: SQLExpenseRow): Expense {
    return {
      id: row.expense_id,
      departmentId: row.department_id,
      budgetId: row.budget_id || undefined,
      amount: Number(row.amount),
      category: row.category,
      date: row.expense_date,
      vendorName: row.vendor_name || undefined,
      invoiceNumber: row.invoice_number || undefined,
      description: row.description || "",
      invoiceUrl: row.invoice_url || undefined,
      recordedBy: row.created_by
    };
  }

  /**
   * Fetch all expense transaction rows
   */
  public static getExpenses(): SQLExpenseRow[] {
    const list = dbService.getExpenses();
    return list.map(e => this.mapToSQLRow(e));
  }

  /**
   * Find unique transaction row by ID
   */
  public static getExpenseById(id: string): SQLExpenseRow | null {
    const found = dbService.getExpenses().find(e => e.id === id);
    if (!found) return null;
    return this.mapToSQLRow(found);
  }

  /**
   * Insert new expenditure record
   */
  public static createExpense(
    expenseData: Partial<Expense>,
    userId: string,
    username: string,
    userRole: string
  ): { row: SQLExpenseRow; warning?: string } {
    if (!expenseData.amount || expenseData.amount <= 0) {
      throw new Error("Validation Failed: Expense amount must be a positive non-zero value.");
    }
    
    const result = dbService.addExpense(expenseData, userId, username, userRole);
    return {
      row: this.mapToSQLRow(result.expense),
      warning: result.warning
    };
  }

  /**
   * Update existing transaction record in the ledger
   */
  public static updateExpense(
    expenseId: string,
    expenseData: Partial<Expense>,
    userId: string,
    username: string,
    userRole: string
  ): { row: SQLExpenseRow; warning?: string } {
    if (expenseData.amount !== undefined && expenseData.amount <= 0) {
      throw new Error("Validation Failed: Updated expense amount must be a positive non-zero value.");
    }

    const result = dbService.editExpense(expenseId, expenseData, userId, username, userRole);
    return {
      row: this.mapToSQLRow(result.expense),
      warning: result.warning
    };
  }

  /**
   * Wipe transaction from active database ledger
   */
  public static deleteExpense(
    expenseId: string,
    userId: string,
    username: string,
    userRole: string
  ): SQLExpenseRow {
    const removed = dbService.deleteExpense(expenseId, userId, username, userRole);
    return this.mapToSQLRow(removed);
  }
}
