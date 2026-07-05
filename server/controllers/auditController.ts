import { Response } from "express";
import { dbService } from "../../src/dbService.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { UserRole } from "../../src/types.js";

export class AuditController {
  /**
   * GET /api/v1/audits
   * Fetch audit logs with filtering, searching, and pagination. Admin-only.
   */
  public static getLogs(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ error: "Access Denied. Audit Logs are restricted to Enterprise Administrators only." });
        return;
      }

      const { search, action, role, startDate, endDate, limit, page } = req.query;
      let logs = dbService.getAuditLogs();

      // Filter by Search Query (username, details, id)
      if (search) {
        const query = (search as string).toLowerCase();
        logs = logs.filter(log => 
          log.username.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.id.toLowerCase().includes(query)
        );
      }

      // Filter by Action Type
      if (action) {
        logs = logs.filter(log => log.action === action);
      }

      // Filter by User Role
      if (role) {
        logs = logs.filter(log => log.role === role);
      }

      // Filter by Start Date
      if (startDate) {
        const start = new Date(startDate as string).getTime();
        logs = logs.filter(log => new Date(log.timestamp).getTime() >= start);
      }

      // Filter by End Date
      if (endDate) {
        const end = new Date(endDate as string).getTime();
        logs = logs.filter(log => new Date(log.timestamp).getTime() <= end);
      }

      const totalCount = logs.length;

      // Handle Pagination
      const p = parseInt(page as string) || 1;
      const l = parseInt(limit as string) || 50;
      const startIndex = (p - 1) * l;
      const paginatedLogs = logs.slice(startIndex, startIndex + l);

      res.json({
        success: true,
        logs: paginatedLogs,
        pagination: {
          total: totalCount,
          page: p,
          limit: l,
          pages: Math.ceil(totalCount / l)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/audits/stats
   * Fetch statistical analysis of system audit records (actions, activity levels, security failures)
   */
  public static getStats(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ error: "Access Denied. Audit Statistics are restricted to Enterprise Administrators only." });
        return;
      }

      const logs = dbService.getAuditLogs();
      const totalLogs = logs.length;

      // Action type distribution
      const actionDistribution: Record<string, number> = {};
      // User role distribution
      const roleDistribution: Record<string, number> = {};
      // Active users (unique usernames)
      const uniqueUsers = new Set<string>();
      // Unauthorized attempts count
      let unauthorizedAttempts = 0;

      logs.forEach(log => {
        actionDistribution[log.action] = (actionDistribution[log.action] || 0) + 1;
        roleDistribution[log.role] = (roleDistribution[log.role] || 0) + 1;
        uniqueUsers.add(log.username);
        if (log.action === "UNAUTHORIZED_ACCESS_ATTEMPT") {
          unauthorizedAttempts++;
        }
      });

      // Simple activity by date grouping (last 7 days/items)
      const activityTrend: Record<string, number> = {};
      logs.slice(0, 100).forEach(log => {
        try {
          const dateStr = new Date(log.timestamp).toLocaleDateString();
          activityTrend[dateStr] = (activityTrend[dateStr] || 0) + 1;
        } catch (e) {
          // ignore
        }
      });

      res.json({
        success: true,
        stats: {
          totalLogs,
          activeUsersCount: uniqueUsers.size,
          unauthorizedAttempts,
          actionDistribution,
          roleDistribution,
          activityTrend
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/audits/purge
   * Purges audit logs (simulated clear with security audit trace)
   */
  public static purgeLogs(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ error: "Access Denied. Purging audit logs is restricted to Enterprise Administrators only." });
        return;
      }

      // Record a critical security log explaining who cleared the history
      dbService.addAudit(
        req.user.id,
        req.user.username,
        req.user.role,
        "AUDIT_LOGS_PURGED",
        `Enterprise compliance audit trail database was manually initialized/purged by administrative request.`
      );

      res.json({
        success: true,
        message: "Compliance audit records cleared. Security purge marker logged."
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
