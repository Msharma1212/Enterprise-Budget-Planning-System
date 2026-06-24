export enum UserRole {
  ADMIN = "Admin",
  FINANCE_MANAGER = "Finance Manager",
  DEPARTMENT_MANAGER = "Department Manager",
  EMPLOYEE = "Employee"
}

export enum BudgetStatus {
  DRAFT = "Draft",
  SUBMITTED = "Submitted",
  UNDER_REVIEW = "Under Review",
  APPROVED = "Approved",
  REJECTED = "Rejected"
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  departmentId: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string;
}

export interface Budget {
  id: string;
  departmentId: string;
  fiscalYear: number;
  totalAmount: number;
  status: BudgetStatus;
  monthlyBreakdown: { [month: string]: number }; // e.g. { "Jan": 12000, "Feb": 13000, ... }
  categoryBreakdown: { [category: string]: number }; // e.g. { "Salary": 80000, "Operations": 20000, ... }
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  departmentId: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  recordedBy: string;
  budgetId?: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
}

export interface WorkflowLog {
  id: string;
  budgetId: string;
  fromStatus: BudgetStatus;
  toStatus: BudgetStatus;
  changedBy: string;
  changedAt: string;
  comment?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  targetUserId?: string;
  targetRole?: UserRole;
  title: string;
  message: string;
  type: "budget_submitted" | "budget_approved" | "budget_rejected" | "budget_exceeded" | "expense_added";
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

export interface ForecastResponse {
  forecastAmount: number;
  confidenceScore: number;
  trendAnalysis: string;
  recommendations: string[];
  risks: string[];
}

export interface DashboardMetrics {
  cards: {
    totalBudget: number;
    totalExpense: number;
    remainingBudget: number;
    budgetUtilization: number;
    pendingApprovals: number;
    departmentCount: number;
  };
  charts: {
    budgetVsExpense: Array<{
      code: string;
      name: string;
      Budget: number;
      Actual: number;
      Variance: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      monthNum: string;
      Budget: number;
      Actual: number;
    }>;
    departmentComparison: Array<{
      department: string;
      Salary: number;
      Operations: number;
      Discretionary: number;
      Actual: number;
    }>;
    pieChart: Array<{
      name: string;
      value: number;
    }>;
    forecastChart: Array<{
      month: string;
      Actual: number | null;
      Budget: number;
      Forecast: number;
    }>;
  };
  queries: {
    totalBudgetSQL: string;
    totalExpenseSQL: string;
    varianceByDeptSQL: string;
    monthlyTrendSQL: string;
    categoryBreakdownSQL: string;
  };
}

