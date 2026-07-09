import express, { Request, Response } from "express";
import path from "path";
import { spawn, execSync } from "child_process";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import { dbService } from "./src/dbService.js";
import { GoogleGenAI, Type } from "@google/genai";
import { BudgetStatus } from "./src/types.js";
import { authRouter } from "./server/routes/authRoutes.js";
import { departmentRouter } from "./server/routes/departmentRoutes.js";
import { budgetRouter } from "./server/routes/budgetRoutes.js";
import { workflowRouter } from "./server/routes/workflowRoutes.js";
import { expenseRouter } from "./server/routes/expenseRoutes.js";
import { dashboardRouter } from "./server/routes/dashboardRoutes.js";
import { reportRouter } from "./server/routes/reportRoutes.js";
import { notificationRouter } from "./server/routes/notificationRoutes.js";
import { auditRouter } from "./server/routes/auditRoutes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// API: V1 Authenticaton System Router (JWT, Hashing, Models)
app.use("/api/v1/auth", authRouter);

// API: V1 Department Management Router
app.use("/api/v1/departments", departmentRouter);

// API: V1 Budget Planning Router
app.use("/api/v1/budgets", budgetRouter);

// API: V1 Budget Workflows Router
app.use("/api/v1/workflows", workflowRouter);

// API: V1 Expense Tracking Router
app.use("/api/v1/expenses", expenseRouter);

// API: V1 Financial Dashboard Router
app.use("/api/v1/dashboard", dashboardRouter);

// API: V1 Financial Reports Router
app.use("/api/v1/reports", reportRouter);

// API: V1 Notifications Router
app.use("/api/v1/notifications", notificationRouter);

// API: V1 Compliance Audits Router
app.use("/api/v1/audits", auditRouter);

// API: Auth / Login
app.post("/api/auth/login", (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) {
      res.status(400).json({ error: "Username is required" });
      return;
    }
    const user = dbService.authenticateUser(username);
    if (!user) {
      res.status(401).json({ error: "Enterprise user credentials not found in directory. Use admin.orcl, finance.orcl, it.orcl, rd.orcl, or mktg.orcl" });
      return;
    }
    dbService.addAudit(user.id, user.username, user.role, "USER_LOGIN", `Logged in to Oracle Cloud Planning from ${req.ip}`);
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Departments
app.get("/api/departments", (req: Request, res: Response) => {
  res.json(dbService.getDepartments());
});

// API: Budgets
app.get("/api/budgets", (req: Request, res: Response) => {
  res.json(dbService.getBudgets());
});

app.post("/api/budgets", (req: Request, res: Response) => {
  try {
    const { budget, userId, username, userRole } = req.body;
    const saved = dbService.saveBudget(budget, userId, username, userRole);
    res.json({ success: true, budget: saved });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
app.post("/api/budgets/workflow", (req: Request, res: Response) => {
  try {
    const { budgetId, status, userId, username, userRole, comment } = req.body;
    const updated = dbService.updateBudgetWorkflow(budgetId, status, userId, username, userRole, comment);
    res.json({ success: true, budget: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// API: Expenses
app.get("/api/expenses", (req: Request, res: Response) => {
  res.json(dbService.getExpenses());
});

app.post("/api/expenses", (req: Request, res: Response) => {
  try {
    const { expense, userId, username, userRole } = req.body;
    const result = dbService.addExpense(expense, userId, username, userRole);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// API: Audit & Workflow Logs
app.get("/api/audit-logs", (req: Request, res: Response) => {
  res.json(dbService.getAuditLogs());
});

app.get("/api/workflow-logs", (req: Request, res: Response) => {
  res.json(dbService.getWorkflowLogs());
});

// API: AI Forecasting
app.post("/api/forecast", async (req: Request, res: Response) => {
  const { departmentId, historicalBudget, historicalActuals, targetCategory, growthSliderValue } = req.body;
  
  // Standard high-quality fallback heuristic forecasting
  const calculateHeuristicForecast = () => {
    const budgetSum = historicalBudget || 1000000;
    const actualSum = historicalActuals || 900000;
    const ratio = actualSum / (budgetSum || 1);
    
    const forecastAmount = Math.round(actualSum * 1.08); // 8% growth projection
    const confidenceScore = Math.min(Math.max(Math.round((1 - Math.abs(1 - ratio)) * 100), 65), 95);
    
    return {
      forecastAmount,
      confidenceScore,
      trendAnalysis: `Heuristic Analysis: Based on actual historical spending of $${actualSum.toLocaleString()} vs. budget plans of $${budgetSum.toLocaleString()} (${Math.round(ratio * 100)}% utilization), the projected baseline for the upcoming fiscal period is estimated with an 8% structural adjustment.`,
      recommendations: [
        `Prioritize category allocation targets based on historical high utilization rates.`,
        `Implement tight variance controls on discretionary travel and hardware line items.`,
        `Formulate a quarterly contingency buffer of 5% of total budget to absorb seasonal run rates.`
      ],
      risks: [
        `Volatility in software renewal licensing cycles during Q3.`,
        `Unanticipated staffing ramp up in operational support functions.`
      ],
      isDemo: true
    };
  };
