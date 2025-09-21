import { query } from '@/lib/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  rate: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface CreateUserData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  rate?: number; // Optional, default will be 25
}

export class UserModel {
  // Create new user
  static async create(userData: CreateUserData): Promise<User> {
    const { full_name, email, phone, password, rate = 25 } = userData;
    
    // Hash the password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const queryText = `
      INSERT INTO users (full_name, email, phone, password_hash, rate)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, phone, password_hash, rate, created_at, updated_at, is_active
    `;
    
    const values = [full_name, email, phone, password_hash, rate];
    
    try {
      const result = await query(queryText, values);
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const queryText = `
      SELECT id, full_name, email, phone, password_hash, rate, created_at, updated_at, is_active
      FROM users 
      WHERE email = $1 AND is_active = true
    `;
    
    try {
      const result = await query(queryText, [email]);
      return result.rows[0] as User || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
  
  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const queryText = `
      SELECT id, full_name, email, phone, password_hash, rate, created_at, updated_at, is_active
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    try {
      const result = await query(queryText, [id]);
      return result.rows[0] as User || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
  
  // Check if email already exists
  static async emailExists(email: string): Promise<boolean> {
    const queryText = `
      SELECT 1 FROM users WHERE email = $1 AND is_active = true
    `;
    
    try {
      const result = await query(queryText, [email]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }
  
  // Verify password
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  // Update user rate
  static async updateRate(userId: number, newRate: number): Promise<User | null> {
    const queryText = `
      UPDATE users 
      SET rate = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING id, full_name, email, phone, password_hash, rate, created_at, updated_at, is_active
    `;
    
    try {
      const result = await query(queryText, [newRate, userId]);
      return result.rows.length > 0 ? result.rows[0] as User : null;
    } catch (error) {
      console.error('Error updating user rate:', error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId: number, profileData: { full_name: string; phone: string; rate: string }): Promise<User | null> {
    const queryText = `
      UPDATE users 
      SET full_name = $1, phone = $2, rate = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND is_active = true
      RETURNING id, full_name, email, phone, password_hash, rate, created_at, updated_at, is_active
    `;
    
    try {
      const result = await query(queryText, [profileData.full_name, profileData.phone, profileData.rate, userId]);
      return result.rows.length > 0 ? result.rows[0] as User : null;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update user password
  static async updatePassword(userId: number, newPassword: string): Promise<User | null> {
    // Hash the new password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    const queryText = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING id, full_name, email, phone, password_hash, rate, created_at, updated_at, is_active
    `;
    
    try {
      const result = await query(queryText, [password_hash, userId]);
      return result.rows.length > 0 ? result.rows[0] as User : null;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }
}