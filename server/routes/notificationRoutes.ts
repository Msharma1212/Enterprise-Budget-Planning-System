import { Router } from "express";
import { NotificationController } from "../controllers/notificationController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get all notifications for authenticated user
 * @access  Private
 */
router.get("/", authenticateToken as any, NotificationController.getNotifications as any);

/**
 * @route   POST /api/v1/notifications/:id/read
 * @desc    Mark specific notification as read
 * @access  Private
 */
router.post("/:id/read", authenticateToken as any, NotificationController.markAsRead as any);

/**
 * @route   POST /api/v1/notifications/read-all
 * @desc    Mark all user's notifications as read
 * @access  Private
 */
router.post("/read-all", authenticateToken as any, NotificationController.markAllAsRead as any);

export const notificationRouter = router;
