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