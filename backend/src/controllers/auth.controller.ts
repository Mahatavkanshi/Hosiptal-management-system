import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateRefreshToken,
  validateEmail 
} from '../utils/helpers';
import { User, Patient, Doctor } from '../types';

// Validation rules
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(['patient', 'doctor']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number')
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password, first_name, last_name, role, phone, ...additionalData } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists with this email', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, role, first_name, last_name, phone, created_at`,
      [email, passwordHash, role, first_name, last_name, phone]
    );

    const user = userResult.rows[0];

    // Create profile based on role
    if (role === 'patient') {
      await query(
        `INSERT INTO patients (user_id, date_of_birth, blood_group, gender, address, 
         city, state, pincode, emergency_contact_name, emergency_contact_phone, 
         insurance_provider, allergies, chronic_conditions) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          user.id,
          additionalData.date_of_birth || null,
          additionalData.blood_group || null,
          additionalData.gender || null,
          additionalData.address || null,
          additionalData.city || null,
          additionalData.state || null,
          additionalData.pincode || null,
          additionalData.emergency_contact_name || null,
          additionalData.emergency_contact_phone || null,
          additionalData.insurance_provider || null,
          additionalData.allergies || null,
          additionalData.chronic_conditions || null
        ]
      );
    } else if (role === 'doctor') {
      await query(
        `INSERT INTO doctors (user_id, specialization, qualification, experience_years, 
         consultation_fee, license_number, available_days, available_time_start, 
         available_time_end, slot_duration, about) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          user.id,
          additionalData.specialization,
          additionalData.qualification,
          additionalData.experience_years || 0,
          additionalData.consultation_fee || 0,
          additionalData.license_number || null,
          JSON.stringify(additionalData.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
          additionalData.available_time_start || '09:00',
          additionalData.available_time_end || '17:00',
          additionalData.slot_duration || 30,
          additionalData.about || null
        ]
      );
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone
        },
        token,
        refreshToken
      }
    });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;

    // Find user
    const userResult = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone
        },
        token,
        refreshToken
      }
    });
  }
);

export const getProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Get user details
    const userResult = await query(
      'SELECT id, email, role, first_name, last_name, phone, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userResult.rows[0];
    let profile = null;

    // Get role-specific profile
    if (userRole === 'patient') {
      const patientResult = await query(
        'SELECT * FROM patients WHERE user_id = $1',
        [userId]
      );
      if (patientResult.rows.length > 0) {
        profile = patientResult.rows[0];
      }
    } else if (userRole === 'doctor') {
      const doctorResult = await query(
        `SELECT d.*, u.first_name, u.last_name, u.email, u.phone 
         FROM doctors d 
         JOIN users u ON d.user_id = u.id 
         WHERE d.user_id = $1`,
        [userId]
      );
      if (doctorResult.rows.length > 0) {
        profile = doctorResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        user,
        profile
      }
    });
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const updateData = req.body;

    // Update user basic info
    if (updateData.first_name || updateData.last_name || updateData.phone) {
      await query(
        `UPDATE users 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone = COALESCE($3, phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [updateData.first_name, updateData.last_name, updateData.phone, userId]
      );
    }

    // Update role-specific profile
    if (userRole === 'patient' && (updateData.date_of_birth || updateData.blood_group || updateData.address)) {
      await query(
        `UPDATE patients 
         SET date_of_birth = COALESCE($1, date_of_birth),
             blood_group = COALESCE($2, blood_group),
             gender = COALESCE($3, gender),
             address = COALESCE($4, address),
             city = COALESCE($5, city),
             state = COALESCE($6, state),
             pincode = COALESCE($7, pincode),
             emergency_contact_name = COALESCE($8, emergency_contact_name),
             emergency_contact_phone = COALESCE($9, emergency_contact_phone),
             insurance_provider = COALESCE($10, insurance_provider),
             allergies = COALESCE($11, allergies),
             chronic_conditions = COALESCE($12, chronic_conditions),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $13`,
        [
          updateData.date_of_birth,
          updateData.blood_group,
          updateData.gender,
          updateData.address,
          updateData.city,
          updateData.state,
          updateData.pincode,
          updateData.emergency_contact_name,
          updateData.emergency_contact_phone,
          updateData.insurance_provider,
          updateData.allergies,
          updateData.chronic_conditions,
          userId
        ]
      );
    } else if (userRole === 'doctor' && (updateData.specialization || updateData.consultation_fee)) {
      await query(
        `UPDATE doctors 
         SET specialization = COALESCE($1, specialization),
             qualification = COALESCE($2, qualification),
             experience_years = COALESCE($3, experience_years),
             consultation_fee = COALESCE($4, consultation_fee),
             available_days = COALESCE($5, available_days),
             available_time_start = COALESCE($6, available_time_start),
             available_time_end = COALESCE($7, available_time_end),
             slot_duration = COALESCE($8, slot_duration),
             about = COALESCE($9, about),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $10`,
        [
          updateData.specialization,
          updateData.qualification,
          updateData.experience_years,
          updateData.consultation_fee,
          updateData.available_days ? JSON.stringify(updateData.available_days) : null,
          updateData.available_time_start,
          updateData.available_time_end,
          updateData.slot_duration,
          updateData.about,
          userId
        ]
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!jwtRefreshSecret) {
        throw new AppError('Server configuration error', 500);
      }

      const decoded = require('jsonwebtoken').verify(refreshToken, jwtRefreshSecret);
      
      // Get user details
      const userResult = await query(
        'SELECT id, email, role, first_name, last_name FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = userResult.rows[0];
      const newToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user.id);

      res.json({
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    // Get current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userResult.rows[0];

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  }
);
