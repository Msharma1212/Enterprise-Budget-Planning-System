import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  CheckSquare, 
  Receipt, 
  TrendingUp, 
  History, 
  FileText, 
  Settings, 
  LogOut, 
  Building2, 
  Plus, 
  Edit2,
  Trash2,
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  Download, 
  Upload, 
  Sparkles, 
  FileUp,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  HelpCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Building,
  Printer,
  Shield,
  ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { Sidebar } from "./components/Sidebar.js";
import { FinancialReports } from "./components/FinancialReports.js";
import { NotificationBell } from "./components/NotificationBell.js";
import { AuditDashboard } from "./components/AuditDashboard.js";
import { FinancialAssistant } from "./components/FinancialAssistant.js";
import { User, UserRole, Department, Budget, BudgetStatus, Expense, WorkflowLog, AuditLog, ForecastResponse, DashboardMetrics } from "./types.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CATEGORIES = ["Salary", "Software Licenses", "Hardware Infrastructure", "Consulting Services", "Travel & Incidentals", "Lab Equipment", "Prototyping Material", "Cloud Computing", "Ad Campaigns", "Agency Fees"];

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState("admin.orcl");
  const [passwordInput, setPasswordInput] = useState("password123");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // New User Registration Form State
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState("Employee");
  const [regDeptId, setRegDeptId] = useState("d2");

  // Global App States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Notifications / Feedback Messages
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  // Filter States
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState<number>(2026);

  // --- FORMS & DIALOG STATE ---
  // Budget entry form state
  const [formDeptId, setFormDeptId] = useState("");
  const [formYear, setFormYear] = useState(2026);
  const [formMonthlyBreakdown, setFormMonthlyBreakdown] = useState<{ [month: string]: number }>(
    MONTHS.reduce((acc, m) => ({ ...acc, [m]: 50000 }), {})
  );
  const [formCategoryBreakdown, setFormCategoryBreakdown] = useState<{ [cat: string]: number }>(
    CATEGORIES.slice(0, 5).reduce((acc, c) => ({ ...acc, [c]: 120000 }), {})
  );
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  // Expense logging form state
  const [expenseDeptId, setExpenseDeptId] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState(CATEGORIES[0]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseVendorName, setExpenseVendorName] = useState("");
  const [expenseInvoiceNumber, setExpenseInvoiceNumber] = useState("");
  const [expenseInvoiceUrl, setExpenseInvoiceUrl] = useState("");
  const [expenseBudgetId, setExpenseBudgetId] = useState("");
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");
  const [expenseFilterCategory, setExpenseFilterCategory] = useState("All");
  const [expenseFilterDeptId, setExpenseFilterDeptId] = useState("All");


  // Workflow Approval Feedback state
  const [workflowComment, setWorkflowComment] = useState("");
  const [selectedWorkflowBudgetId, setSelectedWorkflowBudgetId] = useState<string | null>(null);

  // AI Forecasting state
  const [forecastDeptId, setForecastDeptId] = useState("");
  const [forecastCategory, setForecastCategory] = useState("All Categories");
  const [forecastTargetGrowth, setForecastTargetGrowth] = useState<number>(8);
  const [forecastResponse, setForecastResponse] = useState<ForecastResponse | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  // System Settings state
  const [varianceAlertThreshold, setVarianceAlertThreshold] = useState<number>(90); // Alert when actuals reach 90% of budget
  const [planningOpen, setPlanningOpen] = useState<boolean>(true);

  // Enterprise Dashboard States (Module 6)
  const [dashboardDeptFilter, setDashboardDeptFilter] = useState<string>("All");
  const [dashboardYearFilter, setDashboardYearFilter] = useState<number>(2026);
  const [dashboardMonthFilter, setDashboardMonthFilter] = useState<string>("All");
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);
  const [dashboardSqlTab, setDashboardSqlTab] = useState<"budget" | "expense" | "variance" | "trend" | "category">("budget");

  // Department Management States
  const [usersDirectory, setUsersDirectory] = useState<User[]>([]);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deptFormName, setDeptFormName] = useState("");
  const [deptFormCode, setDeptFormCode] = useState("");
  const [deptFormManagerId, setDeptFormManagerId] = useState("");
  const [deptFormError, setDeptFormError] = useState("");
  const [budgetFormValidationError, setBudgetFormValidationError] = useState("");
  const [approvalTab, setApprovalTab] = useState<"pending" | "approved" | "rejected">("pending");

  // Data Fetching
  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const headers: HeadersInit = {
        "Authorization": token ? `Bearer ${token}` : "",
        "X-User-Username": currentUser?.username || ""
      };

      const [deptsRes, budgetsRes, expensesRes, auditsRes, workflowsRes] = await Promise.all([
        fetch("/api/v1/departments", { headers }).then(async r => {
          if (!r.ok) {
            return fetch("/api/departments").then(res => res.json());
          }
          return r.json();
        }),
        fetch("/api/v1/budgets", { headers }).then(async r => {
          if (!r.ok) {
            return fetch("/api/budgets").then(res => res.json());
          }
          const rows = await r.json();
          return rows.map((row: any) => ({
            id: row.budget_id,
            departmentId: row.department_id,
            fiscalYear: row.financial_year,
            totalAmount: row.total_budget,
            status: row.status === "Approved" ? "Approved" : row.status === "Rejected" ? "Rejected" : row.status === "Draft" ? "Draft" : "Under Review",
            monthlyBreakdown: {
              "Jan": Number(row.january_budget),
              "Feb": Number(row.february_budget),
              "Mar": Number(row.march_budget),
              "Apr": Number(row.april_budget),
              "May": Number(row.may_budget),
              "Jun": Number(row.june_budget),
              "Jul": Number(row.july_budget),
              "Aug": Number(row.august_budget),
              "Sep": Number(row.september_budget),
              "Oct": Number(row.october_budget),
              "Nov": Number(row.november_budget),
              "Dec": Number(row.december_budget)
            },
            categoryBreakdown: {
              "Salary": Math.round(Number(row.total_budget) * 0.5),
              "Operations": Math.round(Number(row.total_budget) * 0.4),
              "Discretionary": Math.round(Number(row.total_budget) * 0.1)
            },
            submittedBy: row.created_by,
            submittedAt: row.created_at,
            updatedAt: row.updated_at
          }));
        }),
        fetch("/api/v1/expenses", { headers }).then(async r => {
          if (!r.ok) {
            return fetch("/api/expenses").then(res => res.json());
          }
          const rows = await r.json();
          return rows.map((row: any) => ({
            id: row.expense_id,
            departmentId: row.department_id,
            amount: Number(row.amount),
            category: row.category,
            date: row.expense_date,
            description: row.description,
            recordedBy: row.created_by,
            budgetId: row.budget_id,
            vendorName: row.vendor_name,
            invoiceNumber: row.invoice_number,
            invoiceUrl: row.invoice_url
          }));
        }),
        fetch("/api/audit-logs").then(r => r.json()),
        fetch("/api/v1/workflows", { headers }).then(async r => {
          if (!r.ok) {
            return fetch("/api/workflow-logs").then(res => res.json());
          }
          const rows = await r.json();
          return rows.map((row: any) => ({
            id: row.workflow_id,
            budgetId: row.budget_id,
            fromStatus: row.from_status,
            toStatus: row.to_status,
            changedBy: row.changed_by,
            changedAt: row.changed_at,
            comment: row.comment
          }));
        }),
      ]);

      setDepartments(deptsRes);
      setBudgets(budgetsRes);
      setExpenses(expensesRes);
      setAuditLogs(auditsRes);
      setWorkflowLogs(workflowsRes);

      if (token) {
        fetch("/api/v1/auth/directory", { headers })
          .then(r => r.ok ? r.json() : [])
          .then(data => setUsersDirectory(data))
          .catch(e => console.error("Failed to load users directory", e));
      }
    } catch (err) {
      console.error("Failed to load PBCS data state", err);
    }
  };

  const fetchDashboardMetrics = async (
    dept = dashboardDeptFilter,
    yr = dashboardYearFilter,
    mo = dashboardMonthFilter
  ) => {
    setIsDashboardLoading(true);
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const headers: HeadersInit = {
        "Authorization": token ? `Bearer ${token}` : "",
        "X-User-Username": currentUser?.username || ""
      };
      const res = await fetch(`/api/v1/dashboard/metrics?departmentId=${dept}&year=${yr}&month=${mo}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDashboardMetrics(data);
      } else {
        console.error("Dashboard metrics endpoint returned error status.");
      }
    } catch (e) {
      console.error("Failed to load dashboard metrics:", e);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeTab === "dashboard") {
      fetchDashboardMetrics(dashboardDeptFilter, dashboardYearFilter, dashboardMonthFilter);
    }
  }, [currentUser, activeTab, dashboardDeptFilter, dashboardYearFilter, dashboardMonthFilter]);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardMetrics();
    }
  }, [budgets, expenses]);

  useEffect(() => {
    // Try to auto-restore active session from localStorage
    const savedUser = localStorage.getItem("orcl_pbcs_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem("orcl_pbcs_user");
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      // Set default form choices based on user dept
      if (currentUser.departmentId) {
        setFormDeptId(currentUser.departmentId);
        setExpenseDeptId(currentUser.departmentId);
        setForecastDeptId(currentUser.departmentId);
      }
    }
  }, [currentUser]);

  // Auth Submit Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingUser(true);
    setLoginError("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login validation failed");
      }
      setCurrentUser(data.user);
      localStorage.setItem("orcl_pbcs_user", JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem("orcl_pbcs_token", data.token);
      }
      triggerAlert("success", `Authorized JWT session initialized. Welcome ${data.user.name}`);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingUser(true);
    setLoginError("");
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
          name: regName,
          role: regRole,
          departmentId: regDeptId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Onboarding failed");
      }
      triggerAlert("success", `Employee registered successfully in active directory. Proceed to Login.`);
      setUsernameInput(regUsername);
      setPasswordInput(regPassword);
      setIsRegisterMode(false);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("orcl_pbcs_user");
    localStorage.removeItem("orcl_pbcs_token");
    triggerAlert("warning", "Security token expired. Session terminated.");
  };

  // Notification trigger helper
  const triggerAlert = (type: "success" | "error" | "warning", text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 6000);
  };

  // --- DEPARTMENT MANAGEMENT API CALLS ---
  const handleCreateOrUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptFormError("");
    const token = localStorage.getItem("orcl_pbcs_token");
    if (!token) {
      setDeptFormError("You must be logged in with a valid JWT token.");
      return;
    }

    try {
      const url = editingDept 
        ? `/api/v1/departments/${editingDept.id}` 
        : "/api/v1/departments";
      const method = editingDept ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: deptFormName,
          code: deptFormCode.toUpperCase(),
          managerId: deptFormManagerId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save department details.");
      }

      triggerAlert("success", editingDept ? `Department ${deptFormCode} updated successfully.` : `Department ${deptFormCode} created successfully.`);
      setIsDeptModalOpen(false);
      setEditingDept(null);
      setDeptFormName("");
      setDeptFormCode("");
      setDeptFormManagerId("");
      fetchAllData();
    } catch (err: any) {
      setDeptFormError(err.message);
    }
  };

  const handleDeleteDept = async (deptId: string, deptCode: string) => {
    if (!window.confirm(`Are you sure you want to decommission corporate department ${deptCode}? This action will verify referential integrity locks and log compliance trace trails.`)) {
      return;
    }

    const token = localStorage.getItem("orcl_pbcs_token");
    if (!token) {
      triggerAlert("error", "Active login required to perform department decommissioning.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/departments/${deptId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to decommission department.");
      }

      triggerAlert("success", `Department ${deptCode} retired successfully from registry.`);
      fetchAllData();
    } catch (err: any) {
      triggerAlert("error", err.message);
    }
  };

  const openCreateDeptModal = () => {
    setEditingDept(null);
    setDeptFormName("");
    setDeptFormCode("");
    setDeptFormManagerId(usersDirectory[0]?.id || "");
    setDeptFormError("");
    setIsDeptModalOpen(true);
  };

  const openEditDeptModal = (dept: any) => {
    setEditingDept(dept);
    setDeptFormName(dept.name);
    setDeptFormCode(dept.code);
    setDeptFormManagerId(dept.managerId || "");
    setDeptFormError("");
    setIsDeptModalOpen(true);
  };

  // Calculate high-fidelity KPIs
  const getFilteredBudgets = () => {
    return budgets.filter(b => {
      const matchesDept = selectedDeptFilter === "all" || b.departmentId === selectedDeptFilter;
      const matchesYear = b.fiscalYear === selectedYearFilter;
      return matchesDept && matchesYear;
    });
  };

  const getFilteredExpenses = () => {
    return expenses.filter(e => {
      const matchesDept = expenseFilterDeptId === "All"
        ? (selectedDeptFilter === "all" || e.departmentId === selectedDeptFilter)
        : e.departmentId === expenseFilterDeptId;
      
      const matchesYear = e.date.startsWith(selectedYearFilter.toString());
      
      const matchesCategory = expenseFilterCategory === "All" || e.category === expenseFilterCategory;
      
      const query = expenseSearchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        (e.description || "").toLowerCase().includes(query) ||
        (e.vendorName || "").toLowerCase().includes(query) ||
        (e.invoiceNumber || "").toLowerCase().includes(query) ||
        (e.recordedBy || "").toLowerCase().includes(query);
        
      return matchesDept && matchesYear && matchesCategory && matchesSearch;
    });
  };

  // KPI Metrics
  const approvedBudgets = getFilteredBudgets().filter(b => b.status === BudgetStatus.APPROVED);
  const totalBudgetPool = approvedBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalActualExpenses = getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0);
  const remainingBudgetPool = totalBudgetPool - totalActualExpenses;
  const budgetUtilizationRate = totalBudgetPool > 0 ? (totalActualExpenses / totalBudgetPool) * 100 : 0;
  
  // Pending Approval budget counter
  const pendingApprovalsCount = budgets.filter(b => b.status === BudgetStatus.SUBMITTED || b.status === BudgetStatus.UNDER_REVIEW).length;

  // BUDGET CREATION / PLANNING GRID DYNAMIC UPDATES
  const handleMonthlyChange = (month: string, val: number) => {
    setFormMonthlyBreakdown(prev => {
      const updated = { ...prev, [month]: val };
      // Distribute total dynamically into category breakdown to keep them in parity
      const total = (Object.values(updated) as number[]).reduce((s, v) => s + v, 0);
      recalculateCategorySlices(total);
      return updated;
    });
  };

  const recalculateCategorySlices = (totalAmount: number) => {
    const keys = Object.keys(formCategoryBreakdown);
    const split = Math.round(totalAmount / keys.length);
    const updatedCats: { [cat: string]: number } = {};
    keys.forEach((k, idx) => {
      if (idx === keys.length - 1) {
        // absorb remainder
        const currentSum = Object.values(updatedCats).reduce((s, v) => s + v, 0);
        updatedCats[k] = totalAmount - currentSum;
      } else {
        updatedCats[k] = split;
      }
    });
    setFormCategoryBreakdown(updatedCats);
  };

  const loadBudgetIntoForm = (b: Budget) => {
    setEditingBudgetId(b.id);
    setFormDeptId(b.departmentId);
    setFormYear(b.fiscalYear);
    setFormMonthlyBreakdown(b.monthlyBreakdown);
    setFormCategoryBreakdown(b.categoryBreakdown);
    setActiveTab("budget-form");
    triggerAlert("success", `Budget plan for department ${departments.find(d => d.id === b.departmentId)?.name || b.departmentId} loaded into design grid.`);
  };

  const handleBudgetFormSubmit = async (e: React.FormEvent, submitStatus: BudgetStatus = BudgetStatus.DRAFT) => {
    e.preventDefault();
    setBudgetFormValidationError("");

    if (!currentUser) {
      setBudgetFormValidationError("Active corporate login required.");
      return;
    }
    if (!planningOpen) {
      triggerAlert("error", "The Planning Window is currently closed by Administrators.");
      setBudgetFormValidationError("The Planning Window is currently closed by Administrators.");
      return;
    }

    if (!formDeptId) {
      setBudgetFormValidationError("Target Department Unit is required.");
      return;
    }

    const monthsMap: { [key: string]: string } = {
      "Jan": "january_budget",
      "Feb": "february_budget",
      "Mar": "march_budget",
      "Apr": "april_budget",
      "May": "may_budget",
      "Jun": "june_budget",
      "Jul": "july_budget",
      "Aug": "august_budget",
      "Sep": "september_budget",
      "Oct": "october_budget",
      "Nov": "november_budget",
      "Dec": "december_budget"
    };

    const sqlPayload: any = {
      department_id: formDeptId,
      financial_year: Number(formYear),
      status: submitStatus === BudgetStatus.DRAFT ? "Draft" : "Pending"
    };

    let containsNegative = false;
    MONTHS.forEach(m => {
      const val = formMonthlyBreakdown[m] || 0;
      if (val < 0) {
        containsNegative = true;
      }
      const sqlKey = monthsMap[m];
      sqlPayload[sqlKey] = Number(val);
    });

    if (containsNegative) {
      setBudgetFormValidationError("Budget monthly inputs cannot be negative values.");
      return;
    }

    // Client-side Duplicate Check for smoother UI
    const duplicate = budgets.find(
      b => b.departmentId === formDeptId && b.fiscalYear === Number(formYear) && b.id !== editingBudgetId
    );
    if (duplicate && !editingBudgetId) {
      setBudgetFormValidationError(`A budget plan already exists for this department in Fiscal Year ${formYear}. Duplicate budget for same year not allowed.`);
      return;
    }

    const token = localStorage.getItem("orcl_pbcs_token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    try {
      if (editingBudgetId) {
        await axios.put(`/api/v1/budgets/${editingBudgetId}`, sqlPayload, { headers });
      } else {
        await axios.post("/api/v1/budgets", sqlPayload, { headers });
      }

      triggerAlert("success", editingBudgetId ? `EPM Budget Plan modified successfully.` : `EPM Corporate Budget Plan provisioned successfully.`);
      setBudgetFormValidationError("");
      resetBudgetForm();
      fetchAllData();
      setActiveTab("dashboard");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Failed to save EPM budget plan.";
      setBudgetFormValidationError(errMsg);
      triggerAlert("error", errMsg);
    }
  };

  const resetBudgetForm = () => {
    setEditingBudgetId(null);
    setFormMonthlyBreakdown(MONTHS.reduce((acc, m) => ({ ...acc, [m]: 50000 }), {}));
    setFormCategoryBreakdown(CATEGORIES.slice(0, 5).reduce((acc, c) => ({ ...acc, [c]: 120000 }), {}));
  };

  // EXCEL & DATA SIMULATION
  const handleExcelExport = () => {
    // Generate simple readable CSV download representation
    const headers = ["Department", "Year", "Status", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Total"];
    const rows = budgets.map(b => {
      const dept = departments.find(d => d.id === b.departmentId)?.name || b.departmentId;
      return [
        `"${dept}"`,
        b.fiscalYear,
        b.status,
        ...MONTHS.map(m => b.monthlyBreakdown[m] || 0),
        b.totalAmount
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Oracle_PBCS_Financial_Plan_${selectedYearFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert("success", "Enterprise structural CSV export initiated.");
  };

  const handleExcelImportMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Simulate real parsing delay
    triggerAlert("warning", `Parsing spreadsheet package "${file.name}" for Oracle PBCS schemas...`);
    
    setTimeout(() => {
      // Create a simulated budget loaded from Excel
      const targetDeptId = currentUser?.departmentId || "d2";
      const randomTotal = 1500000;
      const parsedBudget: Budget = {
        id: "imported_" + Math.random().toString(36).substr(2, 5),
        departmentId: targetDeptId,
        fiscalYear: 2026,
        totalAmount: randomTotal,
        status: BudgetStatus.DRAFT,
        monthlyBreakdown: MONTHS.reduce((acc, m) => ({ ...acc, [m]: 125000 }), {}),
        categoryBreakdown: {
          "Salary": 800000,
          "Software Licenses": 400000,
          "Hardware Infrastructure": 300000
        },
        updatedAt: new Date().toISOString()
      };
      
      // Load imported plan directly into form to let user verify
      setEditingBudgetId(null);
      setFormDeptId(parsedBudget.departmentId);
      setFormYear(parsedBudget.fiscalYear);
      setFormMonthlyBreakdown(parsedBudget.monthlyBreakdown);
      setFormCategoryBreakdown(parsedBudget.categoryBreakdown);
      setActiveTab("budget-form");
      
      triggerAlert("success", `Spreadsheet loaded! 12 monthly periods extracted successfully for validation.`);
    }, 1500);
  };

  // EXPENSE RECORDING HANDLER
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      triggerAlert("error", "EPM Session invalid. Please authenticate.");
      return;
    }

    if (expenseAmount <= 0) {
      triggerAlert("error", "Validation Failed: Expense amount must be a positive non-zero value.");
      return;
    }

    const token = localStorage.getItem("orcl_pbcs_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const payload = {
      departmentId: expenseDeptId,
      amount: expenseAmount,
      category: expenseCategory,
      date: expenseDate,
      description: expenseDesc,
      budgetId: expenseBudgetId || undefined,
      vendorName: expenseVendorName || undefined,
      invoiceNumber: expenseInvoiceNumber || undefined,
      invoiceUrl: expenseInvoiceUrl || undefined
    };

    try {
      const url = editingExpenseId 
        ? `/api/v1/expenses/${editingExpenseId}` 
        : "/api/v1/expenses";
      const method = editingExpenseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit expenditure transaction.");
      }

      if (data.warning) {
        triggerAlert("warning", `Committed! ${data.warning}`);
      } else {
        triggerAlert("success", editingExpenseId 
          ? `Expenditure ID [${editingExpenseId}] successfully updated.`
          : `Actual expense of $${expenseAmount.toLocaleString()} successfully registered in ledger.`
        );
      }

      clearExpenseForm();
      fetchAllData();
    } catch (err: any) {
      triggerAlert("error", err.message);
    }
  };

  const handleExpenseEdit = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpenseDeptId(exp.departmentId);
    setExpenseAmount(exp.amount);
    setExpenseCategory(exp.category);
    setExpenseDate(exp.date);
    setExpenseDesc(exp.description);
    setExpenseVendorName(exp.vendorName || "");
    setExpenseInvoiceNumber(exp.invoiceNumber || "");
    setExpenseInvoiceUrl(exp.invoiceUrl || "");
    setExpenseBudgetId(exp.budgetId || "");
    
    // Smoothly scroll form into view or focus amount
    triggerAlert("warning", `Loaded transaction details for ID: ${exp.id}`);
  };

  const handleExpenseDelete = async (expenseId: string) => {
    if (!window.confirm("Are you sure you want to retract this expenditure transaction from the General Ledger? This action is irreversible.")) {
      return;
    }

    const token = localStorage.getItem("orcl_pbcs_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/v1/expenses/${expenseId}`, {
        method: "DELETE",
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete expenditure transaction.");
      }

      triggerAlert("success", `Transaction ID [${expenseId}] successfully retracted from General Ledger.`);
      if (editingExpenseId === expenseId) {
        clearExpenseForm();
      }
      fetchAllData();
    } catch (err: any) {
      triggerAlert("error", err.message);
    }
  };

  const clearExpenseForm = () => {
    setEditingExpenseId(null);
    setExpenseAmount(0);
    setExpenseDesc("");
    setExpenseVendorName("");
    setExpenseInvoiceNumber("");
    setExpenseInvoiceUrl("");
    setExpenseBudgetId("");
  };

  const handleInvoiceUploadSimulated = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingInvoice(true);
    triggerAlert("warning", `Uploading file "${file.name}" (${(file.size / 1024).toFixed(1)} KB)...`);

    const token = localStorage.getItem("orcl_pbcs_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      // Direct REST API Call to invoice upload endpoint
      const res = await fetch("/api/v1/expenses/upload-invoice", {
        method: "POST",
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // Set digital link and info
      setExpenseInvoiceUrl(data.invoiceUrl);
      setExpenseInvoiceNumber(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
      triggerAlert("success", `Digital Invoice Copy parsed successfully! Link: ${data.invoiceUrl}`);
    } catch (err: any) {
      triggerAlert("error", `File Upload Failure: ${err.message}`);
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  // WORKFLOW APPROVAL ACTIONS
  const handleWorkflowAction = async (budgetId: string, targetStatus: BudgetStatus) => {
    if (!currentUser) {
      triggerAlert("error", "EPM session invalid. Please log in again.");
      return;
    }
    
    try {
      const token = localStorage.getItem("orcl_pbcs_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const response = await axios.post(
        "/api/v1/workflows/transition",
        {
          budgetId,
          status: targetStatus,
          comment: workflowComment
        },
        { headers }
      );

      triggerAlert("success", response.data.message || `Budget plan status successfully updated to [${targetStatus}].`);
      setWorkflowComment("");
      setSelectedWorkflowBudgetId(null);
      fetchAllData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Failed to transition budget status.";
      triggerAlert("error", errMsg);
    }
  };

  // AI PREDICTIVE FORECASTING WITH GEMINI SDK
  const handleRunForecast = async () => {
    if (!forecastDeptId) {
      triggerAlert("error", "Please select a target Department for modeling.");
      return;
    }
    
    setIsForecasting(true);
    setForecastResponse(null);

    // Calculate historical stats based on selected department to pass to API
    const deptBudgets = budgets.filter(b => b.departmentId === forecastDeptId && b.status === BudgetStatus.APPROVED);
    const totalHistoricalBudget = deptBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
    
    const deptExpenses = expenses.filter(e => e.departmentId === forecastDeptId);
    const totalHistoricalActuals = deptExpenses.reduce((sum, e) => sum + e.amount, 0);

    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: forecastDeptId,
          historicalBudget: totalHistoricalBudget || 1200000,
          historicalActuals: totalHistoricalActuals || 1050000,
          targetCategory: forecastCategory,
          growthSliderValue: forecastTargetGrowth
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Adjust forecasting model based on slider inputs if user customized
      const finalForecast = { ...data.forecast };
      if (forecastTargetGrowth !== 8) {
        const factor = (100 + forecastTargetGrowth - 8) / 100;
        finalForecast.forecastAmount = Math.round(finalForecast.forecastAmount * factor);
      }

      setForecastResponse(finalForecast);
      triggerAlert("success", `AI Modeling engine completed with confidence score of ${finalForecast.confidenceScore}%`);
    } catch (e: any) {
      triggerAlert("error", `Forecasting engine failure: ${e.message}`);
    } finally {
      setIsForecasting(false);
    }
  };

  // CHART DATA COMPILATION
  const compileDeptVarianceChartData = () => {
    return departments.map(d => {
      const approvedForDept = budgets.find(b => b.departmentId === d.id && b.fiscalYear === selectedYearFilter && b.status === BudgetStatus.APPROVED);
      const budgetLimit = approvedForDept ? approvedForDept.totalAmount : 0;
      const spent = expenses
        .filter(e => e.departmentId === d.id && e.date.startsWith(selectedYearFilter.toString()))
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        name: d.name,
        code: d.code,
        Budget: budgetLimit,
        Actual: spent,
        Remaining: Math.max(0, budgetLimit - spent)
      };
    });
  };

  const compileMonthlyTrendData = () => {
    // Map cumulative spending across months
    const trend = MONTHS.map((month, idx) => {
      const monthStr = (idx + 1).toString().padStart(2, "0");
      const monthExpenses = expenses.filter(e => {
        const matchesYear = e.date.startsWith(selectedYearFilter.toString());
        const matchesDept = selectedDeptFilter === "all" || e.departmentId === selectedDeptFilter;
        return matchesYear && matchesDept && e.date.split("-")[1] === monthStr;
      });

      const totalSpentThisMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Budget for this month (from approved plans)
      const allocatedThisMonth = budgets
        .filter(b => b.status === BudgetStatus.APPROVED && b.fiscalYear === selectedYearFilter && (selectedDeptFilter === "all" || b.departmentId === selectedDeptFilter))
        .reduce((sum, b) => sum + (b.monthlyBreakdown[month] || 0), 0);

      return {
        month,
        Budget: allocatedThisMonth,
        Actual: totalSpentThisMonth
      };
    });
    return trend;
  };

  // Render Login screen if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex flex-col items-center justify-center p-6 text-[#E1E1E1] relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C19A5B]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#16181D] border border-[#2D2F33] rounded shadow-2xl p-8 relative z-10 transition-all duration-300">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded bg-gradient-to-tr from-[#C19A5B] to-[#E5C185] flex items-center justify-center font-bold text-[#0A0B0D] text-xl shadow-lg mb-3">
              O
            </div>
            <h1 className="text-xl font-bold tracking-wider uppercase text-white">ORACLE PBCS</h1>
            <p className="text-[11px] text-[#8E9299] uppercase tracking-widest font-mono">
              Planning & Budgeting Cloud Service
            </p>
          </div>

          {/* Secure Mode Tabs */}
          <div className="flex bg-[#0A0B0D] p-1 rounded border border-[#2D2F33] mb-6">
            <button
              onClick={() => { setIsRegisterMode(false); setLoginError(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded uppercase tracking-wider transition-all duration-150 ${!isRegisterMode ? "bg-[#1C1F26] text-white border border-[#3B82F6]/30" : "text-gray-400 hover:text-white"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegisterMode(true); setLoginError(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded uppercase tracking-wider transition-all duration-150 ${isRegisterMode ? "bg-[#1C1F26] text-white border border-[#3B82F6]/30" : "text-gray-400 hover:text-white"}`}
            >
              Register Employee
            </button>
          </div>

          {!isRegisterMode ? (
            /* SIGN IN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-[#1C1F26] border border-[#2D2F33] p-4 rounded mb-2 text-xs text-[#8E9299] leading-relaxed">
                <span className="font-semibold text-white block mb-1">EPM Corporate Access Directory</span>
                Enter an active directory username below (default password: <code className="text-[#E5C185] font-mono">password123</code>):
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[10px] text-[#E5C185]">
                  <div className="cursor-pointer hover:text-white transition-colors" onClick={() => setUsernameInput("admin.orcl")}>• admin.orcl <span className="text-gray-500">(CFO)</span></div>
                  <div className="cursor-pointer hover:text-white transition-colors" onClick={() => setUsernameInput("finance.orcl")}>• finance.orcl <span className="text-gray-500">(Mgr)</span></div>
                  <div className="cursor-pointer hover:text-white transition-colors" onClick={() => setUsernameInput("it.orcl")}>• it.orcl <span className="text-gray-500">(Dept)</span></div>
                  <div className="cursor-pointer hover:text-white transition-colors" onClick={() => setUsernameInput("rd.orcl")}>• rd.orcl <span className="text-gray-500">(R&D)</span></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  Directory Username
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6] font-mono transition-all duration-150"
                  placeholder="e.g. admin.orcl"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  Secure Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2.5 text-sm text-white focus:outline-none focus:border-[#3B82F6] font-mono transition-all duration-150"
                  placeholder="Enter directory password"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">Authentication verified using real BCrypt password hashes</span>
              </div>

              {loginError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={isLoadingUser}
                className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2"
              >
                {isLoadingUser ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validating BCrypt Session...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Sign In (JWT)</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTER EMPLOYEE FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-[#1C1F26] border border-[#2D2F33] p-4 rounded mb-2 text-xs text-[#8E9299] leading-relaxed">
                <span className="font-semibold text-white block mb-1">Corporate Directory Provisioning</span>
                Onboard new personnel with hashed credentials and secure role access policies.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2 text-xs text-white focus:outline-none focus:border-[#3B82F6] font-mono"
                    placeholder="e.g. sales.orcl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                    placeholder="e.g. Diana Prince"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                  placeholder="name@enterprise.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Secure Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2 text-xs text-white focus:outline-none focus:border-[#3B82F6] font-mono"
                  placeholder="Min 6 characters"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Access Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Department Manager">Department Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    Department
                  </label>
                  <select
                    value={regDeptId}
                    onChange={(e) => setRegDeptId(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="d1">Corporate Finance</option>
                    <option value="d2">Information Technology</option>
                    <option value="d3">Research & Development</option>
                    <option value="d4">Marketing & Growth</option>
                    <option value="d5">Human Resources</option>
                  </select>
                </div>
              </div>

              {loginError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingUser}
                className="w-full py-2.5 bg-[#C19A5B] hover:bg-[#A37F43] text-[#0A0B0D] text-xs font-semibold rounded uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2"
              >
                {isLoadingUser ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Encrypting Password...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Create Hashed Credential</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center border-t border-[#2D2F33] pt-4 text-[10px] text-gray-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>SOC2 Audit Level Access Log Enabled.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0B0D] overflow-hidden text-[#E1E1E1]">
      
      {/* SIDEBAR SYSTEM COMPONENT */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP SYSTEM BAR */}
        <header className="h-14 bg-[#16181D] border-b border-[#2D2F33] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs px-2.5 py-1 bg-[#212328] border border-[#2D2F33] rounded text-[#E5C185] uppercase tracking-wider">
              FISCAL YEAR {selectedYearFilter}
            </span>
            
            {/* Quick Department Filter selector on Topbar */}
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              <select
                id="top-dept-filter"
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-[#0A0B0D] border border-[#2D2F33] text-xs text-white rounded p-1.5 focus:outline-none focus:border-[#3B82F6]"
              >
                <option value="all">All Departments (Consolidated)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Banner */}
            {alertMsg && (
              <div className={`px-4 py-1.5 rounded text-xs flex items-center gap-2 border transition-all duration-300 animate-fade-in ${
                alertMsg.type === "success" ? "bg-[#113322] border-[#225533] text-[#44FF88]" :
                alertMsg.type === "warning" ? "bg-[#332211] border-[#553311] text-[#FFBB44]" :
                "bg-[#331111] border-[#551111] text-[#FF4444]"
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{alertMsg.text}</span>
              </div>
            )}

            {/* Quick Action triggers */}
            <div className="flex items-center gap-2">
              <NotificationBell 
                currentUser={currentUser} 
                setActiveTab={setActiveTab} 
                triggerAlert={triggerAlert} 
              />

              <button 
                id="export-csv-quick"
                onClick={handleExcelExport}
                className="p-1.5 rounded bg-[#212328] border border-[#2D2F33] hover:bg-[#2D2F33] text-[#E1E1E1] text-xs flex items-center gap-1"
                title="Consolidated CSV Export"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              <label 
                className="p-1.5 rounded bg-[#212328] border border-[#2D2F33] hover:bg-[#2D2F33] text-[#E5C185] text-xs flex items-center gap-1 cursor-pointer"
                title="Import Excel Layout"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Import</span>
                <input 
                  id="import-excel-file"
                  type="file" 
                  accept=".csv,.xlsx" 
                  onChange={handleExcelImportMock} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* KPI METRIC GRID */}
          {activeTab !== "audit" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase text-[#8E9299] tracking-wider font-mono">Consolidated Budget Pool</span>
                  <h3 className="text-xl font-bold font-mono text-white mt-1">
                    ${totalBudgetPool.toLocaleString()}
                  </h3>
                </div>
                <div className="text-[11px] text-green-400 mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Approved FY{selectedYearFilter} Plan</span>
                </div>
              </div>

              <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase text-[#8E9299] tracking-wider font-mono">Actual Expenditure</span>
                  <h3 className="text-xl font-bold font-mono text-[#60A5FA] mt-1">
                    ${totalActualExpenses.toLocaleString()}
                  </h3>
                </div>
                <div className="text-[11px] text-[#8E9299] mt-2">
                  Cumulative across {getFilteredExpenses().length} logs
                </div>
              </div>

              <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase text-[#8E9299] tracking-wider font-mono">Unallocated Reserve</span>
                  <h3 className={`text-xl font-bold font-mono mt-1 ${remainingBudgetPool < 0 ? "text-red-400" : "text-emerald-400"}`}>
                    ${remainingBudgetPool.toLocaleString()}
                  </h3>
                </div>
                <div className="text-[11px] mt-2 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${budgetUtilizationRate > varianceAlertThreshold ? "bg-red-500" : "bg-emerald-500"}`}></span>
                  <span className="text-gray-400">{budgetUtilizationRate.toFixed(1)}% Pool Utilization</span>
                </div>
              </div>

              <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase text-[#8E9299] tracking-wider font-mono">Pending Workflow Actions</span>
                  <h3 className="text-xl font-bold font-mono text-[#E5C185] mt-1">
                    {pendingApprovalsCount} Plans
                  </h3>
                </div>
                <div className="text-[11px] text-gray-400 mt-2">
                  Requires attention
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              1. FINANCIAL DASHBOARD TAB (MODULE 6)
              ======================================================= */}
          {activeTab === "dashboard" && (() => {
            const hasData = dashboardMetrics !== null;
            const metrics = dashboardMetrics || {
              cards: { totalBudget: 0, totalExpense: 0, remainingBudget: 0, budgetUtilization: 0, pendingApprovals: 0, departmentCount: 0 },
              charts: { budgetVsExpense: [], monthlyTrend: [], departmentComparison: [], pieChart: [], forecastChart: [] },
              queries: { totalBudgetSQL: "", totalExpenseSQL: "", varianceByDeptSQL: "", monthlyTrendSQL: "", categoryBreakdownSQL: "" }
            };

            const PIE_COLORS = ["#3B82F6", "#E5C185", "#EF4444"];

            return (
              <div className="space-y-6">
                
                {/* Dashboard Control Panel Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#16181D] border border-[#2D2F33] rounded p-4">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-[#E5C185]" />
                      Enterprise Financial Intelligence Dashboard
                    </h2>
                    <p className="text-xs text-gray-400">
                      Oracle EPM Real-Time Controller Console • Periodical Budget-to-Actual Ledger Analysis
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-stretch md:self-auto">
                    <button
                      onClick={() => fetchDashboardMetrics(dashboardDeptFilter, dashboardYearFilter, dashboardMonthFilter)}
                      disabled={isDashboardLoading}
                      className="px-3 py-1.5 bg-[#212328] hover:bg-[#2D2F33] text-[#DCE4ED] hover:text-white border border-[#2D2F33] text-xs font-mono rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDashboardLoading ? "animate-spin" : ""}`} />
                      <span>{isDashboardLoading ? "Re-Querying..." : "Run Pipeline Query"}</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-[#212328] hover:bg-[#2D2F33] text-[#DCE4ED] hover:text-white border border-[#2D2F33] text-xs font-mono rounded flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-gray-400" />
                      <span>Print Summary</span>
                    </button>
                  </div>
                </div>

                {/* ADVANCED UNIFIED FILTERS BAR (Oracle EPM Style) */}
                <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1.5">
                      Organizational Division Unit
                    </label>
                    <div className="relative">
                      <select
                        value={dashboardDeptFilter}
                        onChange={(e) => setDashboardDeptFilter(e.target.value)}
                        className="w-full bg-[#0A0B0D] border border-[#2D2F33] text-xs text-white p-2.5 rounded focus:outline-none focus:border-[#C19A5B] appearance-none"
                      >
                        <option value="All">All Cost Centers (Consolidated)</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Fiscal Year Filter */}
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1.5">
                      Accounting Fiscal Year
                    </label>
                    <div className="relative">
                      <select
                        value={dashboardYearFilter}
                        onChange={(e) => setDashboardYearFilter(Number(e.target.value))}
                        className="w-full bg-[#0A0B0D] border border-[#2D2F33] text-xs text-white p-2.5 rounded focus:outline-none focus:border-[#C19A5B] appearance-none"
                      >
                        <option value={2026}>Fiscal Year 2026 (Operational)</option>
                        <option value={2025}>Fiscal Year 2025 (Historical Audit)</option>
                        <option value={2027}>Fiscal Year 2027 (Strategic Pipeline)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Period Filter */}
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1.5">
                      Reporting Ledger Period
                    </label>
                    <div className="relative">
                      <select
                        value={dashboardMonthFilter}
                        onChange={(e) => setDashboardMonthFilter(e.target.value)}
                        className="w-full bg-[#0A0B0D] border border-[#2D2F33] text-xs text-white p-2.5 rounded focus:outline-none focus:border-[#C19A5B] appearance-none"
                      >
                        <option value="All">All Periods (M1 - M12 Annualized)</option>
                        <option value="01">M1 - January Ledger</option>
                        <option value="02">M2 - February Ledger</option>
                        <option value="03">M3 - March Ledger</option>
                        <option value="04">M4 - April Ledger</option>
                        <option value="05">M5 - May Ledger</option>
                        <option value="06">M6 - June Ledger</option>
                        <option value="07">M7 - July Ledger</option>
                        <option value="08">M8 - August Ledger</option>
                        <option value="09">M9 - September Ledger</option>
                        <option value="10">M10 - October Ledger</option>
                        <option value="11">M11 - November Ledger</option>
                        <option value="12">M12 - December Ledger</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* HIGH-FIDELITY METRIC INDICATORS PANEL */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* Card 1: Total Approved Budget */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden group hover:border-[#C19A5B] transition-all">
                    <div className="absolute top-2 right-2 p-1.5 bg-[#1B365D]/30 rounded">
                      <Briefcase className="w-4 h-4 text-[#E5C185]" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Total Budget</span>
                    <span className="text-lg font-bold font-mono text-white mt-2 block">
                      ${metrics.cards.totalBudget.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-1">Approved Baseline</span>
                  </div>

                  {/* Card 2: Total Actual Expense */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden group hover:border-[#3B82F6] transition-all">
                    <div className="absolute top-2 right-2 p-1.5 bg-[#212328] rounded">
                      <Receipt className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Total Expense</span>
                    <span className="text-lg font-bold font-mono text-white mt-2 block">
                      ${metrics.cards.totalExpense.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-1">Committed Actuals</span>
                  </div>

                  {/* Card 3: Remaining Budget */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden group transition-all">
                    <div className="absolute top-2 right-2 p-1.5 bg-[#212328] rounded">
                      <DollarSign className={`w-4 h-4 ${metrics.cards.remainingBudget >= 0 ? "text-emerald-400" : "text-red-400"}`} />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Remaining Budget</span>
                    <span className={`text-lg font-bold font-mono mt-2 block ${metrics.cards.remainingBudget >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ${metrics.cards.remainingBudget.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {metrics.cards.remainingBudget >= 0 ? "Under Cap (Surplus)" : "Overrun Deficit"}
                    </span>
                  </div>

                  {/* Card 4: Budget Utilization */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden group transition-all">
                    <div className="absolute top-2 right-2 p-1.5 bg-[#212328] rounded">
                      <TrendingUp className="w-4 h-4 text-[#E5C185]" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Budget Util %</span>
                    <span className="text-lg font-bold font-mono text-white mt-2 block">
                      {metrics.cards.budgetUtilization.toFixed(1)}%
                    </span>
                    <div className="w-full bg-[#0A0B0D] h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${metrics.cards.budgetUtilization > 100 ? "bg-red-500 animate-pulse" : "bg-[#C19A5B]"}`}
                        style={{ width: `${Math.min(100, metrics.cards.budgetUtilization)}%` }}
                      />
                    </div>
                  </div>

                  {/* Card 5: Pending Approvals */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden group hover:border-amber-500/50 transition-all">
                    <div className="absolute top-2 right-2 p-1.5 bg-amber-500/10 rounded">
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Pending Proposals</span>
                    <span className={`text-lg font-bold font-mono mt-2 block ${metrics.cards.pendingApprovals > 0 ? "text-amber-400" : "text-white"}`}>
                      {metrics.cards.pendingApprovals}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-1">Workflows in approval queue</span>
                  </div>

                  {/* Card 6: Department Count */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden group transition-all">
                    <div className="absolute top-2 right-2 p-1.5 bg-[#212328] rounded">
                      <Building className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono block">Cost Centers</span>
                    <span className="text-lg font-bold font-mono text-white mt-2 block">
                      {metrics.cards.departmentCount}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-1">Active registered departments</span>
                  </div>
                </div>

                {/* CHARTS GRAPHIC PANEL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* CHART 1: Budget vs Actual comparison (Grouped Bar Chart) */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Budget vs Actual Ledger Comparison by Cost Center
                      </h4>
                      <span className="text-[9px] text-[#8E9299] font-mono">VALUES IN USD</span>
                    </div>
                    <div className="h-64">
                      {metrics.charts.budgetVsExpense.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-500 italic text-xs">
                          No corporate records found for selected period.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.charts.budgetVsExpense} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" />
                            <XAxis dataKey="code" stroke="#8E9299" fontSize={10} tickLine={false} />
                            <YAxis stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", color: "#E1E1E1" }}
                              formatter={(value: any) => [`$${value.toLocaleString()}`, "USD"]}
                            />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                            <Bar dataKey="Budget" fill="#202A3D" stroke="#3B82F6" strokeWidth={1} radius={[2, 2, 0, 0]} name="Baseline Approved" />
                            <Bar dataKey="Actual" fill="#3B82F6" radius={[2, 2, 0, 0]} name="Ledger Actual" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* CHART 2: Allocation Share of Categories (Pie Chart) */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Actual Expense Categorization Weight
                      </h4>
                      <div className="h-44 relative">
                        {metrics.charts.pieChart.every(item => item.value === 0) ? (
                          <div className="h-full flex items-center justify-center text-gray-500 italic text-xs text-center p-4">
                            No active expenditure registered in this period/segment.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={metrics.charts.pieChart.filter(x => x.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {metrics.charts.pieChart.filter(x => x.value > 0).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", color: "#E1E1E1" }}
                                formatter={(value: any) => [`$${value.toLocaleString()}`, "Amount"]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                    
                    {/* Pie Chart Legend Details */}
                    <div className="space-y-2 pt-2 border-t border-[#2D2F33] mt-2">
                      {metrics.charts.pieChart.map((item, index) => {
                        const total = metrics.charts.pieChart.reduce((sum, x) => sum + x.value, 0) || 1;
                        const pct = (item.value / total) * 100;
                        return (
                          <div key={item.name} className="flex justify-between items-center text-[11px] font-mono">
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                              {item.name}
                            </span>
                            <span className="text-white font-bold">
                              ${item.value.toLocaleString()} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CHART 3: Consolidated Monthly Run Rates (Area/Line Chart) */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5 lg:col-span-2">
                    <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Annual Ledger Monthly Execution Run-Rates (M1 - M12)
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.charts.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorActualDashboard" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" />
                          <XAxis dataKey="month" stroke="#8E9299" fontSize={10} tickLine={false} />
                          <YAxis stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", color: "#E1E1E1" }}
                            formatter={(value: any) => [`$${value.toLocaleString()}`, "Amount"]}
                          />
                          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                          <Area type="monotone" dataKey="Actual" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorActualDashboard)" name="Monthly Spend Actual" />
                          <Line type="monotone" dataKey="Budget" stroke="#E5C185" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Monthly Budget Target" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* CHART 4: Category Breakdown by Department (Stacked Bar Chart) */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5">
                    <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pink-500" />
                      Strategic Expenses by Cost Center (Detailed Comparison)
                    </h4>
                    <div className="h-64">
                      {metrics.charts.departmentComparison.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-500 italic text-xs">
                          No category breakdowns available.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.charts.departmentComparison} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" />
                            <XAxis dataKey="department" stroke="#8E9299" fontSize={10} tickLine={false} />
                            <YAxis stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", color: "#E1E1E1" }}
                              formatter={(value: any) => [`$${value.toLocaleString()}`, "USD"]}
                            />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 9, fontFamily: "monospace" }} />
                            <Bar dataKey="Salary" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Operations" stackId="a" fill="#E5C185" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Discretionary" stackId="a" fill="#EF4444" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* CHART 5: AI-Powered Predictive Forecasting Line Chart */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5 lg:col-span-2">
                    <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#E5C185] animate-pulse" />
                      AI Predictive Forecasting & Weighted Target Projection (Q3 - Q4)
                    </h4>
                    <p className="text-[11px] text-gray-400 mb-4">
                      Committed actuals (Jan-Jun) modeled using linear regression and exponential smoothing to forecast remaining fiscal periods.
                    </p>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.charts.forecastChart} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" />
                          <XAxis dataKey="month" stroke="#8E9299" fontSize={10} tickLine={false} />
                          <YAxis stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", color: "#E1E1E1" }}
                            formatter={(value: any) => [`$${value.toLocaleString()}`, "USD"]}
                          />
                          <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                          <Line type="monotone" dataKey="Actual" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Actual Spend" connectNulls={true} />
                          <Line type="monotone" dataKey="Forecast" stroke="#EC4899" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} name="Model Forecast Projection" />
                          <Line type="monotone" dataKey="Budget" stroke="#E5C185" strokeWidth={1} dot={false} name="Approved Target Baseline" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* EXECUTIVE SQL BLUEPRINT LOGS PANEL */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold tracking-wider text-white uppercase font-mono flex items-center gap-2 mb-2">
                        <Sliders className="w-4 h-4 text-gray-400" />
                        SOX Compliance Relational SQL Console
                      </h4>
                      <p className="text-[11px] text-gray-400 mb-4 font-mono">
                        These raw MySQL queries are compiled and executed in real-time to generate the metrics cards above.
                      </p>

                      <div className="flex gap-1 border-b border-[#2D2F33] mb-3">
                        <button
                          onClick={() => setDashboardSqlTab("budget")}
                          className={`px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider rounded-t ${dashboardSqlTab === "budget" ? "bg-[#212328] text-[#E5C185] border-t border-x border-[#2D2F33]" : "text-gray-400 hover:text-white"}`}
                        >
                          Budget
                        </button>
                        <button
                          onClick={() => setDashboardSqlTab("expense")}
                          className={`px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider rounded-t ${dashboardSqlTab === "expense" ? "bg-[#212328] text-[#E5C185] border-t border-x border-[#2D2F33]" : "text-gray-400 hover:text-white"}`}
                        >
                          Actuals
                        </button>
                        <button
                          onClick={() => setDashboardSqlTab("variance")}
                          className={`px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider rounded-t ${dashboardSqlTab === "variance" ? "bg-[#212328] text-[#E5C185] border-t border-x border-[#2D2F33]" : "text-gray-400 hover:text-white"}`}
                        >
                          Variance
                        </button>
                        <button
                          onClick={() => setDashboardSqlTab("trend")}
                          className={`px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider rounded-t ${dashboardSqlTab === "trend" ? "bg-[#212328] text-[#E5C185] border-t border-x border-[#2D2F33]" : "text-gray-400 hover:text-white"}`}
                        >
                          Trend
                        </button>
                      </div>

                      <div className="bg-[#0A0B0D] border border-[#2D2F33] rounded p-3 font-mono text-[10px] text-emerald-400 h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                        {dashboardSqlTab === "budget" && metrics.queries.totalBudgetSQL}
                        {dashboardSqlTab === "expense" && metrics.queries.totalExpenseSQL}
                        {dashboardSqlTab === "variance" && metrics.queries.varianceByDeptSQL}
                        {dashboardSqlTab === "trend" && metrics.queries.monthlyTrendSQL}
                      </div>
                    </div>
                    
                    <div className="pt-2 text-[10px] text-gray-500 font-mono text-right italic">
                      SECURE AUDITED ENGINE V1.2
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

          {/* =======================================================
              2. BUDGET PLANNING GRID (FORMS) TAB
              ======================================================= */}
          {activeTab === "budget-form" && (
            <div className="space-y-6">
              
              <div className="bg-[#16181D] border border-[#2D2F33] rounded p-6">
                <div className="flex justify-between items-center mb-4 border-b border-[#2D2F33] pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      {editingBudgetId ? "Modify Active Planning Form" : "Interactive Planning Grid Form"}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Oracle Oracle-EPM Standard Ledger. Enter monthly estimates. Dynamic calculations computed.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      id="reset-form-grid"
                      onClick={resetBudgetForm}
                      className="px-3 py-1.5 bg-[#212328] border border-[#2D2F33] text-gray-300 hover:bg-[#2D2F33] text-xs rounded transition-all"
                    >
                      Clear Grid
                    </button>
                  </div>
                </div>

                {budgetFormValidationError && (
                  <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{budgetFormValidationError}</span>
                  </div>
                )}

                <form onSubmit={(e) => handleBudgetFormSubmit(e, BudgetStatus.SUBMITTED)} className="space-y-6">
                  
                  {/* Select Department, Year */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0A0B0D] p-4 border border-[#2D2F33] rounded">
                    <div>
                      <label className="block text-[11px] text-[#8E9299] uppercase tracking-wider mb-1.5">
                        Target Department Unit
                      </label>
                      <select
                        id="form-dept-id"
                        value={formDeptId}
                        onChange={(e) => setFormDeptId(e.target.value)}
                        className="w-full bg-[#16181D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6]"
                      >
                        <option value="">Select Target Org Unit...</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#8E9299] uppercase tracking-wider mb-1.5">
                        Fiscal Year Target
                      </label>
                      <select
                        id="form-year"
                        value={formYear}
                        onChange={(e) => setFormYear(Number(e.target.value))}
                        className="w-full bg-[#16181D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6] font-mono"
                      >
                        <option value={2026}>FY2026 (Active Period)</option>
                        <option value={2027}>FY2027 (Pre-Planning)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Live Summed Allocation</span>
                        <h2 className="text-xl font-bold font-mono text-[#E5C185] mt-1">
                          ${(Object.values(formMonthlyBreakdown) as number[]).reduce((s, v) => s + v, 0).toLocaleString()}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Month Spread Grid (PBCS Mock Spread Table) */}
                  <div>
                    <h4 className="text-xs font-semibold tracking-wider text-[#E5C185] uppercase font-mono mb-3">
                      Monthly Spread Table Grid
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {MONTHS.map((month) => (
                        <div key={month} className="bg-[#1C1F26] border border-[#2D2F33] rounded p-2.5">
                          <label className="block text-[10px] font-semibold text-gray-400 font-mono uppercase tracking-wider mb-1">
                            {month} Period
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5 text-xs text-gray-500">$</span>
                            <input
                              id={`input-month-${month}`}
                              type="number"
                              required
                              min="0"
                              value={formMonthlyBreakdown[month] || 0}
                              onChange={(e) => handleMonthlyChange(month, Math.max(0, Number(e.target.value)))}
                              className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-1.5 pl-5 text-xs font-mono text-white text-right focus:outline-none focus:border-[#3B82F6]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category allocation list */}
                  <div className="border-t border-[#2D2F33] pt-4">
                    <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono mb-3">
                      Strategic Line-Item Distribution (Calculated automatically)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {Object.entries(formCategoryBreakdown).map(([cat, val]) => (
                        <div key={cat} className="bg-[#1C1F26] border border-[#2D2F33] rounded p-3 text-xs">
                          <span className="text-gray-400 block font-mono truncate">{cat}</span>
                          <span className="text-[#60A5FA] font-bold font-mono text-sm block mt-1">
                            ${val.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warning if Department already has plan */}
                  {formDeptId && budgets.some(b => b.departmentId === formDeptId && b.fiscalYear === formYear && b.id !== editingBudgetId) && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-[#E5C185] rounded text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Overwriting Notice:</span> An approved or submitted budget plan already exists for this department in {formYear}. Submitting this form will replace the existing record once validated.
                      </div>
                    </div>
                  )}

                  {/* Submission and Saving Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t border-[#2D2F33]">
                    <button
                      id="save-draft-btn"
                      type="button"
                      onClick={(e) => handleBudgetFormSubmit(e, BudgetStatus.DRAFT)}
                      className="px-4 py-2 bg-[#212328] border border-[#2D2F33] hover:bg-[#2D2F33] text-gray-300 text-xs font-semibold rounded uppercase tracking-wider"
                    >
                      Save Draft Version
                    </button>
                    <button
                      id="submit-workflow-btn"
                      type="submit"
                      className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Submit to EPM Workflow</span>
                    </button>
                  </div>

                </form>
              </div>

              {/* Editable lists */}
              <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5">
                <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono mb-4">
                  Existing Budget Plans (Select to Load into Grid)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[11px]">
                        <th className="pb-2">ID</th>
                        <th className="pb-2">Department</th>
                        <th className="pb-2">Year</th>
                        <th className="pb-2 text-right">Total Limit</th>
                        <th className="pb-2 text-center">Current Status</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#212328]">
                      {budgets.map((b) => {
                        const deptName = departments.find(d => d.id === b.departmentId)?.name || b.departmentId;
                        return (
                          <tr key={b.id} className="hover:bg-[#1C1F26]">
                            <td className="py-2.5 font-mono text-gray-400">{b.id}</td>
                            <td className="py-2.5 text-white font-medium">{deptName}</td>
                            <td className="py-2.5 font-mono">{b.fiscalYear}</td>
                            <td className="py-2.5 font-mono text-right text-[#E5C185]">${b.totalAmount.toLocaleString()}</td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                b.status === BudgetStatus.APPROVED ? "bg-green-950 text-green-400" :
                                b.status === BudgetStatus.SUBMITTED ? "bg-amber-950 text-amber-400" :
                                b.status === BudgetStatus.REJECTED ? "bg-red-950 text-red-400" :
                                "bg-gray-900 text-gray-400"
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                id={`edit-budget-row-${b.id}`}
                                onClick={() => loadBudgetIntoForm(b)}
                                className="text-[#3B82F6] hover:underline text-xs"
                              >
                                Edit / Distribute
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* =======================================================
              3. WORKFLOWS & APPROVALS TAB
              ======================================================= */}
          {activeTab === "approvals" && (
            <div className="space-y-6">
              
              {/* Top Workflow Analytics metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#16181D] border border-[#2D2F33] p-4 rounded relative overflow-hidden">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-mono">Pending Decisions</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-amber-500">
                      {budgets.filter(b => b.status === BudgetStatus.SUBMITTED || b.status === BudgetStatus.UNDER_REVIEW).length}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">spreadsheets</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-1">
                    Est. total: <span className="text-amber-400 font-semibold">${budgets.filter(b => b.status === BudgetStatus.SUBMITTED || b.status === BudgetStatus.UNDER_REVIEW).reduce((acc, b) => acc + b.totalAmount, 0).toLocaleString()}</span>
                  </div>
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>

                <div className="bg-[#16181D] border border-[#2D2F33] p-4 rounded">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-mono">Approved Baseline</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-green-500">
                      {budgets.filter(b => b.status === BudgetStatus.APPROVED).length}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">baselines</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-1">
                    Total budget: <span className="text-green-400 font-semibold">${budgets.filter(b => b.status === BudgetStatus.APPROVED).reduce((acc, b) => acc + b.totalAmount, 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-[#16181D] border border-[#2D2F33] p-4 rounded">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-mono">Rejected / Returned</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-red-500">
                      {budgets.filter(b => b.status === BudgetStatus.REJECTED).length}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">plans</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-1">
                    Returned volume: <span className="text-red-400 font-semibold">${budgets.filter(b => b.status === BudgetStatus.REJECTED).reduce((acc, b) => acc + b.totalAmount, 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-[#16181D] border border-[#2D2F33] p-4 rounded flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-mono">Authorized Approvers</span>
                    <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5 font-mono">
                      <Shield className="w-3.5 h-3.5 text-[#E5C185]" />
                      {currentUser?.role || "Corporate Member"}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#E5C185] font-mono mt-2">
                    Scope: {currentUser?.role === UserRole.ADMIN ? "Global Override" : currentUser?.role === UserRole.FINANCE_MANAGER ? "Financial Baselines" : "Departmental Review"}
                  </div>
                </div>
              </div>

              {/* Main workflow dashboard panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Tables / Lists (Col span 2) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded overflow-hidden">
                    
                    {/* Inner tab switcher */}
                    <div className="flex border-b border-[#2D2F33] bg-[#0A0B0D] p-1">
                      <button
                        onClick={() => { setApprovalTab("pending"); setSelectedWorkflowBudgetId(null); }}
                        className={`flex-1 py-2 text-xs font-semibold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded ${
                          approvalTab === "pending"
                            ? "bg-[#1C1F26] text-amber-500 border-b-2 border-amber-500 font-bold"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Pending Approvals ({budgets.filter(b => b.status === BudgetStatus.SUBMITTED || b.status === BudgetStatus.UNDER_REVIEW).length})
                      </button>
                      <button
                        onClick={() => { setApprovalTab("approved"); setSelectedWorkflowBudgetId(null); }}
                        className={`flex-1 py-2 text-xs font-semibold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded ${
                          approvalTab === "approved"
                            ? "bg-[#1C1F26] text-green-500 border-b-2 border-green-500 font-bold"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Approved Baseline ({budgets.filter(b => b.status === BudgetStatus.APPROVED).length})
                      </button>
                      <button
                        onClick={() => { setApprovalTab("rejected"); setSelectedWorkflowBudgetId(null); }}
                        className={`flex-1 py-2 text-xs font-semibold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded ${
                          approvalTab === "rejected"
                            ? "bg-[#1C1F26] text-red-500 border-b-2 border-red-500 font-bold"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Rejected / Returned ({budgets.filter(b => b.status === BudgetStatus.REJECTED).length})
                      </button>
                    </div>

                    <div className="p-4 bg-[#16181D]">
                      
                      {/* 1. Pending table */}
                      {approvalTab === "pending" && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase">
                                <th className="pb-3 pl-2">Department / Cost Unit</th>
                                <th className="pb-3">Financial Year</th>
                                <th className="pb-3">Monthly Run-rate</th>
                                <th className="pb-3 text-right pr-2">Proposed Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {budgets.filter(b => b.status === BudgetStatus.SUBMITTED || b.status === BudgetStatus.UNDER_REVIEW).length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                                    No pending budget approval spreadsheets. All clear.
                                  </td>
                                </tr>
                              ) : (
                                budgets.filter(b => b.status === BudgetStatus.SUBMITTED || b.status === BudgetStatus.UNDER_REVIEW).map(b => {
                                  const dept = departments.find(d => d.id === b.departmentId);
                                  const isSelected = selectedWorkflowBudgetId === b.id;
                                  return (
                                    <tr
                                      key={b.id}
                                      onClick={() => setSelectedWorkflowBudgetId(b.id)}
                                      className={`border-b border-[#2D2F33]/50 cursor-pointer transition-all hover:bg-[#1C1F26]/60 ${
                                        isSelected ? "bg-[#1C1F26] border-l-2 border-amber-500 pl-1" : ""
                                      }`}
                                    >
                                      <td className="py-3 pl-2 font-semibold text-white">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-1.5 h-1.5 rounded-full ${b.status === BudgetStatus.UNDER_REVIEW ? "bg-amber-400" : "bg-blue-400"}`} />
                                          <div>
                                            <p>{dept?.name || b.departmentId}</p>
                                            <span className="text-[10px] text-gray-500 font-mono">{dept?.code}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 font-mono text-gray-300">FY{b.fiscalYear}</td>
                                      <td className="py-3 text-gray-400 font-mono">
                                        Avg: ${Math.round(b.totalAmount / 12).toLocaleString()}/mo
                                      </td>
                                      <td className="py-3 text-right font-mono font-semibold text-[#E5C185] pr-2">
                                        ${b.totalAmount.toLocaleString()}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 2. Approved Baseline table */}
                      {approvalTab === "approved" && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase">
                                <th className="pb-3 pl-2">Department / Cost Unit</th>
                                <th className="pb-3">Financial Year</th>
                                <th className="pb-3">Approved Timeline</th>
                                <th className="pb-3 text-right pr-2">Total Baseline</th>
                              </tr>
                            </thead>
                            <tbody>
                              {budgets.filter(b => b.status === BudgetStatus.APPROVED).length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                                    No baseline approved budgets for this period.
                                  </td>
                                </tr>
                              ) : (
                                budgets.filter(b => b.status === BudgetStatus.APPROVED).map(b => {
                                  const dept = departments.find(d => d.id === b.departmentId);
                                  const isSelected = selectedWorkflowBudgetId === b.id;
                                  return (
                                    <tr
                                      key={b.id}
                                      onClick={() => setSelectedWorkflowBudgetId(b.id)}
                                      className={`border-b border-[#2D2F33]/50 cursor-pointer transition-all hover:bg-[#1C1F26]/60 ${
                                        isSelected ? "bg-[#1C1F26] border-l-2 border-green-500 pl-1" : ""
                                      }`}
                                    >
                                      <td className="py-3 pl-2 font-semibold text-white">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                          <div>
                                            <p>{dept?.name || b.departmentId}</p>
                                            <span className="text-[10px] text-gray-500 font-mono">{dept?.code}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 font-mono text-gray-300">FY{b.fiscalYear}</td>
                                      <td className="py-3 text-gray-400 font-mono">
                                        Authorized: {b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : "Baseline"}
                                      </td>
                                      <td className="py-3 text-right font-mono font-semibold text-green-400 pr-2">
                                        ${b.totalAmount.toLocaleString()}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 3. Rejected / Returned table */}
                      {approvalTab === "rejected" && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-[#2D2F33] text-gray-400 font-mono text-[10px] uppercase">
                                <th className="pb-3 pl-2">Department / Cost Unit</th>
                                <th className="pb-3">Financial Year</th>
                                <th className="pb-3">Return feedback / comments</th>
                                <th className="pb-3 text-right pr-2">Total Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {budgets.filter(b => b.status === BudgetStatus.REJECTED).length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-500 italic">
                                    No rejected or returned proposals found.
                                  </td>
                                </tr>
                              ) : (
                                budgets.filter(b => b.status === BudgetStatus.REJECTED).map(b => {
                                  const dept = departments.find(d => d.id === b.departmentId);
                                  const isSelected = selectedWorkflowBudgetId === b.id;
                                  return (
                                    <tr
                                      key={b.id}
                                      onClick={() => setSelectedWorkflowBudgetId(b.id)}
                                      className={`border-b border-[#2D2F33]/50 cursor-pointer transition-all hover:bg-[#1C1F26]/60 ${
                                        isSelected ? "bg-[#1C1F26] border-l-2 border-red-500 pl-1" : ""
                                      }`}
                                    >
                                      <td className="py-3 pl-2 font-semibold text-white">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                          <div>
                                            <p>{dept?.name || b.departmentId}</p>
                                            <span className="text-[10px] text-gray-500 font-mono">{dept?.code}</span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 font-mono text-gray-300">FY{b.fiscalYear}</td>
                                      <td className="py-3 text-red-400/80 truncate max-w-[150px] italic">
                                        "{b.rejectionReason || "Strategic variance mismatch"}"
                                      </td>
                                      <td className="py-3 text-right font-mono font-semibold text-red-400 pr-2">
                                        ${b.totalAmount.toLocaleString()}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Monthly Run-rate break-down for selected budget */}
                  {selectedWorkflowBudgetId && (
                    <div className="bg-[#16181D] border border-[#2D2F33] p-5 rounded">
                      <h4 className="text-xs font-bold tracking-wider text-white uppercase font-mono mb-4 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-[#E5C185]" />
                        Monthly Run-Rate Values: {departments.find(d => d.id === budgets.find(b => b.id === selectedWorkflowBudgetId)?.departmentId)?.name} (FY{budgets.find(b => b.id === selectedWorkflowBudgetId)?.fiscalYear})
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {MONTHS.map(m => {
                          const budget = budgets.find(b => b.id === selectedWorkflowBudgetId);
                          const val = budget?.monthlyBreakdown[m] || 0;
                          return (
                            <div key={m} className="bg-[#0A0B0D] border border-[#2D2F33] p-2.5 rounded text-center">
                              <span className="text-[9px] text-gray-400 uppercase block font-mono font-semibold">{m}</span>
                              <span className="text-xs font-bold font-mono text-white mt-1 block">${val.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side: EPM Decision desk, comments & Status Timeline */}
                <div className="space-y-4">
                  
                  {/* Decision desk Card */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold tracking-wider text-[#E5C185] uppercase font-mono mb-4 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-[#E5C185]" />
                        Workflow Decision Desk
                      </h4>

                      {selectedWorkflowBudgetId ? (
                        <div className="space-y-4">
                          <div className="p-3 bg-[#0A0B0D] rounded border border-[#2D2F33] text-xs space-y-1">
                            <p className="text-gray-400">Reviewing Cost Unit:</p>
                            <p className="text-white font-bold text-sm">
                              {departments.find(d => d.id === budgets.find(b => b.id === selectedWorkflowBudgetId)?.departmentId)?.name}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono mt-1">
                              FY{budgets.find(b => b.id === selectedWorkflowBudgetId)?.fiscalYear} • Total Proposed: <span className="text-[#E5C185] font-semibold">${budgets.find(b => b.id === selectedWorkflowBudgetId)?.totalAmount.toLocaleString()}</span>
                            </p>
                          </div>

                          {/* STATUS TIMELINE */}
                          <div className="border-t border-[#2D2F33] pt-3">
                            <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-2">Status Timeline Progression</p>
                            <div className="space-y-3 pl-2.5 relative border-l border-[#2D2F33] ml-2">
                              {/* Step 1 */}
                              <div className="relative">
                                <div className="absolute -left-[14px] top-1 w-2 h-2 rounded-full bg-green-500" />
                                <div className="text-[11px]">
                                  <p className="text-white font-semibold">1. Employee Initiated</p>
                                  <p className="text-[10px] text-gray-500 font-mono">Status: Saved & Compiled</p>
                                </div>
                              </div>
                              {/* Step 2 */}
                              <div className="relative">
                                <div className={`absolute -left-[14px] top-1 w-2 h-2 rounded-full ${
                                  budgets.find(b => b.id === selectedWorkflowBudgetId)?.status !== BudgetStatus.DRAFT &&
                                  budgets.find(b => b.id === selectedWorkflowBudgetId)?.status !== BudgetStatus.SUBMITTED
                                    ? "bg-green-500"
                                    : "bg-amber-500"
                                }`} />
                                <div className="text-[11px]">
                                  <p className="text-white font-semibold">2. Departmental Review</p>
                                  <p className="text-[10px] text-gray-500 font-mono">
                                    {budgets.find(b => b.id === selectedWorkflowBudgetId)?.status === BudgetStatus.DRAFT ||
                                     budgets.find(b => b.id === selectedWorkflowBudgetId)?.status === BudgetStatus.SUBMITTED
                                      ? "Status: Pending Review"
                                      : "Status: Under Review"
                                    }
                                  </p>
                                </div>
                              </div>
                              {/* Step 3 */}
                              <div className="relative">
                                <div className={`absolute -left-[14px] top-1 w-2 h-2 rounded-full ${
                                  budgets.find(b => b.id === selectedWorkflowBudgetId)?.status === BudgetStatus.APPROVED
                                    ? "bg-green-500"
                                    : budgets.find(b => b.id === selectedWorkflowBudgetId)?.status === BudgetStatus.REJECTED
                                    ? "bg-red-500"
                                    : "bg-gray-600"
                                }`} />
                                <div className="text-[11px]">
                                  <p className="text-white font-semibold">3. Baseline Authorized</p>
                                  <p className="text-[10px] text-gray-500 font-mono">
                                    Current Status: <span className="font-bold">{budgets.find(b => b.id === selectedWorkflowBudgetId)?.status}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-mono font-bold text-gray-400 tracking-wider mb-2">
                              Strategic Comments / Action Feedback
                            </label>
                            <textarea
                              id="workflow-feedback-comment"
                              rows={3}
                              value={workflowComment}
                              onChange={(e) => setWorkflowComment(e.target.value)}
                              className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded text-xs p-2.5 text-white focus:outline-none focus:border-[#3B82F6]"
                              placeholder="Describe strategic evaluation or why return was initiated..."
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                id="workflow-reject-btn"
                                onClick={() => handleWorkflowAction(selectedWorkflowBudgetId, BudgetStatus.REJECTED)}
                                className="py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 text-xs font-semibold rounded uppercase tracking-wider transition-all"
                              >
                                Reject Plan
                              </button>
                              <button
                                id="workflow-approve-btn"
                                onClick={() => handleWorkflowAction(selectedWorkflowBudgetId, BudgetStatus.APPROVED)}
                                className="py-2 bg-green-950/40 hover:bg-green-900/60 text-green-400 border border-green-900/40 text-xs font-semibold rounded uppercase tracking-wider transition-all"
                              >
                                Approve Baseline
                              </button>
                            </div>
                            <button
                              onClick={() => handleWorkflowAction(selectedWorkflowBudgetId, BudgetStatus.UNDER_REVIEW)}
                              className="w-full py-1.5 bg-[#212328] hover:bg-[#2D2F33] text-gray-300 border border-[#2D2F33] text-xs font-semibold rounded uppercase tracking-wider transition-all"
                            >
                              Mark Under Review
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-xs text-gray-500 flex flex-col items-center gap-2">
                          <HelpCircle className="w-8 h-8 text-gray-600" />
                          <span>Select any active budget proposal from the left tabs to start executive evaluations.</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#2D2F33] mt-6 text-[10px] text-gray-400 leading-relaxed font-mono">
                      <span className="text-[#E5C185] font-semibold">Regulatory Governance:</span> Budgets marked as baselines are locked and instantly feed into standard actual variance alerts.
                    </div>
                  </div>

                  {/* History timelines specific to budget */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4">
                    <h5 className="text-[11px] font-bold tracking-wider text-white uppercase font-mono mb-3">
                      Selected Proposal Logs & Comments
                    </h5>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {!selectedWorkflowBudgetId ? (
                        <p className="text-[11px] text-gray-500 italic">Select a budget to see historical audits.</p>
                      ) : workflowLogs.filter(log => log.budgetId === selectedWorkflowBudgetId).length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic">No previous transition feedback captured for this sheet.</p>
                      ) : (
                        workflowLogs
                          .filter(log => log.budgetId === selectedWorkflowBudgetId)
                          .map(log => (
                            <div key={log.id} className="bg-[#0A0B0D] p-2 border border-[#2D2F33] rounded text-[11px]">
                              <div className="flex justify-between text-gray-400 text-[10px] font-mono">
                                <span>{log.changedBy}</span>
                                <span>{new Date(log.changedAt).toLocaleDateString()}</span>
                              </div>
                              <p className="mt-1 text-white font-medium">
                                {log.fromStatus} ➔ <span className={log.toStatus === BudgetStatus.APPROVED ? "text-green-400" : log.toStatus === BudgetStatus.REJECTED ? "text-red-400" : "text-amber-400"}>{log.toStatus}</span>
                              </p>
                              {log.comment && (
                                <p className="mt-1 bg-[#16181D] p-1.5 rounded italic text-gray-300">
                                  "{log.comment}"
                                </p>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* General historic workflow pipeline feed */}
              <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5">
                <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono mb-4 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#E5C185]" />
                  Global EPM Workflow State Logs
                </h4>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                  {workflowLogs.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500 italic">No general workflow state updates stored.</div>
                  ) : (
                    workflowLogs.map((log) => (
                      <div key={log.id} className="bg-[#0A0B0D] border border-[#2D2F33] rounded p-3 text-xs flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span className="font-mono text-gray-400 text-[10px]">{new Date(log.changedAt).toLocaleString()}</span>
                          </div>
                          <p className="mt-1 text-white font-semibold">
                            Budget allocation {log.budgetId}: <span className="text-amber-500">{log.fromStatus}</span> ➔ <span className="text-green-400">{log.toStatus}</span>
                          </p>
                          {log.comment && (
                            <p className="mt-1 text-gray-400 bg-[#16181D] p-2 rounded italic text-[11px]">
                              "{log.comment}"
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-[#212328] px-2 py-0.5 rounded text-gray-400">
                          {log.changedBy}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}


          {/* =======================================================
              4. ACTUAL EXPENSES MANAGEMENT TAB
              ======================================================= */}
          {activeTab === "expenses" && (() => {
            // Live Interactive Calculations for the Form Warnings
            const selectedYear = new Date(expenseDate).getFullYear() || 2026;
            const activeBudget = budgets.find(
              b => b.departmentId === expenseDeptId && b.fiscalYear === selectedYear && b.status === BudgetStatus.APPROVED
            );
            
            let budgetWarningMessage = "";
            let isNegativeAmount = expenseAmount < 0;
            let budgetCap = 0;
            let totalSpentSoFar = 0;
            let remainingBudget = 0;
            let currentCategorySpent = 0;
            let categoryLimit = 0;

            if (activeBudget) {
              categoryLimit = activeBudget.categoryBreakdown[expenseCategory] || 0;
              currentCategorySpent = expenses
                .filter(e => e.departmentId === expenseDeptId && e.category === expenseCategory && e.id !== editingExpenseId && new Date(e.date).getFullYear() === selectedYear)
                .reduce((sum, e) => sum + e.amount, 0);

              budgetCap = activeBudget.totalAmount;
              totalSpentSoFar = expenses
                .filter(e => e.departmentId === expenseDeptId && e.id !== editingExpenseId && new Date(e.date).getFullYear() === selectedYear)
                .reduce((sum, e) => sum + e.amount, 0);

              remainingBudget = budgetCap - totalSpentSoFar;

              if (categoryLimit > 0 && currentCategorySpent + expenseAmount > categoryLimit) {
                budgetWarningMessage = `Category Breach Warning: Strategic limit for ${expenseCategory} is $${categoryLimit.toLocaleString()}. This transaction pushes actuals to $${(currentCategorySpent + expenseAmount).toLocaleString()} (Limit exceeded by $${(currentCategorySpent + expenseAmount - categoryLimit).toLocaleString()}).`;
              } else if (categoryLimit > 0 && currentCategorySpent + expenseAmount > categoryLimit * 0.9) {
                budgetWarningMessage = `High Category Utilization Alert: Spending for ${expenseCategory} will reach ${((currentCategorySpent + expenseAmount) / categoryLimit * 100).toFixed(0)}% of the strategic limit.`;
              } else if (totalSpentSoFar + expenseAmount > budgetCap) {
                budgetWarningMessage = `Department Level Overrun Alarm: Combined departmental actuals will reach $${(totalSpentSoFar + expenseAmount).toLocaleString()}, exceeding the approved annual baseline limit of $${budgetCap.toLocaleString()}.`;
              }
            } else if (expenseDeptId) {
              budgetWarningMessage = `Baseline Check Notice: There is no approved annual budget plan configured for this division in FY${selectedYear}. All registered expenditures are classified as un-allocated operational costs.`;
            }

            // Calculation of Dashboard Metrics
            const filteredExpensesForTab = getFilteredExpenses();
            const totalTabActualSpend = filteredExpensesForTab.reduce((sum, e) => sum + e.amount, 0);
            
            // Category Wise Spending Aggregations
            const spendByCategoryMap: Record<string, number> = {};
            filteredExpensesForTab.forEach(e => {
              spendByCategoryMap[e.category] = (spendByCategoryMap[e.category] || 0) + e.amount;
            });
            const topCategory = Object.entries(spendByCategoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

            // Count budget overruns in filtered set
            let breachCount = 0;
            departments.forEach(d => {
              const b = budgets.find(x => x.departmentId === d.id && x.fiscalYear === selectedYearFilter && x.status === BudgetStatus.APPROVED);
              if (b) {
                const totalSpent = expenses
                  .filter(e => e.departmentId === d.id && new Date(e.date).getFullYear() === selectedYearFilter)
                  .reduce((sum, e) => sum + e.amount, 0);
                if (totalSpent > b.totalAmount) breachCount++;
              }
            });

            return (
              <div className="space-y-6">
                
                {/* 1. PROFESSIONAL ANALYTICS DASHBOARD CARD ROW */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest block">Total Committed Spend (YTD)</span>
                      <span className="text-xl font-bold font-mono text-white mt-1 block">
                        ${totalTabActualSpend.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 font-mono">
                      Across <span className="text-emerald-400 font-semibold">{filteredExpensesForTab.length}</span> matching lines
                    </div>
                  </div>

                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest block">Top Spending Category</span>
                      <span className="text-base font-bold text-[#E5C185] mt-1 block truncate">
                        {topCategory}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 font-mono">
                      Sum: <span className="text-white">${(spendByCategoryMap[topCategory] || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest block">Active Warning Overruns</span>
                      <span className={`text-xl font-bold font-mono mt-1 block ${breachCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {breachCount} {breachCount > 0 ? "Breaches" : "Safe"}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 font-mono">
                      FY{selectedYearFilter} department baselines checked
                    </div>
                  </div>

                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-mono tracking-widest block">Average Ticket Cost</span>
                      <span className="text-xl font-bold font-mono text-white mt-1 block">
                        ${filteredExpensesForTab.length > 0 
                          ? Math.round(totalTabActualSpend / filteredExpensesForTab.length).toLocaleString() 
                          : "0"}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 font-mono">
                      Standard transaction unit cost
                    </div>
                  </div>
                </div>

                {/* 2. LIVE BUDGET UTILIZATION BARS */}
                <div className="bg-[#16181D] border border-[#2D2F33] rounded p-5">
                  <h4 className="text-xs font-bold tracking-wider text-white uppercase font-mono mb-4 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Real-Time Division Budget Consumption progress
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {departments.map(dept => {
                      const deptBudget = budgets.find(b => b.departmentId === dept.id && b.fiscalYear === selectedYearFilter && b.status === BudgetStatus.APPROVED);
                      const deptSpent = expenses
                        .filter(e => e.departmentId === dept.id && new Date(e.date).getFullYear() === selectedYearFilter)
                        .reduce((sum, e) => sum + e.amount, 0);

                      const limitAmount = deptBudget ? deptBudget.totalAmount : 0;
                      const percent = limitAmount > 0 ? (deptSpent / limitAmount) * 100 : 0;

                      let barColor = "bg-blue-500";
                      let textColor = "text-blue-400";
                      if (percent > 100) {
                        barColor = "bg-red-500 animate-pulse";
                        textColor = "text-red-400";
                      } else if (percent > varianceAlertThreshold) {
                        barColor = "bg-amber-500";
                        textColor = "text-amber-400";
                      }

                      return (
                        <div key={dept.id} className="bg-[#0A0B0D] border border-[#2D2F33] rounded p-3.5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold text-white">{dept.code} - {dept.name}</span>
                            <span className={`text-[11px] font-mono font-bold ${textColor}`}>
                              {percent.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-[#1A1C20] rounded-full h-2 overflow-hidden mb-2">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, percent)}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                            <span>Spent: ${deptSpent.toLocaleString()}</span>
                            <span>Limit: {limitAmount > 0 ? `$${limitAmount.toLocaleString()}` : "N/A"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. GRID OF FORM & FILTERABLE TABLE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Form to Record/Edit expenditure */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-6 h-fit sticky top-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        {editingExpenseId ? "✏️ Edit Ledger Transaction" : "Record Ledger Transaction"}
                      </h3>
                      {editingExpenseId && (
                        <button 
                          onClick={clearExpenseForm}
                          className="text-[10px] text-[#3B82F6] hover:underline font-mono"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-5">
                      Log strategic departmental spending. Numbers are validated against Oracle PBCS baseline caps instantly.
                    </p>

                    <form onSubmit={handleExpenseSubmit} className="space-y-4">
                      
                      {/* Department Select */}
                      <div>
                        <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                          Paying Division (Department) *
                        </label>
                        <select
                          id="expense-dept-id"
                          required
                          value={expenseDeptId}
                          onChange={(e) => {
                            setExpenseDeptId(e.target.value);
                            // Auto Link Budget if there is only 1 approved budget
                            const approvedOpts = budgets.filter(b => b.departmentId === e.target.value && b.status === BudgetStatus.APPROVED);
                            if (approvedOpts.length === 1) {
                              setExpenseBudgetId(approvedOpts[0].id);
                            } else {
                              setExpenseBudgetId("");
                            }
                          }}
                          className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6]"
                        >
                          <option value="">Select Paying Org Unit...</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Budget Link */}
                      <div>
                        <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                          Associated Approved Budget Plan
                        </label>
                        <select
                          value={expenseBudgetId}
                          onChange={(e) => setExpenseBudgetId(e.target.value)}
                          className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6] font-mono text-[11px]"
                        >
                          <option value="">No explicit plan link (Un-allocated)</option>
                          {budgets
                            .filter(b => b.departmentId === expenseDeptId && b.status === BudgetStatus.APPROVED)
                            .map(b => (
                              <option key={b.id} value={b.id}>
                                FY{b.fiscalYear} APPROVED BASELINE (${b.totalAmount.toLocaleString()})
                              </option>
                            ))
                          }
                        </select>
                      </div>

                      {/* Amount to Record */}
                      <div>
                        <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                          Expenditure Amount (USD) *
                        </label>
                        <input
                          id="expense-amount"
                          type="number"
                          required
                          value={expenseAmount || ""}
                          onChange={(e) => setExpenseAmount(Number(e.target.value))}
                          className={`w-full bg-[#0A0B0D] border ${isNegativeAmount ? "border-red-500 focus:border-red-500" : "border-[#2D2F33] focus:border-[#3B82F6]"} rounded text-xs text-white p-2.5 focus:outline-none font-mono`}
                          placeholder="e.g. 15000"
                        />
                      </div>

                      {/* Strategic Category */}
                      <div>
                        <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                          Strategic Expense Category *
                        </label>
                        <select
                          id="expense-category"
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6]"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Vendor & Invoice */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                            Vendor Name
                          </label>
                          <input
                            type="text"
                            value={expenseVendorName}
                            onChange={(e) => setExpenseVendorName(e.target.value)}
                            className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6]"
                            placeholder="e.g. Oracle Inc"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                            Invoice Number
                          </label>
                          <input
                            type="text"
                            value={expenseInvoiceNumber}
                            onChange={(e) => setExpenseInvoiceNumber(e.target.value)}
                            className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6] font-mono text-[11px]"
                            placeholder="INV-90812"
                          />
                        </div>
                      </div>

                      {/* Transaction Date */}
                      <div>
                        <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                          Date of Transaction *
                        </label>
                        <input
                          id="expense-date"
                          type="date"
                          required
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6] font-mono"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                          Line Item Description *
                        </label>
                        <input
                          id="expense-description"
                          type="text"
                          required
                          value={expenseDesc}
                          onChange={(e) => setExpenseDesc(e.target.value)}
                          className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6]"
                          placeholder="e.g. Server hosting & software licenses"
                        />
                      </div>

                      {/* Upload Invoice */}
                      <div>
                        <label className="block text-[10px] text-[#8E9299] uppercase tracking-wider mb-1 font-mono">
                          Upload Invoice Document (Drag-and-Drop)
                        </label>
                        <div 
                          className="border border-dashed border-[#2D2F33] hover:border-[#3B82F6] rounded p-4 bg-[#0A0B0D] text-center cursor-pointer transition-colors relative"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                              const syntheticEvent = { target: { files: [file] } } as any;
                              handleInvoiceUploadSimulated(syntheticEvent);
                            }
                          }}
                        >
                          <input 
                            type="file" 
                            accept=".pdf,image/*,.docx,.xlsx"
                            onChange={handleInvoiceUploadSimulated}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            disabled={isUploadingInvoice}
                          />
                          <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                          <span className="text-[11px] text-gray-400 block">
                            {isUploadingInvoice ? "Processing file..." : "Click or drop file to attach copy"}
                          </span>
                          <span className="text-[9px] text-gray-500 block mt-0.5">PDF, PNG, JPG accepted</span>
                        </div>

                        {expenseInvoiceUrl && (
                          <div className="mt-2 bg-[#1A1D24] p-2 border border-[#2D2F33] rounded flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 truncate">
                              <FileText className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-gray-300 font-mono text-[11px] truncate">
                                {expenseInvoiceNumber || "Invoice Attached"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setExpenseInvoiceUrl("");
                                setExpenseInvoiceNumber("");
                              }}
                              className="text-red-400 hover:text-red-300 text-[10px] font-mono font-bold"
                            >
                              REMOVE
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Live Dynamic Budget Warning Notice */}
                      {isNegativeAmount && (
                        <div className="bg-red-950/40 border border-red-900 rounded p-3 text-red-400 text-[11px] leading-relaxed flex gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Validation Violation</span>: Corporate actual expenditures cannot be negative. Please enter a valid payment amount.
                          </div>
                        </div>
                      )}

                      {!isNegativeAmount && budgetWarningMessage && (
                        <div className="bg-[#1C150D] border border-[#DE9E35]/40 rounded p-3 text-[#DE9E35] text-[11px] leading-relaxed flex gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Oracle Baseline Warning</span>: {budgetWarningMessage}
                          </div>
                        </div>
                      )}

                      {/* Form Actions */}
                      <button
                        id="expense-submit-btn"
                        type="submit"
                        disabled={isNegativeAmount || isUploadingInvoice}
                        className={`w-full py-2.5 text-white text-xs font-semibold rounded uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          isNegativeAmount || isUploadingInvoice
                            ? "bg-gray-700 cursor-not-allowed text-gray-400"
                            : editingExpenseId
                            ? "bg-amber-600 hover:bg-amber-500"
                            : "bg-[#3B82F6] hover:bg-[#2563EB]"
                        }`}
                      >
                        {editingExpenseId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{editingExpenseId ? "Save Transaction Changes" : "Commit Transaction"}</span>
                      </button>
                    </form>
                  </div>

                  {/* Filterable Table and Advanced Grid List */}
                  <div className="bg-[#16181D] border border-[#2D2F33] rounded p-6 lg:col-span-2 space-y-4">
                    
                    {/* Header line */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 pb-4 border-b border-[#2D2F33]">
                      <div>
                        <h4 className="text-xs font-bold tracking-wider text-white uppercase font-mono">
                          Committed General Ledger Transactions
                        </h4>
                        <span className="text-[10px] text-gray-500 font-mono">SOX Relational Compliance Log</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={clearExpenseForm}
                          className="px-3 py-1.5 bg-[#212328] hover:bg-[#2D2F33] rounded text-white text-[11px] font-mono"
                        >
                          Reset Form
                        </button>
                        <button 
                          onClick={fetchAllData}
                          className="p-1.5 bg-[#212328] hover:bg-[#2D2F33] rounded text-gray-400 hover:text-white"
                          title="Refresh"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Advanced multi-channel filters */}
                    <div className="bg-[#0A0B0D] border border-[#2D2F33] rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-mono">Search Descriptions/Vendors</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={expenseSearchQuery}
                            onChange={(e) => setExpenseSearchQuery(e.target.value)}
                            className="w-full bg-[#16181D] border border-[#2D2F33] rounded text-xs text-white pl-8 pr-2 py-1.5 focus:outline-none focus:border-[#3B82F6]"
                            placeholder="Filter by keyword..."
                          />
                          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-mono">Paying Department</label>
                        <select
                          value={expenseFilterDeptId}
                          onChange={(e) => setExpenseFilterDeptId(e.target.value)}
                          className="w-full bg-[#16181D] border border-[#2D2F33] rounded text-xs text-white py-1.5 px-2 focus:outline-none focus:border-[#3B82F6]"
                        >
                          <option value="All">All Departments</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-mono">Category Filter</label>
                        <select
                          value={expenseFilterCategory}
                          onChange={(e) => setExpenseFilterCategory(e.target.value)}
                          className="w-full bg-[#16181D] border border-[#2D2F33] rounded text-xs text-white py-1.5 px-2 focus:outline-none focus:border-[#3B82F6]"
                        >
                          <option value="All">All Categories</option>
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto border border-[#2D2F33] rounded">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#1C1F25] text-gray-400 font-mono text-[10px] uppercase tracking-wider border-b border-[#2D2F33]">
                            <th className="p-3">Date</th>
                            <th className="p-3">Department / Link</th>
                            <th className="p-3">Vendor / Invoice</th>
                            <th className="p-3">Category / Desc</th>
                            <th className="p-3 text-right">Actual Sum</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#212328]">
                          {filteredExpensesForTab.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                                No committed expenditure transactions match your selected search filters or fiscal period.
                              </td>
                            </tr>
                          ) : (
                            filteredExpensesForTab.map((e) => {
                              const dept = departments.find(d => d.id === e.departmentId);
                              return (
                                <tr key={e.id} className="hover:bg-[#1C1F26] group transition-colors">
                                  <td className="p-3 font-mono text-gray-400 whitespace-nowrap">{e.date}</td>
                                  <td className="p-3">
                                    <div className="font-semibold text-white">{dept?.code || "Unknown"}</div>
                                    <div className="text-[9px] text-gray-500 font-mono truncate max-w-[110px]">
                                      {e.budgetId ? `🔗 PLAN: ${e.budgetId.slice(2, 8)}` : "⚠️ UNALIGNED"}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-gray-300 truncate max-w-[120px]">{e.vendorName || "General Vendor"}</div>
                                    <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                      {e.invoiceNumber || "N/A"}
                                      {e.invoiceUrl && (
                                        <a 
                                          href={e.invoiceUrl} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="text-[#3B82F6] hover:underline flex items-center"
                                          title="View digital copy"
                                        >
                                          📎
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-[#E5C185] font-semibold">{e.category}</div>
                                    <div className="text-gray-400 truncate max-w-[180px]" title={e.description}>
                                      {e.description}
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono text-right text-red-400 font-bold whitespace-nowrap">
                                    -${e.amount.toLocaleString()}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleExpenseEdit(e)}
                                        className="p-1 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] rounded transition-colors"
                                        title="Edit General Ledger Entry"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleExpenseDelete(e.id)}
                                        className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                        title="Retract Expenditure Transaction"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Footnote details */}
                    <div className="text-[10px] text-gray-500 italic font-mono text-right">
                      Registered Operator Log: {currentUser.name} ({currentUser.role})
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

          {/* =======================================================
              5. VARIANCE & REPORTS TAB
              ======================================================= */}
          {activeTab === "reports" && (
            <FinancialReports
              currentUser={currentUser}
              departments={departments}
              triggerAlert={triggerAlert}
            />
          )}

          {/* =======================================================
              5B. AI FINANCIAL ASSISTANT CONSOLE
              ======================================================= */}
          {activeTab === "assistant" && (
            <FinancialAssistant
              currentUser={currentUser}
              triggerAlert={triggerAlert}
            />
          )}

          {/* =======================================================
              6. PREDICTIVE FORECASTING TAB (AI POWERS)
              ======================================================= */}
          {activeTab === "forecast" && (
            <div className="space-y-6">
              
              <div className="bg-[#16181D] border border-[#2D2F33] rounded p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#E5C185]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Oracle EPM AI Predictive Forecasting Engine (Gemini Powered)
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mb-6">
                  Harness server-side intelligence to compute structural trend projections and variance index risks for upcoming periods.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Modeling Parameters Control Panel */}
                  <div className="space-y-4 bg-[#0A0B0D] p-5 border border-[#2D2F33] rounded flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold tracking-wider text-white uppercase font-mono mb-4 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-[#E5C185]" />
                        <span>Projection Parameters</span>
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] text-[#8E9299] uppercase tracking-wider mb-1.5">
                            Target Department Unit
                          </label>
                          <select
                            id="forecast-dept-id"
                            value={forecastDeptId}
                            onChange={(e) => setForecastDeptId(e.target.value)}
                            className="w-full bg-[#16181D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6]"
                          >
                            <option value="">Select Target Org Unit...</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#8E9299] uppercase tracking-wider mb-1.5">
                            Target Line-Item Category
                          </label>
                          <select
                            id="forecast-category"
                            value={forecastCategory}
                            onChange={(e) => setForecastCategory(e.target.value)}
                            className="w-full bg-[#16181D] border border-[#2D2F33] rounded text-xs text-white p-2.5 focus:outline-none focus:border-[#3B82F6]"
                          >
                            <option value="All Categories">All Strategic Categories (Consolidated)</option>
                            {CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] uppercase text-[#8E9299] mb-1.5">
                            <span>Target Adjustment Growth</span>
                            <span className="font-mono text-white font-bold">{forecastTargetGrowth}%</span>
                          </div>
                          <input
                            id="forecast-growth-slider"
                            type="range"
                            min="1"
                            max="25"
                            value={forecastTargetGrowth}
                            onChange={(e) => setForecastTargetGrowth(Number(e.target.value))}
                            className="w-full accent-[#3B82F6]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      id="run-forecast-ai"
                      onClick={handleRunForecast}
                      disabled={isForecasting}
                      className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-semibold rounded uppercase tracking-wider flex items-center justify-center gap-2 mt-6"
                    >
                      {isForecasting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Executing AI Model Engine...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-[#E5C185]" />
                          <span>Generate Predictive Projection</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Modeling Output Results Display */}
                  <div className="lg:col-span-2 space-y-4">
                    {forecastResponse ? (
                      <div className="bg-[#1C1F26] border border-[#2D2F33] rounded p-6 space-y-6">
                        
                        {/* Forecast KPI header */}
                        <div className="flex justify-between items-center border-b border-[#2D2F33] pb-4">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-widest">PROJECTED FISCAL TARGET</span>
                            <h2 className="text-2xl font-bold font-mono text-[#E5C185] mt-1">
                              ${forecastResponse.forecastAmount.toLocaleString()}
                            </h2>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-widest">MODEL CONFIDENCE</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-base font-bold font-mono text-emerald-400">{forecastResponse.confidenceScore}%</span>
                              <div className="w-16 h-2 bg-[#0A0B0D] rounded overflow-hidden">
                                <div className="h-full bg-emerald-400" style={{ width: `${forecastResponse.confidenceScore}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Analysis explainers */}
                        <div>
                          <h4 className="text-[11px] font-bold uppercase text-white font-mono tracking-wider mb-1.5">Statistical Trend Explanation:</h4>
                          <p className="text-xs text-[#8E9299] leading-relaxed italic bg-[#0A0B0D] p-3 rounded border border-[#2D2F33]">
                            "{forecastResponse.trendAnalysis}"
                          </p>
                        </div>

                        {/* Recommendations array */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold uppercase text-emerald-400 font-mono tracking-wider flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Optimization Actions</span>
                            </h4>
                            <ul className="space-y-1.5 text-xs text-gray-300">
                              {forecastResponse.recommendations.map((rec, i) => (
                                <li key={i} className="flex gap-2 items-start">
                                  <span className="text-emerald-400 shrink-0">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold uppercase text-red-400 font-mono tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Forecast Risks Identified</span>
                            </h4>
                            <ul className="space-y-1.5 text-xs text-gray-300">
                              {forecastResponse.risks.map((risk, i) => (
                                <li key={i} className="flex gap-2 items-start">
                                  <span className="text-red-400 shrink-0">•</span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Interactive dynamic forecast chart simulation comparing baseline with project */}
                        <div className="border-t border-[#2D2F33] pt-4">
                          <h4 className="text-[11px] font-bold uppercase text-white font-mono tracking-wider mb-3">5-Year Structural Trend Projection:</h4>
                          <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={[
                                { year: "2024 (Actual)", Baseline: 1100000, Projected: 1100000 },
                                { year: "2025 (Actual)", Baseline: 1150000, Projected: 1150000 },
                                { year: "2026 (Estimate)", Baseline: 1200000, Projected: 1200000 },
                                { year: "2027 (Forecast)", Baseline: 1220000, Projected: forecastResponse.forecastAmount },
                                { year: "2028 (Projected)", Baseline: 1250000, Projected: Math.round(forecastResponse.forecastAmount * 1.05) }
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2D2F33" />
                                <XAxis dataKey="year" stroke="#8E9299" fontSize={10} />
                                <YAxis stroke="#8E9299" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} />
                                <Tooltip contentStyle={{ backgroundColor: "#16181D", borderColor: "#2D2F33", color: "#E1E1E1" }} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Line type="monotone" dataKey="Baseline" stroke="#2D2F33" strokeWidth={2} strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="Projected" stroke="#3B82F6" strokeWidth={3} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="bg-[#16181D] border border-dashed border-[#2D2F33] rounded p-12 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-3">
                        <Sparkles className="w-10 h-10 text-gray-600 animate-pulse" />
                        <div>
                          <p className="font-semibold text-white">Forecasting engine idle.</p>
                          <p className="mt-1">Configure structural growth inputs and execute the projection model above.</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* =======================================================
              MODULE 2: DEPARTMENT DIRECTORY & COMPLIANCE PANEL
              ======================================================= */}
          {activeTab === "departments" && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#16181D] border border-[#2D2F33] p-6 rounded shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-white uppercase tracking-wider font-sans">
                    EPM Corporate Department Registry
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage active business units, budget mapping thresholds, workforce allocation, and SOC2 compliant directory integrations.
                  </p>
                </div>
                {/* Provision Department Button (Admin & Finance Manager only) */}
                {(currentUser?.role === "Admin" || currentUser?.role === "Finance Manager") && (
                  <button
                    id="btn-provision-dept"
                    onClick={openCreateDeptModal}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#C19A5B] to-[#E5C185] text-[#0A0B0D] hover:from-[#A37F43] hover:to-[#C19A5B] font-semibold text-xs rounded uppercase tracking-wider transition-all duration-150 flex items-center gap-2 shadow-lg"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Provision Department</span>
                  </button>
                )}
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#3B82F6]/5 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#1E293B] border border-[#2D2F33] rounded">
                      <Building2 className="w-4 h-4 text-[#3B82F6]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Corporate Units</p>
                      <h3 className="text-lg font-bold text-white mt-0.5">{departments.length} Units</h3>
                    </div>
                  </div>
                </div>

                <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#10B981]/5 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#1E293B] border border-[#2D2F33] rounded">
                      <UserCheck className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Assigned Workforce</p>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {departments.reduce((sum, d: any) => sum + (d.memberCount ?? 0), 0)} Personnel
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#F59E0B]/5 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#1E293B] border border-[#2D2F33] rounded">
                      <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Approved FY2026 Budget</p>
                      <h3 className="text-lg font-bold text-white mt-0.5 font-mono">
                        ${departments.reduce((sum, d: any) => sum + (d.totalApprovedBudget ?? 0), 0).toLocaleString()}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="bg-[#16181D] border border-[#2D2F33] rounded p-4 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#1E293B] border border-[#2D2F33] rounded">
                      <Receipt className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Disbursed Expenses</p>
                      <h3 className="text-lg font-bold text-white mt-0.5 font-mono">
                        ${departments.reduce((sum, d: any) => sum + (d.totalActualExpenses ?? 0), 0).toLocaleString()}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Directory List Table */}
              <div className="bg-[#16181D] border border-[#2D2F33] rounded shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#2D2F33] flex justify-between items-center bg-[#1C1F26]">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                    Department Access & Control Directory
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900 rounded text-[10px] font-mono uppercase">
                    Read-Write Sync State Active
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0A0B0D] border-b border-[#2D2F33] text-gray-400 text-[10px] uppercase tracking-wider font-mono">
                        <th className="py-3 px-6">Unit Code</th>
                        <th className="py-3 px-6">Department Name</th>
                        <th className="py-3 px-6">Active Director / Manager</th>
                        <th className="py-3 px-6 text-center">Headcount</th>
                        <th className="py-3 px-6 text-right">Target Budget</th>
                        <th className="py-3 px-6 text-right">Actual Expense</th>
                        <th className="py-3 px-6 px-10">Budget Utilization Gauge</th>
                        <th className="py-3 px-6 text-center">System Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2F33] text-xs">
                      {departments.map((dept: any) => {
                        const budget = dept.totalApprovedBudget ?? 0;
                        const spent = dept.totalActualExpenses ?? 0;
                        const ratio = budget > 0 ? (spent / budget) * 100 : 0;
                        
                        // Dynamic styling colors based on threshold breaches
                        let colorClass = "bg-emerald-500";
                        let textClass = "text-emerald-400";
                        if (ratio > 100) {
                          colorClass = "bg-rose-500";
                          textClass = "text-rose-400 font-bold";
                        } else if (ratio >= varianceAlertThreshold) {
                          colorClass = "bg-amber-500";
                          textClass = "text-amber-400";
                        }

                        return (
                          <tr key={dept.id} className="hover:bg-[#1C1F26]/30 transition-colors">
                            <td className="py-4 px-6 font-mono font-bold text-[#E5C185]">
                              {dept.code}
                            </td>
                            <td className="py-4 px-6 font-medium text-white">
                              {dept.name}
                            </td>
                            <td className="py-4 px-6 text-gray-300">
                              {dept.managerName ?? "Unassigned"}
                            </td>
                            <td className="py-4 px-6 text-center font-mono font-semibold text-gray-300">
                              {dept.memberCount ?? 0}
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-gray-300">
                              ${budget.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-gray-300">
                              ${spent.toLocaleString()}
                            </td>
                            <td className="py-4 px-6 px-10">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className={textClass}>
                                    {ratio > 100 ? "OVERSPENT" : `${ratio.toFixed(1)}%`}
                                  </span>
                                  <span className="text-gray-500">
                                    {budget > 0 ? `$${(budget - spent).toLocaleString()} left` : "$0 target"}
                                  </span>
                                </div>
                                <div className="w-full bg-[#0A0B0D] rounded-full h-1.5 overflow-hidden border border-[#2D2F33]">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                                    style={{ width: `${Math.min(ratio, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* Edit department info */}
                                {(currentUser?.role === "Admin" || currentUser?.role === "Finance Manager") ? (
                                  <button
                                    id={`btn-edit-dept-${dept.code}`}
                                    onClick={() => openEditDeptModal(dept)}
                                    className="p-1.5 rounded border border-[#2D2F33] text-gray-400 hover:text-white hover:bg-[#1E293B] transition-all"
                                    title="Edit Configuration"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-gray-600 text-[10px] italic">Read-Only</span>
                                )}

                                {/* Delete department */}
                                {currentUser?.role === "Admin" && (
                                  <button
                                    id={`btn-delete-dept-${dept.code}`}
                                    onClick={() => handleDeleteDept(dept.id, dept.code)}
                                    className="p-1.5 rounded border border-red-950 text-red-500 hover:text-white hover:bg-red-950/40 transition-all"
                                    title="Decommission Department"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              7. COMPLIANCE AUDIT TRAIL TAB
              ======================================================= */}
          {/* =======================================================
              7. COMPLIANCE AUDIT TRAIL TAB
              ======================================================= */}
          {activeTab === "audit" && (
            <AuditDashboard 
              currentUser={currentUser} 
              triggerAlert={triggerAlert} 
            />
          )}

        </main>

        {/* COMPREHENSIVE FOOTER STATUS BAR */}
        <footer className="h-8 bg-[#16181D] border-t border-[#2D2F33] px-6 flex items-center justify-between shrink-0 text-[10px] text-gray-500 font-mono">
          <div>
            Connected: <span className="text-gray-300 font-sans">{currentUser.email}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Period Status: OPEN</span>
            <span>Security Rule: ACTIVE</span>
            <span>Oracle PBCS Core v11.1.2.4</span>
          </div>
        </footer>

        {/* =======================================================
            PROVISION/EDIT DEPARTMENT MODAL OVERLAY
            ======================================================= */}
        {isDeptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-[#16181D] border border-[#2D2F33] rounded-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#2D2F33] bg-[#1C1F26] flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                  {editingDept ? `Edit Corporate Unit: ${editingDept.code}` : "Provision Corporate Department"}
                </h3>
                <button
                  id="btn-close-dept-modal"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  &times;
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateOrUpdateDept} className="p-6 space-y-4">
                {deptFormError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{deptFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Department Code
                  </label>
                  <input
                    type="text"
                    required
                    value={deptFormCode}
                    onChange={(e) => setDeptFormCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FIN-01"
                    className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#3B82F6] font-mono tracking-wider"
                    disabled={!!editingDept} // Lock code in edits to maintain EPM mappings
                  />
                  {!editingDept && (
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Must be uppercase and contain alphanumeric characters & hyphens only.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Department Name
                  </label>
                  <input
                    type="text"
                    required
                    value={deptFormName}
                    onChange={(e) => setDeptFormName(e.target.value)}
                    placeholder="e.g. Corporate Finance"
                    className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    Assigned Unit Manager
                  </label>
                  <select
                    value={deptFormManagerId}
                    onChange={(e) => setDeptFormManagerId(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#2D2F33] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="">-- Select Active Manager --</option>
                    {usersDirectory.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Choose an authenticated personnel member from the active directory directory.
                  </span>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2F33] mt-6">
                  <button
                    type="button"
                    onClick={() => setIsDeptModalOpen(false)}
                    className="px-4 py-2 border border-[#2D2F33] text-gray-400 hover:text-white text-xs font-semibold rounded uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded uppercase tracking-wider transition-all"
                  >
                    {editingDept ? "Save Configuration" : "Provision Unit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
