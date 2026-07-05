import { Response } from "express";
import { DashboardModel } from "../models/dashboardModel.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export class DashboardController {
  /**
   * GET /api/v1/dashboard/metrics
   * Retrieves aggregated dashboard metrics, charts data, and corresponding SOX compliance SQL queries
   */
  public static getMetrics(req: AuthenticatedRequest, res: Response): void {
    try {
      const deptFilter = (req.query.departmentId as string) || "All";
      const yearFilter = Number(req.query.year) || 2026;
      const monthFilter = (req.query.month as string) || "All";

      const data = DashboardModel.getDashboardData(deptFilter, yearFilter, monthFilter);

      res.json({
        success: true,
        filterApplied: {
          departmentId: deptFilter,
          year: yearFilter,
          month: monthFilter
        },
        ...data
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
