import { prisma } from "../config/database";
import * as bcrypt from "bcryptjs";

/**
 * User Service
 * Handles user-related database operations
 */
export class UserService {
  /**
   * Find user by username
   */
  async findByUsername(username: string) {
    try {
      return await prisma.user.findUnique({
        where: { username },
      });
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: number) {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async create(username: string, password: string) {
    try {
      const passwordHash = await bcrypt.hash(password, 10);

      return await prisma.user.create({
        data: {
          username,
          passwordHash,
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(username: string, password: string): Promise<boolean> {
    try {
      const user = await this.findByUsername(username);

      if (!user) {
        return false;
      }

      return await bcrypt.compare(password, user.passwordHash);
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  }

  /**
   * Authenticate user
   */
  async authenticate(username: string, password: string) {
    try {
      const isValid = await this.verifyPassword(username, password);

      if (!isValid) {
        return null;
      }

      return await this.findByUsername(username);
    } catch (error) {
      console.error("Error authenticating user:", error);
      return null;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
