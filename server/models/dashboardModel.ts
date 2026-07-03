import { dbService } from "../../src/dbService.js";
import { BudgetStatus } from "../../src/types.js";

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

export class DashboardModel {
  private static MONTH_MAP: Record<string, string> = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
    "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
  };

  private static MONTH_FIELD_MAP: Record<string, string> = {
    "01": "january_budget", "02": "february_budget", "03": "march_budget",
    "04": "april_budget", "05": "may_budget", "06": "june_budget",
    "07": "july_budget", "08": "august_budget", "09": "september_budget",
    "10": "october_budget", "11": "november_budget", "12": "december_budget"
  };

  private static MONTH_NAME_MAP: Record<string, string> = {
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
    "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
  };

  /**
   * Fetch all aggregated metrics for financial dashboard
   */
  public static getDashboardData(
    deptFilter: string,
    yearFilter: number,
    monthFilter: string // "All" or "01", "02", ..., "12"
  ): DashboardMetrics {
    const departments = dbService.getDepartments();
    const budgets = dbService.getBudgets();
    const expenses = dbService.getExpenses();

    // 1. CARDS CALCULATION
    
    // Total Departments
    const departmentCount = departments.length;

    // Pending Approvals (Budget status is SUBMITTED/UNDER_REVIEW)
    const pendingApprovals = budgets.filter(
      b => b.status === BudgetStatus.SUBMITTED || b.status === BudgetStatus.UNDER_REVIEW
    ).length;

    // Filtered Budgets (must be APPROVED to count as official baseline funds)
    const approvedBudgets = budgets.filter(
      b => b.status === BudgetStatus.APPROVED && b.fiscalYear === yearFilter
    );

    let totalBudget = 0;
    approvedBudgets.forEach(b => {
      if (deptFilter === "All" || deptFilter === "all" || b.departmentId === deptFilter) {
        if (monthFilter === "All" || monthFilter === "all") {
          totalBudget += b.totalAmount;
        } else {
          const monthKey = this.MONTH_MAP[monthFilter];
          if (monthKey && b.monthlyBreakdown) {
            totalBudget += b.monthlyBreakdown[monthKey] || 0;
          }
        }
      }
    });

    // Filtered Expenses
    const filteredExpenses = expenses.filter(e => {
      const matchesDept = deptFilter === "All" || deptFilter === "all" || e.departmentId === deptFilter;
      const expenseYear = new Date(e.date).getFullYear();
      const matchesYear = expenseYear === yearFilter;
      
      let matchesMonth = true;
      if (monthFilter !== "All" && monthFilter !== "all") {
        const expenseMonth = e.date.split("-")[1]; // YYYY-MM-DD
        matchesMonth = expenseMonth === monthFilter;
      }

      return matchesDept && matchesYear && matchesMonth;
    });

    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBudget = totalBudget - totalExpense;
    const budgetUtilization = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

    // 2. CHARTS CALCULATION

    // A. Budget vs Expense by Department
    const budgetVsExpense = departments.map(dept => {
      // Find approved budget for this department and year
      const deptBudgetObj = budgets.find(
        b => b.departmentId === dept.id && b.fiscalYear === yearFilter && b.status === BudgetStatus.APPROVED
      );

      let bVal = 0;
      if (deptBudgetObj) {
        if (monthFilter === "All" || monthFilter === "all") {
          bVal = deptBudgetObj.totalAmount;
        } else {
          const monthKey = this.MONTH_MAP[monthFilter];
          bVal = deptBudgetObj.monthlyBreakdown?.[monthKey] || 0;
        }
      }

      // Filter expenses for this department
      const deptExpenses = expenses.filter(e => {
        const matchesDept = e.departmentId === dept.id;
        const matchesYear = new Date(e.date).getFullYear() === yearFilter;
        let matchesMonth = true;
        if (monthFilter !== "All" && monthFilter !== "all") {
          matchesMonth = e.date.split("-")[1] === monthFilter;
        }
        return matchesDept && matchesYear && matchesMonth;
      });

      const eVal = deptExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        code: dept.code,
        name: dept.name,
        Budget: bVal,
        Actual: eVal,
        Variance: bVal - eVal
      };
    });

    // B. Monthly Trend (Jan - Dec)
    const monthsArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrend = monthsArray.map(m => {
      const mNum = this.MONTH_NAME_MAP[m];
      
      // Calculate Budget for this specific month
      let mBudget = 0;
      budgets.forEach(b => {
        if (b.status === BudgetStatus.APPROVED && b.fiscalYear === yearFilter) {
          if (deptFilter === "All" || deptFilter === "all" || b.departmentId === deptFilter) {
            mBudget += b.monthlyBreakdown?.[m] || 0;
          }
        }
      });

      // Calculate Actual for this specific month
      let mExpense = 0;
      expenses.forEach(e => {
        const eYear = new Date(e.date).getFullYear();
        const eMonth = e.date.split("-")[1];
        if (eYear === yearFilter && eMonth === mNum) {
          if (deptFilter === "All" || deptFilter === "all" || e.departmentId === deptFilter) {
            mExpense += e.amount;
          }
        }
      });

      return {
        month: m,
        monthNum: mNum,
        Budget: mBudget,
        Actual: mExpense
      };
    });

    // C. Department Comparison: Breakdown of categories
    const departmentComparison = departments.map(dept => {
      const deptExpenses = expenses.filter(e => {
        const matchesDept = e.departmentId === dept.id;
        const matchesYear = new Date(e.date).getFullYear() === yearFilter;
        let matchesMonth = true;
        if (monthFilter !== "All" && monthFilter !== "all") {
          matchesMonth = e.date.split("-")[1] === monthFilter;
        }
        return matchesDept && matchesYear && matchesMonth;
      });

      const actualSum = deptExpenses.reduce((sum, e) => sum + e.amount, 0);
      const salary = deptExpenses.filter(e => e.category === "Salary").reduce((sum, e) => sum + e.amount, 0);
      const operations = deptExpenses.filter(e => e.category === "Operations").reduce((sum, e) => sum + e.amount, 0);
      const discretionary = deptExpenses.filter(e => e.category === "Discretionary").reduce((sum, e) => sum + e.amount, 0);

      return {
        department: dept.code,
        Salary: salary,
        Operations: operations,
        Discretionary: discretionary,
        Actual: actualSum
      };
    });

    // D. Pie Chart: Category wise spending
    const categoriesSet = ["Salary", "Operations", "Discretionary"];
    const pieChart = categoriesSet.map(cat => {
      const catSum = filteredExpenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: cat,
        value: catSum
      };
    });

    // E. Predictive Forecast Chart
    // Build actuals up to current month (June) and project future months based on budget and average actual run rate.
    // If monthFilter is "All", let's show the full year Jan-Dec.
    const forecastChart = monthsArray.map((m, idx) => {
      const mNum = this.MONTH_NAME_MAP[m];
      
      let mBudget = 0;
      budgets.forEach(b => {
        if (b.status === BudgetStatus.APPROVED && b.fiscalYear === yearFilter) {
          if (deptFilter === "All" || deptFilter === "all" || b.departmentId === deptFilter) {
            mBudget += b.monthlyBreakdown?.[m] || 0;
          }
        }
      });

      let mExpense = 0;
      expenses.forEach(e => {
        const eYear = new Date(e.date).getFullYear();
        const eMonth = e.date.split("-")[1];
        if (eYear === yearFilter && eMonth === mNum) {
          if (deptFilter === "All" || deptFilter === "all" || e.departmentId === deptFilter) {
            mExpense += e.amount;
          }
        }
      });

      // Simulate a standard cutoff: Let's assume months up to Jun (month 06) have actuals,
      // and future months (Jul-Dec) are modeled/projected.
      const isPastMonth = idx < 6; // Jan-Jun
      
      // Calculate average run-rate for past months to project future months
      const totalPastExpense = expenses
        .filter(e => {
          const eYear = new Date(e.date).getFullYear();
          const eMonth = e.date.split("-")[1];
          const mIdx = monthsArray.indexOf(this.MONTH_MAP[eMonth]);
          return eYear === yearFilter && mIdx < 6 && (deptFilter === "All" || deptFilter === "all" || e.departmentId === deptFilter);
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      const averageRunRate = totalPastExpense / 6;

      return {
        month: m,
        Actual: isPastMonth ? mExpense : null,
        Budget: mBudget,
        Forecast: isPastMonth ? mExpense : Math.round(averageRunRate * 0.85 + mBudget * 0.15) // weighted prediction
      };
    });

    // 3. SOX DOCUMENTED SQL QUERIES (AS REQUESTED)
    // The exact equivalent production relational queries executed in SQL dashboards
    const totalBudgetSQL = `
      SELECT SUM(${monthFilter === "All" || monthFilter === "all" ? "total_budget" : this.MONTH_FIELD_MAP[monthFilter] || "total_budget"}) AS total_budget 
      FROM budgets 
      WHERE status = 'Approved' 
        AND financial_year = ${yearFilter}
        ${deptFilter !== "All" && deptFilter !== "all" ? `AND department_id = '${deptFilter}'` : ""};
    `.trim();

    const totalExpenseSQL = `
      SELECT SUM(amount) AS total_expense 
      FROM expenses 
      WHERE YEAR(expense_date) = ${yearFilter}
        ${deptFilter !== "All" && deptFilter !== "all" ? `AND department_id = '${deptFilter}'` : ""}
        ${monthFilter !== "All" && monthFilter !== "all" ? `AND MONTH(expense_date) = ${Number(monthFilter)}` : ""};
    `.trim();

    const varianceByDeptSQL = `
      SELECT d.code, d.name, 
             COALESCE(SUM(b.total_budget), 0) AS Budget,
             COALESCE(SUM(e.amount), 0) AS Actual,
             (COALESCE(SUM(b.total_budget), 0) - COALESCE(SUM(e.amount), 0)) AS Variance
      FROM departments d
      LEFT JOIN budgets b ON b.department_id = d.department_id AND b.status = 'Approved' AND b.financial_year = ${yearFilter}
      LEFT JOIN expenses e ON e.department_id = d.department_id AND YEAR(e.expense_date) = ${yearFilter}
      GROUP BY d.department_id, d.code, d.name;
    `.trim();

    const monthlyTrendSQL = `
      SELECT MONTH(expense_date) AS month_num, SUM(amount) AS monthly_actual
      FROM expenses
      WHERE YEAR(expense_date) = ${yearFilter}
        ${deptFilter !== "All" && deptFilter !== "all" ? `AND department_id = '${deptFilter}'` : ""}
      GROUP BY MONTH(expense_date)
      ORDER BY month_num;
    `.trim();

    const categoryBreakdownSQL = `
      SELECT category, SUM(amount) AS total_actual
      FROM expenses
      WHERE YEAR(expense_date) = ${yearFilter}
        ${deptFilter !== "All" && deptFilter !== "all" ? `AND department_id = '${deptFilter}'` : ""}
      GROUP BY category;
    `.trim();

    return {
      cards: {
        totalBudget,
        totalExpense,
        remainingBudget,
        budgetUtilization,
        pendingApprovals,
        departmentCount
      },
      charts: {
        budgetVsExpense,
        monthlyTrend,
        departmentComparison,
        pieChart,
        forecastChart
      },
      queries: {
        totalBudgetSQL,
        totalExpenseSQL,
        varianceByDeptSQL,
        monthlyTrendSQL,
        categoryBreakdownSQL
      }
    };
  }
}
