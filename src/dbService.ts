import fs from "fs";
import path from "path";
import { User, UserRole, Department, Budget, BudgetStatus, Expense, WorkflowLog, AuditLog, Notification } from "./types.js";

// Ensure the data directory exists
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface DatabaseSchema {
  users: User[];
  departments: Department[];
  budgets: Budget[];
  expenses: Expense[];
  workflowLogs: WorkflowLog[];
  auditLogs: AuditLog[];
  notifications: Notification[];
}

// Initial pre-seeded enterprise database state
const INITIAL_DATABASE: DatabaseSchema = {
  users: [
    {
      id: "u1",
      username: "admin.orcl",
      email: "admin@enterprise.com",
      role: UserRole.ADMIN,
      departmentId: "d1",
      name: "Alexander Vance (Group CFO & Admin)"
    },
    {
      id: "u2",
      username: "finance.orcl",
      email: "finance@enterprise.com",
      role: UserRole.FINANCE_MANAGER,
      departmentId: "d1",
      name: "Marcus Sterling (Lead Finance Director)"
    },
    {
      id: "u3",
      username: "it.orcl",
      email: "it@enterprise.com",
      role: UserRole.DEPARTMENT_MANAGER,
      departmentId: "d2",
      name: "Elena Rostova (IT Division Chief)"
    },
    {
      id: "u4",
      username: "rd.orcl",
      email: "rd@enterprise.com",
      role: UserRole.DEPARTMENT_MANAGER,
      departmentId: "d3",
      name: "Dr. Kenji Tanaka (VP of Research & Dev)"
    },
    {
      id: "u5",
      username: "mktg.orcl",
      email: "mktg@enterprise.com",
      role: UserRole.DEPARTMENT_MANAGER,
      departmentId: "d4",
      name: "Sarah Jenkins (Marketing Director)"
    },
    {
      id: "u6",
      username: "emp.orcl",
      email: "emp@enterprise.com",
      role: UserRole.EMPLOYEE,
      departmentId: "d2",
      name: "David Chen (IT Specialist)"
    }
  ],
  departments: [
    { id: "d1", name: "Corporate Finance", code: "FIN-01", managerId: "u2" },
    { id: "d2", name: "Information Technology", code: "IT-02", managerId: "u3" },
    { id: "d3", name: "Research & Development", code: "RD-03", managerId: "u4" },
    { id: "d4", name: "Marketing & Growth", code: "MKTG-04", managerId: "u5" },
    { id: "d5", name: "Human Resources", code: "HR-05", managerId: "u1" }
  ],
  budgets: [
    {
      id: "b1",
      departmentId: "d2", // IT
      fiscalYear: 2026,
      totalAmount: 1200000,
      status: BudgetStatus.APPROVED,
      monthlyBreakdown: {
        "Jan": 100000, "Feb": 100000, "Mar": 100000, "Apr": 100000,
        "May": 100000, "Jun": 100000, "Jul": 100000, "Aug": 100000,
        "Sep": 100000, "Oct": 100000, "Nov": 100000, "Dec": 100000
      },
      categoryBreakdown: {
        "Salary": 600000,
        "Software Licenses": 350000,
        "Hardware Infrastructure": 150000,
        "Consulting Services": 80000,
        "Travel & Incidentals": 20000
      },
      submittedBy: "u3",
      submittedAt: "2026-01-05T09:15:00Z",
      approvedBy: "u2",
      approvedAt: "2026-01-08T14:30:00Z",
      updatedAt: "2026-01-08T14:30:00Z"
    },
    {
      id: "b2",
      departmentId: "d3", // R&D
      fiscalYear: 2026,
      totalAmount: 2400000,
      status: BudgetStatus.APPROVED,
      monthlyBreakdown: {
        "Jan": 200000, "Feb": 200000, "Mar": 200000, "Apr": 200000,
        "May": 200000, "Jun": 200000, "Jul": 200000, "Aug": 200000,
        "Sep": 200000, "Oct": 200000, "Nov": 200000, "Dec": 200000
      },
      categoryBreakdown: {
        "Salary": 1500000,
        "Lab Equipment": 400000,
        "Prototyping Material": 300000,
        "Cloud Computing": 150000,
        "Travel & Incidentals": 50000
      },
      submittedBy: "u4",
      submittedAt: "2026-01-06T10:00:00Z",
      approvedBy: "u2",
      approvedAt: "2026-01-08T14:35:00Z",
      updatedAt: "2026-01-08T14:35:00Z"
    },
    {
      id: "b3",
      departmentId: "d4", // Marketing
      fiscalYear: 2026,
      totalAmount: 850000,
      status: BudgetStatus.UNDER_REVIEW,
      monthlyBreakdown: {
        "Jan": 70000, "Feb": 70000, "Mar": 70000, "Apr": 70000,
        "May": 80000, "Jun": 80000, "Jul": 80000, "Aug": 70000,
        "Sep": 70000, "Oct": 70000, "Nov": 70000, "Dec": 70000
      },
      categoryBreakdown: {
        "Salary": 400000,
        "Ad Campaigns": 300000,
        "Agency Fees": 100000,
        "Software Licenses": 30000,
        "Travel & Incidentals": 20000
      },
      submittedBy: "u5",
      submittedAt: "2026-01-10T11:45:00Z",
      updatedAt: "2026-01-10T11:45:00Z"
    }
  ],
  expenses: [
    // Pre-seed realistic actual spending for Jan, Feb, Mar, Apr, May, Jun
    { id: "e1", departmentId: "d2", amount: 95000, category: "Salary", date: "2026-01-15", description: "January payroll IT", recordedBy: "u3" },
    { id: "e2", departmentId: "d2", amount: 28000, category: "Software Licenses", date: "2026-01-20", description: "Enterprise AWS billing", recordedBy: "u3" },
    { id: "e3", departmentId: "d2", amount: 96000, category: "Salary", date: "2026-02-15", description: "February payroll IT", recordedBy: "u3" },
    { id: "e4", departmentId: "d2", amount: 15000, category: "Hardware Infrastructure", date: "2026-02-22", description: "Replacement switch nodes", recordedBy: "u3" },
    { id: "e5", departmentId: "d2", amount: 95000, category: "Salary", date: "2026-03-15", description: "March payroll IT", recordedBy: "u3" },
    { id: "e6", departmentId: "d2", amount: 45000, category: "Consulting Services", date: "2026-03-28", description: "Cybersecurity audit milestone", recordedBy: "u3" },
    { id: "e7", departmentId: "d2", amount: 95000, category: "Salary", date: "2026-04-15", description: "April payroll IT", recordedBy: "u3" },
    { id: "e8", departmentId: "d2", amount: 120000, category: "Software Licenses", date: "2026-04-20", description: "Oracle annual renewal subscription", recordedBy: "u3" }, // Triggered Oracle PBCS warning since 120k Software license > 100k month total
    { id: "e9", departmentId: "d2", amount: 95000, category: "Salary", date: "2026-05-15", description: "May payroll IT", recordedBy: "u3" },
    { id: "e10", departmentId: "d2", amount: 32000, category: "Software Licenses", date: "2026-05-25", description: "SaaS subscriptions (Slack, GitHub, Zoom)", recordedBy: "u3" },
    { id: "e11", departmentId: "d2", amount: 95000, category: "Salary", date: "2026-06-15", description: "June payroll IT", recordedBy: "u3" },
    
    // R&D actual expenses
    { id: "e12", departmentId: "d3", amount: 190000, category: "Salary", date: "2026-01-15", description: "R&D payroll Jan", recordedBy: "u4" },
    { id: "e13", departmentId: "d3", amount: 185000, category: "Salary", date: "2026-02-15", description: "R&D payroll Feb", recordedBy: "u4" },
    { id: "e14", departmentId: "d3", amount: 120000, category: "Lab Equipment", date: "2026-02-28", description: "Deep learning server node", recordedBy: "u4" },
    { id: "e15", departmentId: "d3", amount: 190000, category: "Salary", date: "2026-03-15", description: "R&D payroll Mar", recordedBy: "u4" },
    { id: "e16", departmentId: "d3", amount: 45000, category: "Prototyping Material", date: "2026-03-22", description: "3D printer compound materials", recordedBy: "u4" },
    { id: "e17", departmentId: "d3", amount: 190000, category: "Salary", date: "2026-04-15", description: "R&D payroll Apr", recordedBy: "u4" },
    { id: "e18", departmentId: "d3", amount: 190000, category: "Salary", date: "2026-05-15", description: "R&D payroll May", recordedBy: "u4" },
    { id: "e19", departmentId: "d3", amount: 190000, category: "Salary", date: "2026-06-15", description: "R&D payroll Jun", recordedBy: "u4" },
    { id: "e20", departmentId: "d3", amount: 35000, category: "Cloud Computing", date: "2026-06-18", description: "TensorFlow training clusters on Google Cloud", recordedBy: "u4" }
  ],
  workflowLogs: [
    { id: "w1", budgetId: "b1", fromStatus: BudgetStatus.DRAFT, toStatus: BudgetStatus.SUBMITTED, changedBy: "u3", changedAt: "2026-01-05T09:15:00Z", comment: "Initial budget plan submitted for Oracle EPM verification." },
    { id: "w2", budgetId: "b1", fromStatus: BudgetStatus.SUBMITTED, toStatus: BudgetStatus.APPROVED, changedBy: "u2", changedAt: "2026-01-08T14:30:00Z", comment: "Approved. Numbers look solid and match IT headcount targets." },
    { id: "w3", budgetId: "b2", fromStatus: BudgetStatus.DRAFT, toStatus: BudgetStatus.SUBMITTED, changedBy: "u4", changedAt: "2026-01-06T10:00:00Z", comment: "Submitting adjusted lab requirements for approval." },
    { id: "w4", budgetId: "b2", fromStatus: BudgetStatus.SUBMITTED, toStatus: BudgetStatus.APPROVED, changedBy: "u2", changedAt: "2026-01-08T14:35:00Z", comment: "Approved. Vital for AI initiatives." },
    { id: "w5", budgetId: "b3", fromStatus: BudgetStatus.DRAFT, toStatus: BudgetStatus.SUBMITTED, changedBy: "u5", changedAt: "2026-01-10T11:45:00Z", comment: "Marketing campaign budget proposal for FY2026." },
    { id: "w6", budgetId: "b3", fromStatus: BudgetStatus.SUBMITTED, toStatus: BudgetStatus.UNDER_REVIEW, changedBy: "u2", changedAt: "2026-01-12T16:00:00Z", comment: "Reviewing campaign efficiency markers. Need ROI metrics." }
  ],
  auditLogs: [
    { id: "a1", userId: "u1", username: "admin.orcl", role: "Admin", action: "SYSTEM_INITIALIZE", details: "Oracle PBCS Inspired budget planning platform initialized successfully.", timestamp: "2026-06-23T23:15:00Z" }
  ],
  notifications: []
};

class DatabaseService {
  private data: DatabaseSchema = INITIAL_DATABASE;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.notifications) {
          this.data.notifications = [];
        }
      } else {
        this.save();
      }
    } catch (e) {
      console.error("Failed to read JSON database, resetting to pre-seeded state.", e);
      this.data = INITIAL_DATABASE;
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save JSON database", e);
    }
  }

  // AUDIT LOGGING
  public addAudit(userId: string, username: string, role: string, action: string, details: string) {
    const newLog: AuditLog = {
      id: "audit_" + Math.random().toString(36).substr(2, 9),
      userId,
      username,
      role,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(newLog); // Prepend to show latest first
    this.save();
  }

  // GETTERS
  public getUsers(): User[] {
    return this.data.users;
  }

  public getDepartments(): Department[] {
    return this.data.departments;
  }

  public getBudgets(): Budget[] {
    return this.data.budgets;
  }

  public getExpenses(): Expense[] {
    return this.data.expenses;
  }

  public getWorkflowLogs(): WorkflowLog[] {
    return this.data.workflowLogs;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public getNotifications(): Notification[] {
    return this.data.notifications || [];
  }

  public addNotification(
    title: string,
    message: string,
    type: "budget_submitted" | "budget_approved" | "budget_rejected" | "budget_exceeded" | "expense_added",
    referenceId: string,
    options?: { targetUserId?: string; targetRole?: UserRole }
  ): Notification {
    const newNotif: Notification = {
      id: "notif_" + Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      referenceId,
      isRead: false,
      createdAt: new Date().toISOString(),
      targetUserId: options?.targetUserId,
      targetRole: options?.targetRole
    };
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationAsRead(id: string): void {
    if (!this.data.notifications) return;
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
    }
  }

  public markAllNotificationsAsRead(userId: string, role: string): void {
    if (!this.data.notifications) return;
    this.data.notifications.forEach(n => {
      if (
        (!n.targetUserId && !n.targetRole) ||
        n.targetUserId === userId ||
        n.targetRole === role
      ) {
        n.isRead = true;
      }
    });
    this.save();
  }

  // OPERATIONS

  // User Authentication Simulation
  public authenticateUser(username: string): User | null {
    const user = this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    return user || null;
  }

  // Save/Update budget (with full validations)
  public saveBudget(budgetData: Partial<Budget>, userId: string, username: string, userRole: string): Budget {
    const budgets = this.data.budgets;
    
    // Validations:
    if (!budgetData.departmentId) {
      throw new Error("Department field is required.");
    }
    if (!budgetData.fiscalYear || budgetData.fiscalYear < 2020 || budgetData.fiscalYear > 2035) {
      throw new Error("A valid Fiscal Year is required.");
    }

    const totalAmount = Object.values(budgetData.monthlyBreakdown || {}).reduce((sum, val) => sum + val, 0);
    if (totalAmount < 0) {
      throw new Error("Budget totals cannot be negative.");
    }

    // Check duplicate budgets
    const existingIndex = budgets.findIndex(
      b => b.departmentId === budgetData.departmentId && b.fiscalYear === budgetData.fiscalYear && b.id !== budgetData.id
    );
    if (existingIndex !== -1) {
      throw new Error(`A budget plan already exists for this department in Fiscal Year ${budgetData.fiscalYear}.`);
    }

    let budget: Budget;

    if (budgetData.id) {
      const idx = budgets.findIndex(b => b.id === budgetData.id);
      if (idx === -1) throw new Error("Budget plan not found.");
      
      const prev = budgets[idx];
      budget = {
        ...prev,
        ...budgetData,
        totalAmount,
        updatedAt: new Date().toISOString()
      } as Budget;
      
      budgets[idx] = budget;
      this.addAudit(userId, username, userRole, "BUDGET_UPDATE", `Updated budget ${budget.id} for department ${budget.departmentId}. Total plan: $${totalAmount.toLocaleString()}`);
    } else {
      budget = {
        id: "b_" + Math.random().toString(36).substr(2, 9),
        departmentId: budgetData.departmentId,
        fiscalYear: budgetData.fiscalYear,
        totalAmount,
        status: budgetData.status || BudgetStatus.DRAFT,
        monthlyBreakdown: budgetData.monthlyBreakdown || {},
        categoryBreakdown: budgetData.categoryBreakdown || {},
        submittedBy: userId,
        updatedAt: new Date().toISOString()
      } as Budget;

      budgets.push(budget);
      this.addAudit(userId, username, userRole, "BUDGET_CREATE", `Created budget plan ${budget.id} for department ${budget.departmentId}. Amount: $${totalAmount.toLocaleString()}`);
    }

    this.save();

    if (budget.status === BudgetStatus.SUBMITTED) {
      const dept = this.data.departments.find(d => d.id === budget.departmentId);
      const deptName = dept ? dept.name : budget.departmentId;
      this.addNotification(
        "Budget Proposal Submitted",
        `${deptName} has submitted a budget of $${totalAmount.toLocaleString()} for FY${budget.fiscalYear}.`,
        "budget_submitted",
        budget.id,
        { targetRole: UserRole.FINANCE_MANAGER }
      );
    }

    return budget;
  }

  // Update budget status with workflow logging
  public updateBudgetWorkflow(budgetId: string, toStatus: BudgetStatus, userId: string, username: string, userRole: string, comment?: string): Budget {
    const budget = this.data.budgets.find(b => b.id === budgetId);
    if (!budget) {
      throw new Error("Budget plan not found.");
    }

    const fromStatus = budget.status;
    budget.status = toStatus;
    budget.updatedAt = new Date().toISOString();

    if (toStatus === BudgetStatus.APPROVED) {
      budget.approvedBy = userId;
      budget.approvedAt = new Date().toISOString();
    } else if (toStatus === BudgetStatus.REJECTED) {
      budget.rejectionReason = comment || "No feedback left.";
    }

    // Add Workflow log
    const newWorkflowLog: WorkflowLog = {
      id: "wf_" + Math.random().toString(36).substr(2, 9),
      budgetId,
      fromStatus,
      toStatus,
      changedBy: username,
      changedAt: new Date().toISOString(),
      comment
    };
    this.data.workflowLogs.push(newWorkflowLog);

    this.addAudit(
      userId,
      username,
      userRole,
      "BUDGET_WORKFLOW",
      `Budget ${budgetId} transition: ${fromStatus} -> ${toStatus}. Comment: "${comment || ""}"`
    );

    this.save();

    // Trigger Notifications for approvals/rejections/submissions
    const dept = this.data.departments.find(d => d.id === budget.departmentId);
    const deptName = dept ? dept.name : budget.departmentId;

    if (toStatus === BudgetStatus.SUBMITTED) {
      this.addNotification(
        "Budget Proposal Submitted",
        `${deptName} has submitted a budget of $${budget.totalAmount.toLocaleString()} for FY${budget.fiscalYear}.`,
        "budget_submitted",
        budget.id,
        { targetRole: UserRole.FINANCE_MANAGER }
      );
    } else if (toStatus === BudgetStatus.APPROVED) {
      this.addNotification(
        "Budget Proposal Approved",
        `The budget proposal of $${budget.totalAmount.toLocaleString()} for FY${budget.fiscalYear} (${deptName}) has been approved.`,
        "budget_approved",
        budget.id,
        { targetUserId: budget.submittedBy || undefined }
      );
    } else if (toStatus === BudgetStatus.REJECTED) {
      this.addNotification(
        "Budget Proposal Rejected",
        `The budget proposal of $${budget.totalAmount.toLocaleString()} for FY${budget.fiscalYear} (${deptName}) was rejected. Reason: ${comment || "No feedback left."}`,
        "budget_rejected",
        budget.id,
        { targetUserId: budget.submittedBy || undefined }
      );
    }

    return budget;
  }

  // Expense management (with threshold warns)
  public addExpense(expenseData: Partial<Expense>, userId: string, username: string, userRole: string): { expense: Expense; warning?: string } {
    if (!expenseData.departmentId || !expenseData.amount || !expenseData.category || !expenseData.date) {
      throw new Error("Missing required expense data fields (Department, Amount, Category, Date).");
    }

    if (expenseData.amount <= 0) {
      throw new Error("Expense amount must be a positive number.");
    }

    const expense: Expense = {
      id: "e_" + Math.random().toString(36).substr(2, 9),
      departmentId: expenseData.departmentId,
      amount: expenseData.amount,
      category: expenseData.category,
      date: expenseData.date,
      description: expenseData.description || `${expenseData.category} payment`,
      recordedBy: username,
      budgetId: expenseData.budgetId,
      vendorName: expenseData.vendorName,
      invoiceNumber: expenseData.invoiceNumber,
      invoiceUrl: expenseData.invoiceUrl
    };

    this.data.expenses.push(expense);

    // Calculate budget utilization check for warnings
    const warning = this.getBudgetWarning(expense);

    this.addAudit(
      userId,
      username,
      userRole,
      "EXPENSE_RECORD",
      `Recorded spending of $${expense.amount.toLocaleString()} for ${expense.category}. Warning: ${warning || "None"}`
    );

    this.save();

    // Trigger notification for expense recorded
    const dept = this.data.departments.find(d => d.id === expense.departmentId);
    const deptName = dept ? dept.name : expense.departmentId;
    this.addNotification(
      "Expense Added",
      `An expense of $${expense.amount.toLocaleString()} for ${expense.category} was recorded in ${deptName} by ${username}.`,
      "expense_added",
      expense.id,
      { targetRole: UserRole.FINANCE_MANAGER }
    );

    // Trigger notification for budget exceeded/warned
    if (warning && (warning.includes("Breach Warning") || warning.includes("Critical Alert") || warning.includes("exceeding") || warning.includes("breached"))) {
      this.addNotification(
        "Budget Limit Exceeded",
        `${warning}`,
        "budget_exceeded",
        expense.id,
        { targetRole: UserRole.FINANCE_MANAGER }
      );
    }

    return { expense, warning };
  }

  public editExpense(expenseId: string, expenseData: Partial<Expense>, userId: string, username: string, userRole: string): { expense: Expense; warning?: string } {
    const idx = this.data.expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) {
      throw new Error("Target expense transaction not found.");
    }

    if (expenseData.amount !== undefined && expenseData.amount <= 0) {
      throw new Error("Expense amount must be a positive number.");
    }

    const current = this.data.expenses[idx];
    const updated: Expense = {
      ...current,
      ...expenseData,
      id: expenseId, // maintain ID
    };

    this.data.expenses[idx] = updated;

    // Calculate budget utilization check for warnings
    const warning = this.getBudgetWarning(updated);

    this.addAudit(
      userId,
      username,
      userRole,
      "EXPENSE_EDIT",
      `Updated expense transaction ${expenseId}. Total amount: $${updated.amount.toLocaleString()}. Warning: ${warning || "None"}`
    );

    this.save();
    return { expense: updated, warning };
  }

  public deleteExpense(expenseId: string, userId: string, username: string, userRole: string): Expense {
    const idx = this.data.expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) {
      throw new Error("Target expense transaction not found.");
    }

    const removed = this.data.expenses.splice(idx, 1)[0];

    this.addAudit(
      userId,
      username,
      userRole,
      "EXPENSE_DELETE",
      `Deleted expenditure transaction of $${removed.amount.toLocaleString()} in category ${removed.category} for division ${removed.departmentId}.`
    );

    this.save();
    return removed;
  }

  private getBudgetWarning(expense: Expense): string | undefined {
    // Determine year from expense date
    const year = new Date(expense.date).getFullYear() || 2026;
    const budget = this.data.budgets.find(
      b => b.departmentId === expense.departmentId && b.fiscalYear === year && b.status === BudgetStatus.APPROVED
    );

    if (budget) {
      const categoryLimit = budget.categoryBreakdown[expense.category] || 0;
      const categorySpent = this.data.expenses
        .filter(e => e.departmentId === expense.departmentId && e.category === expense.category && new Date(e.date).getFullYear() === year)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalSpentForDept = this.data.expenses
        .filter(e => e.departmentId === expense.departmentId && new Date(e.date).getFullYear() === year)
        .reduce((sum, e) => sum + e.amount, 0);

      if (categoryLimit > 0 && categorySpent > categoryLimit) {
        return `Budget Breach Warning: Department has spent $${categorySpent.toLocaleString()} on ${expense.category}, exceeding the allocated budget limit of $${categoryLimit.toLocaleString()}!`;
      } else if (categoryLimit > 0 && categorySpent > categoryLimit * 0.9) {
        return `Caution: Department actual spending for ${expense.category} has reached 90% ($${categorySpent.toLocaleString()}/$${categoryLimit.toLocaleString()}) of budget allocations.`;
      } else if (totalSpentForDept > budget.totalAmount) {
        return `Critical Alert: Department overall spending has breached the entire FY${year} allocated budget! Spent: $${totalSpentForDept.toLocaleString()} / Allocated: $${budget.totalAmount.toLocaleString()}`;
      }
    } else {
      return `No approved baseline budget plan exists for this department for the fiscal year FY${year}. This expense is un-allocated spending.`;
    }
    return undefined;
  }
}

export const dbService = new DatabaseService();
