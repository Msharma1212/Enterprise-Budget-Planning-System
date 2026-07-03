import bcrypt from "bcryptjs";
import { User, UserRole } from "../../src/types.js";
import { dbService } from "../../src/dbService.js";

export interface ExtendedUser extends User {
  passwordHash: string;
  isActive: boolean;
}

export class UserModel {
  /**
   * Encrypts/hashes plain-text password using Bcrypt
   */
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares plain-text password with stored BCrypt hash
   */
  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Retrieves a user from the enterprise directory including password credentials
   */
  public static getUserByUsername(username: string): ExtendedUser | null {
    const users = dbService.getUsers() as any[];
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!found) return null;

    // Default Bcrypt hash for 'password123' if not explicitly defined
    const defaultHash = "$2a$10$Y5nCjN7hWbK9U3C7hR567uvK4mK8p3eD/vMhNl1i7K3fW1a5/pQHe";
    
    return {
      id: found.id,
      username: found.username,
      email: found.email || `${found.username}@enterprise.com`,
      role: found.role as UserRole,
      departmentId: found.departmentId || "d1",
      name: found.name,
      passwordHash: found.passwordHash || defaultHash,
      isActive: found.isActive !== false
    };
  }

  /**
   * Persists / Creates a new user in the registry
   */
  public static async createUser(userData: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    departmentId: string;
  }): Promise<ExtendedUser> {
    // Basic validation
    if (!userData.username || !userData.email || !userData.password || !userData.name) {
      throw new Error("Missing required fields for user creation.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error("Invalid email format.");
    }

    const existing = this.getUserByUsername(userData.username);
    if (existing) {
      throw new Error("A user with this username already exists in the Oracle PBCS Directory.");
    }

    const passwordHash = await this.hashPassword(userData.password);
    const newUser: ExtendedUser = {
      id: "u_" + Math.random().toString(36).substr(2, 9),
      username: userData.username.toLowerCase(),
      email: userData.email,
      role: userData.role,
      departmentId: userData.departmentId,
      name: userData.name,
      passwordHash,
      isActive: true
    };

    // Save into our persistent dbService JSON database
    const allUsers = dbService.getUsers() as any[];
    allUsers.push(newUser);
    
    // Save state
    (dbService as any).save();

    return newUser;
  }

  /**
   * Lists all corporate users in directory
   */
  public static getAllUsers(): User[] {
    return dbService.getUsers();
  }
}
