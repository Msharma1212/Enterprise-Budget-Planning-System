import { Response } from "express";
import { dbService } from "../../src/dbService.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * Fetch all notifications matching user's permissions (targeted to user, role, or broadcast)
   */
  public static getNotifications(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id: userId, role } = req.user;
      const allNotifications = dbService.getNotifications();

      // Filter notifications that are relevant to this user:
      // 1. targetUserId matches the current user
      // 2. targetRole matches the current user's role
      // 3. targetRole & targetUserId are not set (Broadcast/system-wide)
      const userNotifications = allNotifications.filter(n => {
        if (!n.targetUserId && !n.targetRole) {
          return true; // Broadcast
        }
        if (n.targetUserId && n.targetUserId === userId) {
          return true;
        }
        if (n.targetRole && n.targetRole === role) {
          return true;
        }
        return false;
      });

      res.json({
        success: true,
        notifications: userNotifications
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/notifications/:id/read
   * Mark a specific notification as read
   */
  public static markAsRead(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      dbService.markNotificationAsRead(id);

      res.json({
        success: true,
        message: "Notification marked as read."
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/notifications/read-all
   * Mark all notifications as read for current user
   */
  public static markAllAsRead(req: AuthenticatedRequest, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id: userId, role } = req.user;
      dbService.markAllNotificationsAsRead(userId, role);

      res.json({
        success: true,
        message: "All notifications marked as read."
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
