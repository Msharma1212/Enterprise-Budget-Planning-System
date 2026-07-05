import { Response } from "express";
import { BudgetModel, SQLBudgetRow } from "../models/budgetModel.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export class BudgetController {
  /**
   * Get all budget planning spreadsheets
   */
  public static getBudgets(req: AuthenticatedRequest, res: Response): void {
    try {
      const rows = BudgetModel.getAllBudgets();
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Retrieve single budget plan
   */
  public static getBudget(req: AuthenticatedRequest, res: Response): void {
    try {
      const { id } = req.params;
      const row = BudgetModel.getBudgetById(id);
      if (!row) {
        res.status(404).json({ error: "EPM Budget plan not found." });
        return;
      }
      res.json(row);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new budget plan row
   */
  public static createBudget(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "EPM Authentication token verification failed." });
        return;
      }

      const rowData: Omit<SQLBudgetRow, "budget_id" | "created_at" | "updated_at"> = req.body;
      const operator = req.user;

      const createdRow = BudgetModel.createBudget(
        {
          department_id: rowData.department_id,
          financial_year: Number(rowData.financial_year),
          january_budget: Number(rowData.january_budget || 0),
          february_budget: Number(rowData.february_budget || 0),
          march_budget: Number(rowData.march_budget || 0),
          april_budget: Number(rowData.april_budget || 0),
          may_budget: Number(rowData.may_budget || 0),
          june_budget: Number(rowData.june_budget || 0),
          july_budget: Number(rowData.july_budget || 0),
          august_budget: Number(rowData.august_budget || 0),
          september_budget: Number(rowData.september_budget || 0),
          october_budget: Number(rowData.october_budget || 0),
          november_budget: Number(rowData.november_budget || 0),
          december_budget: Number(rowData.december_budget || 0),
          total_budget: 0, // Computed automatically in model
          status: rowData.status || "Pending",
          created_by: operator.id
        },
        operator.id,
        operator.name,
        operator.role
      );

      res.status(201).json({
        success: true,
        message: "EPM Corporate Budget Plan provisioned successfully.",
        row: createdRow
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update an existing budget plan
   */
  public static updateBudget(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "EPM Authentication token verification failed." });
        return;
      }

      const { id } = req.params;
      const rowData: Partial<SQLBudgetRow> = req.body;
      const operator = req.user;

      const updatedRow = BudgetModel.updateBudget(
        id,
        {
          department_id: rowData.department_id,
          financial_year: rowData.financial_year ? Number(rowData.financial_year) : undefined,
          january_budget: rowData.january_budget !== undefined ? Number(rowData.january_budget) : undefined,
          february_budget: rowData.february_budget !== undefined ? Number(rowData.february_budget) : undefined,
          march_budget: rowData.march_budget !== undefined ? Number(rowData.march_budget) : undefined,
          april_budget: rowData.april_budget !== undefined ? Number(rowData.april_budget) : undefined,
          may_budget: rowData.may_budget !== undefined ? Number(rowData.may_budget) : undefined,
          june_budget: rowData.june_budget !== undefined ? Number(rowData.june_budget) : undefined,
          july_budget: rowData.july_budget !== undefined ? Number(rowData.july_budget) : undefined,
          august_budget: rowData.august_budget !== undefined ? Number(rowData.august_budget) : undefined,
          september_budget: rowData.september_budget !== undefined ? Number(rowData.september_budget) : undefined,
          october_budget: rowData.october_budget !== undefined ? Number(rowData.october_budget) : undefined,
          november_budget: rowData.november_budget !== undefined ? Number(rowData.november_budget) : undefined,
          december_budget: rowData.december_budget !== undefined ? Number(rowData.december_budget) : undefined,
          status: rowData.status
        },
        operator.id,
        operator.name,
        operator.role
      );

      res.json({
        success: true,
        message: "EPM Budget Plan modified successfully.",
        row: updatedRow
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete/retract a budget plan
   */
  public static deleteBudget(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "EPM Authentication token verification failed." });
        return;
      }

      const { id } = req.params;
      const operator = req.user;

      BudgetModel.deleteBudget(id, operator.id, operator.name, operator.role);

      res.json({
        success: true,
        message: "EPM Budget Plan removed successfully from general corporate ledger."
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
