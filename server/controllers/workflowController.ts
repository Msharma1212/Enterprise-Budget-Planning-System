import { Response } from "express";
import { WorkflowModel, SQLWorkflowRow } from "../models/workflowModel.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { BudgetStatus } from "../../src/types.js";

export class WorkflowController {
  /**
   * Get all active corporate workflow audit records
   */
  public static getWorkflowLogs(req: AuthenticatedRequest, res: Response): void {
    try {
      const rows = WorkflowModel.getWorkflowLogs();
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get workflow approval/rejection timeline for a specific budget plan
   */
  public static getBudgetWorkflowHistory(req: AuthenticatedRequest, res: Response): void {
    try {
      const { budgetId } = req.params;
      const rows = WorkflowModel.getWorkflowLogsForBudget(budgetId);
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Transition budget planning status (Approve, Reject, Submit for Review)
   */
  public static transitionBudgetStatus(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "EPM Authentication token verification failed." });
        return;
      }

      const { budgetId, status, comment } = req.body;
      if (!budgetId || !status) {
        res.status(400).json({ error: "Both budgetId and status are required for EPM transition." });
        return;
      }

      const operator = req.user;
      
      const createdRow = WorkflowModel.createWorkflowLog(
        budgetId,
        status as BudgetStatus,
        operator.id,
        operator.name,
        operator.role,
        comment
      );

      res.json({
        success: true,
        message: `Corporate Budget plan status successfully updated to [${status}].`,
        row: createdRow
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
