import { BudgetStatus, WorkflowLog, UserRole } from "../../src/types.js";
import { dbService } from "../../src/dbService.js";

export interface SQLWorkflowRow {
  workflow_id: string;
  budget_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  changed_at: string;
  comment: string | null;
}

export class WorkflowModel {
  /**
   * Helper: Map internal `WorkflowLog` to SQL structure
   */
  public static mapToSQLRow(log: WorkflowLog): SQLWorkflowRow {
    return {
      workflow_id: log.id,
      budget_id: log.budgetId,
      from_status: log.fromStatus,
      to_status: log.toStatus,
      changed_by: log.changedBy,
      changed_at: log.changedAt,
      comment: log.comment || null
    };
  }

  /**
   * Helper: Map SQL structure to WorkflowLog
   */
  public static mapFromSQLRow(row: SQLWorkflowRow): WorkflowLog {
    return {
      id: row.workflow_id,
      budgetId: row.budget_id,
      fromStatus: row.from_status as BudgetStatus,
      toStatus: row.to_status as BudgetStatus,
      changedBy: row.changed_by,
      changedAt: row.changed_at,
      comment: row.comment || undefined
    };
  }

  /**
   * Fetch all workflow history rows
   */
  public static getWorkflowLogs(): SQLWorkflowRow[] {
    const logs = dbService.getWorkflowLogs();
    return logs.map(l => this.mapToSQLRow(l));
  }

  /**
   * Fetch workflow logs for a specific budget planning record
   */
  public static getWorkflowLogsForBudget(budgetId: string): SQLWorkflowRow[] {
    const logs = dbService.getWorkflowLogs().filter(l => l.budgetId === budgetId);
    return logs.map(l => this.mapToSQLRow(l));
  }

  /**
   * Execute state transition on target budget record
   */
  public static createWorkflowLog(
    budgetId: string,
    toStatus: BudgetStatus,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
    comment?: string
  ): SQLWorkflowRow {
    const budget = dbService.getBudgets().find(b => b.id === budgetId);
    if (!budget) {
      throw new Error("Target budget planning record not found.");
    }

    const fromStatus = budget.status;

    // Corporate compliance flow validations
    if (operatorRole === UserRole.EMPLOYEE) {
      if (toStatus !== BudgetStatus.DRAFT && toStatus !== BudgetStatus.SUBMITTED) {
        throw new Error(`Corporate Security Policy Violation: Employees cannot transition budget status to ${toStatus}.`);
      }
    }

    if (operatorRole === UserRole.DEPARTMENT_MANAGER) {
      if (toStatus === BudgetStatus.APPROVED) {
        // Must be authorized or under review
        if (fromStatus === BudgetStatus.DRAFT) {
          throw new Error("Corporate Flow Restriction: Draft budgets must be Submitted before they can be reviewed.");
        }
      }
    }

    // Execute state transition in general ledger
    dbService.updateBudgetWorkflow(
      budgetId,
      toStatus,
      operatorId,
      operatorName,
      operatorRole,
      comment
    );

    // Retrieve the newly created workflow log
    const lastLog = dbService.getWorkflowLogs()
      .filter(l => l.budgetId === budgetId)
      .slice(-1)[0];

    if (!lastLog) {
      const fallbackLog: WorkflowLog = {
        id: "wf_" + Math.random().toString(36).substr(2, 9),
        budgetId,
        fromStatus,
        toStatus,
        changedBy: operatorName,
        changedAt: new Date().toISOString(),
        comment
      };
      dbService.getWorkflowLogs().push(fallbackLog);
      (dbService as any).save();
      return this.mapToSQLRow(fallbackLog);
    }

    return this.mapToSQLRow(lastLog);
  }
}
