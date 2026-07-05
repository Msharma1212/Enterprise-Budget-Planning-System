import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";
import { UserRole } from "../../src/types.js";
import { dbService } from "../../src/dbService.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "oracle-pbcs-enterprise-super-secret-token-key-2026";
const JWT_EXPIRES_IN = "8h";

export class AuthController {
  /**
   * Enterprise Register Endpoint
   * Enforces credentials, hashes passwords, seeds directory and log logs
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, name, role, departmentId } = req.body;

      // Robust Input Validation
      if (!username || !email || !password || !name || !role || !departmentId) {
        res.status(400).json({ 
          error: "All fields are required: username, email, password, name, role, departmentId." 
        });
        return;
      }

      // Strong validation of roles
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(role as UserRole)) {
        res.status(400).json({ 
          error: `Invalid role selected. Permitted: ${validRoles.join(", ")}` 
        });
        return;
      }

      // Validate password security policy (min length)
      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters in length." });
        return;
      }

      // Model layer creation
      const user = await UserModel.createUser({
        username,
        email,
        password,
        name,
        role: role as UserRole,
        departmentId
      });

      // Compliance audit tracking
      dbService.addAudit(
        user.id,
        user.username,
        user.role,
        "USER_REGISTER",
        `Created new enterprise credential: ${user.name} (${user.role}) inside department ID ${user.departmentId}`
      );

      res.status(210).json({
        success: true,
        message: "Enterprise user credentials created successfully in registry directory.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          name: user.name
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Enterprise Login Endpoint
   * Verifies hashes, signs JWT credentials, logs corporate security audit log
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Please enter your enterprise username and password." });
        return;
      }

      // Directory lookup
      const user = UserModel.getUserByUsername(username);
      if (!user) {
        res.status(401).json({ 
          error: "Enterprise login invalid: user directory match not found." 
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ error: "Access Denied. User account has been deactivated." });
        return;
      }

      // Verify Bcrypt crypt hash
      const isValid = await UserModel.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        // Log unauthorized attempt for safety and audit logs
        dbService.addAudit(
          user.id,
          user.username,
          user.role,
          "UNAUTHORIZED_ACCESS_ATTEMPT",
          `Failed password challenge validation for username "${user.username}"`
        );
        res.status(401).json({ error: "Enterprise login invalid: secret password challenge failed." });
        return;
      }

      // Sign EPM compliance Bearer JWT
      const tokenPayload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        name: user.name
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Audit log success
      dbService.addAudit(
        user.id,
        user.username,
        user.role,
        "USER_LOGIN_SECURE",
        `Successful JWT challenge authenticated from client IP: ${req.ip}`
      );

      res.json({
        success: true,
        token,
        expiresIn: JWT_EXPIRES_IN,
        user: tokenPayload
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Current Authenticated User Endpoint
   */
  public static getProfile(req: AuthenticatedRequest, res: Response): void {
    if (!req.user) {
      res.status(401).json({ error: "User is not authenticated." });
      return;
    }
    res.json({ user: req.user });
  }

  /**
   * Corporate Directory List
   */
  public static listDirectory(req: Request, res: Response): void {
    const users = UserModel.getAllUsers();
    // Sanitize hash from client-side response
    const sanitized = users.map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email || `${u.username}@enterprise.com`,
      role: u.role,
      departmentId: u.departmentId,
      name: u.name,
      isActive: u.isActive !== false
    }));
    res.json(sanitized);
  }
}
