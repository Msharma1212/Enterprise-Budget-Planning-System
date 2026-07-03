import { Budget, BudgetStatus, UserRole } from "../../src/types.js";
import { dbService } from "../../src/dbService.js";

export interface SQLBudgetRow {
  budget_id: string;
  department_id: string;
  financial_year: number;
  january_budget: number;
  february_budget: number;
  march_budget: number;
  april_budget: number;
  may_budget: number;
  june_budget: number;
  july_budget: number;
  august_budget: number;
  september_budget: number;
  october_budget: number;
  november_budget: number;
  december_budget: number;
  total_budget: number;
  status: "Pending" | "Approved" | "Rejected" | "Draft";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export class BudgetModel {
  /**
   * Helper: Map internal `Budget` object to corporate SQL representation
   */
  public static mapToSQLRow(budget: Budget): SQLBudgetRow {
    const monthly = budget.monthlyBreakdown || {};
    return {
      budget_id: budget.id,
      department_id: budget.departmentId,
      financial_year: budget.fiscalYear,
      january_budget: monthly["Jan"] || 0,
      february_budget: monthly["Feb"] || 0,
      march_budget: monthly["Mar"] || 0,
      april_budget: monthly["Apr"] || 0,
      may_budget: monthly["May"] || 0,
      june_budget: monthly["Jun"] || 0,
      july_budget: monthly["Jul"] || 0,
      august_budget: monthly["Aug"] || 0,
      september_budget: monthly["Sep"] || 0,
      october_budget: monthly["Oct"] || 0,
      november_budget: monthly["Nov"] || 0,
      december_budget: monthly["Dec"] || 0,
      total_budget: budget.totalAmount,
      status: this.mapToSQLStatus(budget.status),
      created_by: budget.submittedBy || "System",
      created_at: budget.submittedAt || new Date().toISOString(),
      updated_at: budget.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Helper: Map SQL row back to standard corporate JSON model
   */
  public static mapFromSQLRow(row: SQLBudgetRow): Budget {
    return {
      id: row.budget_id,
      departmentId: row.department_id,
      fiscalYear: row.financial_year,
      totalAmount: row.total_budget,
      status: this.mapFromSQLStatus(row.status),
      monthlyBreakdown: {
        "Jan": row.january_budget,
        "Feb": row.february_budget,
        "Mar": row.march_budget,
        "Apr": row.april_budget,
        "May": row.may_budget,
        "Jun": row.june_budget,
        "Jul": row.july_budget,
        "Aug": row.august_budget,
        "Sep": row.september_budget,
        "Oct": row.october_budget,
        "Nov": row.november_budget,
        "Dec": row.december_budget
      },
      categoryBreakdown: {
        "Operations": Math.round(row.total_budget * 0.4),
        "Salary": Math.round(row.total_budget * 0.5),
        "Discretionary": Math.round(row.total_budget * 0.1)
      },
      submittedBy: row.created_by,
      submittedAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static mapToSQLStatus(status: BudgetStatus): "Pending" | "Approved" | "Rejected" | "Draft" {
    if (status === BudgetStatus.SUBMITTED || status === BudgetStatus.UNDER_REVIEW) return "Pending";
    if (status === BudgetStatus.APPROVED) return "Approved";
    if (status === BudgetStatus.REJECTED) return "Rejected";
    return "Draft";
  }

  private static mapFromSQLStatus(status: "Pending" | "Approved" | "Rejected" | "Draft"): BudgetStatus {
    if (status === "Pending") return BudgetStatus.UNDER_REVIEW;
    if (status === "Approved") return BudgetStatus.APPROVED;
    if (status === "Rejected") return BudgetStatus.REJECTED;
    return BudgetStatus.DRAFT;
  }

  /**
   * Fetch all budgets, formatted as relational rows
   */
  public static getAllBudgets(): SQLBudgetRow[] {
    const budgets = dbService.getBudgets();
    return budgets.map(b => this.mapToSQLRow(b));
  }

  /**
   * Retrieve budget by its primary ID
   */
  public static getBudgetById(id: string): SQLBudgetRow | null {
    const budgets = dbService.getBudgets();
    const b = budgets.find(x => x.id === id);
    return b ? this.mapToSQLRow(b) : null;
  }

  /**
   * Strictly validates corporate budget schema input
   */
  public static validate(data: Partial<SQLBudgetRow>, excludeId?: string): { error?: string } {
    if (!data.department_id) {
      return { error: "Corporate unit department selection is required." };
    }

    if (!data.financial_year || data.financial_year < 2020 || data.financial_year > 2035) {
      return { error: "Financial year is required and must be between 2020 and 2035." };
    }

    // Monthly values can't be negative
    const months = [
      "january_budget", "february_budget", "march_budget", "april_budget",
      "may_budget", "june_budget", "july_budget", "august_budget",
      "september_budget", "october_budget", "november_budget", "december_budget"
    ];

    for (const m of months) {
      const val = (data as any)[m];
      if (val !== undefined && val < 0) {
        return { error: `Budget value for ${m.replace("_budget", "")} cannot be negative.` };
      }
    }

    // Check duplicate budgets
    const budgets = dbService.getBudgets();
    const duplicate = budgets.find(
      b => b.departmentId === data.department_id && b.fiscalYear === data.financial_year && b.id !== excludeId
    );
    if (duplicate) {
      return { error: `A budget allocation already exists for this department in Financial Year ${data.financial_year}.` };
    }

    return {};
  }

  /**
   * Insert / Save a new budget planning spreadsheet row
   */
  public static createBudget(
    data: Omit<SQLBudgetRow, "budget_id" | "created_at" | "updated_at">,
    creatorId: string,
    creatorName: string,
    creatorRole: string
  ): SQLBudgetRow {
    // Validate
    const validation = this.validate(data);
    if (validation.error) {
      throw new Error(validation.error);
    }

    const total = 
      (data.january_budget || 0) + (data.february_budget || 0) + (data.march_budget || 0) +
      (data.april_budget || 0) + (data.may_budget || 0) + (data.june_budget || 0) +
      (data.july_budget || 0) + (data.august_budget || 0) + (data.september_budget || 0) +
      (data.october_budget || 0) + (data.november_budget || 0) + (data.december_budget || 0);

    const budgetId = "b_" + Math.random().toString(36).substr(2, 9);
    
    const internalBudget: Budget = {
      id: budgetId,
      departmentId: data.department_id,
      fiscalYear: data.financial_year,
      totalAmount: total,
      status: this.mapFromSQLStatus(data.status),
      monthlyBreakdown: {
        "Jan": data.january_budget || 0,
        "Feb": data.february_budget || 0,
        "Mar": data.march_budget || 0,
        "Apr": data.april_budget || 0,
        "May": data.may_budget || 0,
        "Jun": data.june_budget || 0,
        "Jul": data.july_budget || 0,
        "Aug": data.august_budget || 0,
        "Sep": data.september_budget || 0,
        "Oct": data.october_budget || 0,
        "Nov": data.november_budget || 0,
        "Dec": data.december_budget || 0
      },
      categoryBreakdown: {
        "Salary": Math.round(total * 0.5),
        "Operations": Math.round(total * 0.4),
        "Discretionary": Math.round(total * 0.1)
      },
      submittedBy: creatorId,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbService.getBudgets().push(internalBudget);
    (dbService as any).save();

    // Log compliance audit
    dbService.addAudit(
      creatorId,
      creatorName,
      creatorRole,
      "BUDGET_CREATE",
      `Provisioned SQL planning budget ${budgetId} for unit ${data.department_id}, FY${data.financial_year}. Total: $${total.toLocaleString()}`
    );

    return this.mapToSQLRow(internalBudget);
  }

  /**
   * Update an existing budget planning spreadsheet row
   */
  public static updateBudget(
    id: string,
    data: Partial<SQLBudgetRow>,
    updaterId: string,
    updaterName: string,
    updaterRole: string
  ): SQLBudgetRow {
    const budgets = dbService.getBudgets();
    const idx = budgets.findIndex(b => b.id === id);
    if (idx === -1) {
      throw new Error("Target budget planning record not found.");
    }

    const previous = budgets[idx];
    const mappedPrev = this.mapToSQLRow(previous);
    const merged = { ...mappedPrev, ...data };

    const validation = this.validate(merged, id);
    if (validation.error) {
      throw new Error(validation.error);
    }

    const total = 
      (merged.january_budget || 0) + (merged.february_budget || 0) + (merged.march_budget || 0) +
      (merged.april_budget || 0) + (merged.may_budget || 0) + (merged.june_budget || 0) +
      (merged.july_budget || 0) + (merged.august_budget || 0) + (merged.september_budget || 0) +
      (merged.october_budget || 0) + (merged.november_budget || 0) + (merged.december_budget || 0);

    const updatedInternal: Budget = {
      ...previous,
      departmentId: merged.department_id,
      fiscalYear: merged.financial_year,
      totalAmount: total,
      status: this.mapFromSQLStatus(merged.status as any),
      monthlyBreakdown: {
        "Jan": merged.january_budget || 0,
        "Feb": merged.february_budget || 0,
        "Mar": merged.march_budget || 0,
        "Apr": merged.april_budget || 0,
        "May": merged.may_budget || 0,
        "Jun": merged.june_budget || 0,
        "Jul": merged.july_budget || 0,
        "Aug": merged.august_budget || 0,
        "Sep": merged.september_budget || 0,
        "Oct": merged.october_budget || 0,
        "Nov": merged.november_budget || 0,
        "Dec": merged.december_budget || 0
      },
      categoryBreakdown: {
        "Salary": Math.round(total * 0.5),
        "Operations": Math.round(total * 0.4),
        "Discretionary": Math.round(total * 0.1)
      },
      updatedAt: new Date().toISOString()
    };

    budgets[idx] = updatedInternal;
    (dbService as any).save();

    // Log audit trail
    dbService.addAudit(
      updaterId,
      updaterName,
      updaterRole,
      "BUDGET_UPDATE",
      `Updated SQL planning budget ${id} for department ${merged.department_id}. Changed total: $${total.toLocaleString()}`
    );

    return this.mapToSQLRow(updatedInternal);
  }

  /**
   * Delete / Decommission a budget sheet
   */
  public static deleteBudget(
    id: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string
  ): void {
    const budgets = dbService.getBudgets();
    const idx = budgets.findIndex(b => b.id === id);
    if (idx === -1) {
      throw new Error("Target budget planning record not found.");
    }

    const previous = budgets[idx];

    // Lock deletion if budget is approved (can only delete Draft or Rejected budgets to enforce compliance)
    if (previous.status === BudgetStatus.APPROVED && operatorRole !== UserRole.ADMIN) {
      throw new Error("Security Policy Violation: Approved budgets are locked. Only Admins can delete approved plans.");
    }

    budgets.splice(idx, 1);
    (dbService as any).save();

    dbService.addAudit(
      operatorId,
      operatorName,
      operatorRole,
      "BUDGET_DELETE",
      `Permanently deleted budget ${id} for department ${previous.departmentId}, FY${previous.fiscalYear}`
    );
  }
}
