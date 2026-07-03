import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registers a new enterprise user credential in the directory
 * @access  Public (Standard administrative onboarding API)
 */
router.post("/register", AuthController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticates credentials, performs secure password hash verification, signs JWT
 * @access  Public
 */
router.post("/login", AuthController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Returns authenticated session profile context
 * @access  Private (Requires Bearer JWT token)
 */
router.get("/me", authenticateToken as any, AuthController.getProfile as any);

/**
 * @route   GET /api/v1/auth/directory
 * @desc    Corporate user registry directory
 * @access  Private (Requires Bearer JWT token)
 */
router.get("/directory", authenticateToken as any, AuthController.listDirectory);

export const authRouter = router;
