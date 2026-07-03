import { dbService } from "../../src/dbService.js";
import { BudgetStatus, Expense } from "../../src/types.js";

export interface MonthlyReportRow {
  month: string;
  monthNum: string;
  budget: number;
  actual: number;
  variance: number;
  pctSpent: number;
}

export interface QuarterlyReportRow {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  months: string[];
  budget: number;
  actual: number;
  variance: number;
  pctSpent: number;
}

export interface YearlyReportRow {
  year: number;
  budget: number;
  actual: number;
  variance: number;
  pctSpent: number;
}

export interface DepartmentWiseRow {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  budget: number;
  actual: number;
  variance: number;
  pctSpent: number;
}

export interface BudgetVarianceRow {
  departmentName: string;
  departmentCode: string;
  category: string;
  budget: number;
  actual: number;
  variance: number;
  pctSpent: number;
  statusFlag: "NORMAL" | "CAUTION" | "BREACHED";
  notes: string;
}

export interface ExpenseSummaryReport {
  items: Array<Expense & { departmentName: string; departmentCode: string }>;
  categoryTotals: Array<{ category: string; amount: number }>;
  grandTotal: number;
}

export interface ReportPayload {
  filters: {
    departmentId: string;
    year: number;
    search: string;
    category: string;
  };
  monthly: MonthlyReportRow[];
  quarterly: QuarterlyReportRow[];
  yearly: YearlyReportRow[];
  departmentWise: DepartmentWiseRow[];
  budgetVariance: BudgetVarianceRow[];
  expenseSummary: ExpenseSummaryReport;
}

export class ReportModel {
  private static MONTHS_LIST = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  private static MONTH_MAP: Record<string, string> = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
    "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
  };
  private static MONTH_NAME_TO_NUM: Record<string, string> = {
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04", "May": "05", "Jun": "06",
    "Jul": "07", "Aug": "08", "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
  };

  public static getReportData(
    departmentId: string = "All",
    year: number = 2026,
    search: string = "",
    category: string = "All"
  ): ReportPayload {
    const departments = dbService.getDepartments();
    const budgets = dbService.getBudgets();
    const expenses = dbService.getExpenses();

    // LOWER CASE SEARCH KEYWORD FOR PARTIAL STRING MATCHES
    const searchLower = search.trim().toLowerCase();

    // -------------------------------------------------------------
    // 1. MONTHLY REPORT CALCULATIONS
    // -------------------------------------------------------------
    const monthly: MonthlyReportRow[] = this.MONTHS_LIST.map((m, idx) => {
      const monthNum = this.MONTH_NAME_TO_NUM[m];

      // Calculate Budget for month
      let mBudget = 0;
      budgets.forEach(b => {
        if (b.status === BudgetStatus.APPROVED && b.fiscalYear === year) {
          if (departmentId === "All" || b.departmentId === departmentId) {
            mBudget += b.monthlyBreakdown?.[m] || 0;
          }
        }
      });

      // Calculate Actuals for month
      let mActual = 0;
      expenses.forEach(e => {
        const eYear = new Date(e.date).getFullYear();
        const eMonth = e.date.split("-")[1];
        if (eYear === year && eMonth === monthNum) {
          const matchesDept = departmentId === "All" || e.departmentId === departmentId;
          const matchesCat = category === "All" || e.category === category;
          if (matchesDept && matchesCat) {
            mActual += e.amount;
          }
        }
      });

      const variance = mBudget - mActual;
      const pctSpent = mBudget > 0 ? (mActual / mBudget) * 100 : 0;

      return {
        month: m,
        monthNum,
        budget: mBudget,
        actual: mActual,
        variance,
        pctSpent
      };
    });

    // -------------------------------------------------------------
    // 2. QUARTERLY REPORT CALCULATIONS
    // -------------------------------------------------------------
    const quarters: Array<{ quarter: "Q1" | "Q2" | "Q3" | "Q4"; months: string[] }> = [
      { quarter: "Q1", months: ["Jan", "Feb", "Mar"] },
      { quarter: "Q2", months: ["Apr", "May", "Jun"] },
      { quarter: "Q3", months: ["Jul", "Aug", "Sep"] },
      { quarter: "Q4", months: ["Oct", "Nov", "Dec"] }
    ];

    const quarterly: QuarterlyReportRow[] = quarters.map(q => {
      let qBudget = 0;
      let qActual = 0;

      q.months.forEach(m => {
        const mData = monthly.find(row => row.month === m);
        if (mData) {
          qBudget += mData.budget;
          qActual += mData.actual;
        }
      });

      const variance = qBudget - qActual;
      const pctSpent = qBudget > 0 ? (qActual / qBudget) * 100 : 0;

      return {
        quarter: q.quarter,
        months: q.months,
        budget: qBudget,
        actual: qActual,
        variance,
        pctSpent
      };
    });

    // -------------------------------------------------------------
    // 3. YEARLY REPORT CALCULATIONS (FY-1, FY, FY+1 comparisons)
    // -------------------------------------------------------------
    const targetYears = [year - 1, year, year + 1];
    const yearly: YearlyReportRow[] = targetYears.map(y => {
      let yBudget = 0;
      let yActual = 0;

      // Approved Budget sum
      budgets.forEach(b => {
        if (b.status === BudgetStatus.APPROVED && b.fiscalYear === y) {
          if (departmentId === "All" || b.departmentId === departmentId) {
            yBudget += b.totalAmount;
          }
        }
      });

      // Actual Spend sum
      expenses.forEach(e => {
        const eYear = new Date(e.date).getFullYear();
        if (eYear === y) {
          const matchesDept = departmentId === "All" || e.departmentId === departmentId;
          const matchesCat = category === "All" || e.category === category;
          if (matchesDept && matchesCat) {
            yActual += e.amount;
          }
        }
      });

      const variance = yBudget - yActual;
      const pctSpent = yBudget > 0 ? (yActual / yBudget) * 100 : 0;

      return {
        year: y,
        budget: yBudget,
        actual: yActual,
        variance,
        pctSpent
      };
    });

    // -------------------------------------------------------------
    // 4. DEPARTMENT WISE REPORT CALCULATIONS
    // -------------------------------------------------------------
    const departmentWise: DepartmentWiseRow[] = departments.map(dept => {
      // Find budget for this specific department in target year
      const deptBudgetObj = budgets.find(
        b => b.departmentId === dept.id && b.fiscalYear === year && b.status === BudgetStatus.APPROVED
      );
      const budgetAmount = deptBudgetObj ? deptBudgetObj.totalAmount : 0;

      // Find actual expenses for department
      const deptExpenses = expenses.filter(e => {
        const eYear = new Date(e.date).getFullYear();
        const matchesYear = eYear === year;
        const matchesDept = e.departmentId === dept.id;
        const matchesCat = category === "All" || e.category === category;
        return matchesYear && matchesDept && matchesCat;
      });

      const actualAmount = deptExpenses.reduce((sum, e) => sum + e.amount, 0);
      const variance = budgetAmount - actualAmount;
      const pctSpent = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

      return {
        departmentId: dept.id,
        departmentCode: dept.code,
        departmentName: dept.name,
        budget: budgetAmount,
        actual: actualAmount,
        variance,
        pctSpent
      };
    });

    // -------------------------------------------------------------
    // 5. BUDGET VARIANCE REPORT CALCULATIONS
    // -------------------------------------------------------------
    const budgetVariance: BudgetVarianceRow[] = [];
    
    // Detailed Category and Department level variance matrix
    departments.forEach(dept => {
      if (departmentId !== "All" && dept.id !== departmentId) return;

      const deptBudgetObj = budgets.find(
        b => b.departmentId === dept.id && b.fiscalYear === year && b.status === BudgetStatus.APPROVED
      );

      // We track both standard predefined categories and any active actual categories
      const distinctCategories = Array.from(new Set([
        "Salary", "Software Licenses", "Hardware Infrastructure", 
        "Consulting Services", "Travel & Incidentals", "Lab Equipment", 
        "Prototyping Material", "Cloud Computing", "Ad Campaigns", "Agency Fees",
        ...expenses.map(e => e.category)
      ]));

      distinctCategories.forEach(cat => {
        if (category !== "All" && cat !== category) return;

        const budgetAlloc = deptBudgetObj?.categoryBreakdown?.[cat] || 0;

        const catExpenses = expenses.filter(e => {
          const eYear = new Date(e.date).getFullYear();
          return eYear === year && e.departmentId === dept.id && e.category === cat;
        });

        const actualAlloc = catExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Skip rows with zero budget AND zero actual
        if (budgetAlloc === 0 && actualAlloc === 0) return;

        const variance = budgetAlloc - actualAlloc;
        const pctSpent = budgetAlloc > 0 ? (actualAlloc / budgetAlloc) * 100 : 0;

        let statusFlag: "NORMAL" | "CAUTION" | "BREACHED" = "NORMAL";
        let notes = "Spending within corporate limits.";

        if (pctSpent > 100) {
          statusFlag = "BREACHED";
          notes = `BREACH ALERT: Overspent by $${Math.abs(variance).toLocaleString()}.`;
        } else if (pctSpent >= 90) {
          statusFlag = "CAUTION";
          notes = `WARNING: Approaching threshold (${pctSpent.toFixed(1)}%).`;
        }

        budgetVariance.push({
          departmentName: dept.name,
          departmentCode: dept.code,
          category: cat,
          budget: budgetAlloc,
          actual: actualAlloc,
          variance,
          pctSpent,
          statusFlag,
          notes
        });
      });
    });

    // -------------------------------------------------------------
    // 6. EXPENSE SUMMARY REPORT (Itemized list with filter + search)
    // -------------------------------------------------------------
    const filteredSummaryItems = expenses
      .filter(e => {
        // Year filter
        const eYear = new Date(e.date).getFullYear();
        if (eYear !== year) return false;

        // Department filter
        if (departmentId !== "All" && e.departmentId !== departmentId) return false;

        // Category filter
        if (category !== "All" && e.category !== category) return false;

        // Search filter (matches description, category, or vendorName or invoiceNumber)
        if (searchLower) {
          const descMatch = (e.description || "").toLowerCase().includes(searchLower);
          const catMatch = (e.category || "").toLowerCase().includes(searchLower);
          const vendorMatch = (e.vendorName || "").toLowerCase().includes(searchLower);
          const invoiceMatch = (e.invoiceNumber || "").toLowerCase().includes(searchLower);
          const recordedMatch = (e.recordedBy || "").toLowerCase().includes(searchLower);
          if (!descMatch && !catMatch && !vendorMatch && !invoiceMatch && !recordedMatch) {
            return false;
          }
        }

        return true;
      })
      .map(e => {
        const dept = departments.find(d => d.id === e.departmentId);
        return {
          ...e,
          departmentName: dept ? dept.name : "N/A",
          departmentCode: dept ? dept.code : "N/A"
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending

    // Category totals for itemized list
    const categoryTotalsMap: Record<string, number> = {};
    filteredSummaryItems.forEach(item => {
      categoryTotalsMap[item.category] = (categoryTotalsMap[item.category] || 0) + item.amount;
    });

    const categoryTotals = Object.keys(categoryTotalsMap).map(cat => ({
      category: cat,
      amount: categoryTotalsMap[cat]
    })).sort((a, b) => b.amount - a.amount);

    const grandTotal = filteredSummaryItems.reduce((sum, item) => sum + item.amount, 0);

    const expenseSummary: ExpenseSummaryReport = {
      items: filteredSummaryItems,
      categoryTotals,
      grandTotal
    };

    return {
      filters: {
        departmentId,
        year,
        search,
        category
      },
      monthly,
      quarterly,
      yearly,
      departmentWise,
      budgetVariance,
      expenseSummary
    };
  }
}
