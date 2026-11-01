import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser, UserRole } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { NotificationLog } from '../models/NotificationLog';
import {
  sendRegistrationNotifications,
  sendRegistrationEmail,
} from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { isDatabaseConnected } from '../config/db';
import {
  getFallbackUserByQuery,
  saveFallbackUser,
  addFallbackActivityLog,
  readStore,
} from '../utils/fallbackStore';

const JWT_SECRET =
  process.env.JWT_SECRET || 'future_farming_super_secure_jwt_secret_key_2026_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_ACCESS_CODE = 'FF-ADMIN-2026';

/**
 * Signs a secure JSON Web Token
 */
export function generateToken(id: string, role: UserRole): string {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

/**
 * POST /api/auth/register
 * Registers a new Farmer or Admin account with strict validation
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const {
      fullName,
      phone,
      email,
      identifier,
      password,
      confirmPassword,
      role = 'farmer',
      district = 'Kolhapur, MH',
      farmSizeAcres = 5.0,
      primaryCrop = 'Sugarcane',
      department,
      adminCode,
    } = req.body;

    const cleanName = (fullName || '').trim();
    const cleanPass = (password || '').trim();
    const cleanConfirm = (confirmPassword || '').trim();

    // 1. Extract and sanitize Phone and Email
    let cleanPhone = (phone || '').trim().replace(/\D/g, '');
    let cleanEmail = (email || '').trim().toLowerCase();
    const cleanId = (identifier || '').trim().toLowerCase();

    // Support fallback from legacy single-input 'identifier' if individual fields were omitted
    if (!cleanPhone && /^\d{10}$/.test(cleanId)) {
      cleanPhone = cleanId;
    }
    if (!cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId)) {
      cleanEmail = cleanId;
    }

    console.log(
      `[MongoDB Auth Register] Incoming registration: fullName="${cleanName}", phone="${cleanPhone}", email="${cleanEmail}", role="${role}", district="${district}"`
    );

    // 2. Validate Full Name
    if (cleanName.length < 2) {
      console.warn(`[MongoDB Auth Register] Rejected: Name "${cleanName}" too short.`);
      res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 characters long.',
      });
      return;
    }

    // 3. Validate 10-Digit Indian Mobile Number
    const isPhoneValid = /^\d{10}$/.test(cleanPhone);
    if (!isPhoneValid) {
      console.warn(`[MongoDB Auth Register] Rejected: Phone "${cleanPhone}" is not a valid 10-digit mobile number.`);
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number (e.g., 9822014481).',
      });
      return;
    }

    // 4. Validate Email Address format
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!isEmailValid) {
      console.warn(`[MongoDB Auth Register] Rejected: Email "${cleanEmail}" format is invalid.`);
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g., farmer@example.com).',
      });
      return;
    }

    // 5. Validate Password length
    if (cleanPass.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    // 6. Validate Password confirmation
    if (cleanConfirm && cleanPass !== cleanConfirm) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match. Please re-enter your password.',
      });
      return;
    }

    // 7. Validate Admin Security Key if registering as Admin
    if (role === 'admin') {
      const cleanAdminCode = (adminCode || '').trim();
      if (cleanAdminCode !== ADMIN_ACCESS_CODE) {
        res.status(403).json({
          success: false,
          message: `Invalid Admin Security Key. Required key: ${ADMIN_ACCESS_CODE}`,
        });
        return;
      }
    }

    // 8. Prevent duplicate accounts & handle offline fallback mode
    if (!isDatabaseConnected()) {
      console.log('[Auth Fallback Active] Handling registration via persistent disk fallback store...');
      const existing = getFallbackUserByQuery({ email: cleanEmail, phone: cleanPhone, identifier: cleanEmail || cleanPhone });
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'An account with this mobile number or email address is already registered. Please sign in.',
        });
        return;
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const kisanId = role === 'admin' ? `FF-ADMIN-2026-${randomNum}` : `FF-MH-2026-${randomNum}`;
      const hashedPassword = await bcrypt.hash(cleanPass, 10);
      const fallbackUser = saveFallbackUser({
        fullName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        identifier: cleanEmail || cleanPhone,
        password: hashedPassword,
        role,
        district,
        farmSizeAcres: Number(farmSizeAcres) || 5.0,
        primaryCrop,
        department: role === 'admin' ? department || 'District Agriculture Office' : undefined,
        kisanId,
        notificationsSent: { sms: true, email: true },
      });

      sendRegistrationNotifications({
        fullName: fallbackUser.fullName,
        phone: cleanPhone,
        email: cleanEmail,
        role: fallbackUser.role,
        district: fallbackUser.district,
        kisanId: fallbackUser.kisanId,
        farmSizeAcres: fallbackUser.farmSizeAcres,
        primaryCrop: fallbackUser.primaryCrop,
      }).catch((e) => console.warn('Notification dispatch fallback notice:', e.message));

      addFallbackActivityLog({
        type: 'REGISTER',
        title: `${role === 'admin' ? 'Admin Officer' : 'Farmer'} Registered (Fallback Mode): ${fallbackUser.fullName}`,
        details: `Account saved to persistent disk store • Region: ${district} • ID: ${fallbackUser.kisanId}`,
        status: 'Verified',
        userName: fallbackUser.fullName,
        userRole: fallbackUser.role,
        district: fallbackUser.district,
        userId: fallbackUser._id,
      });

      const token = generateToken(fallbackUser._id, fallbackUser.role);
      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: fallbackUser,
        notifications: {
          smsSent: true,
          emailSent: true,
          phone: fallbackUser.phone || `+91-${cleanPhone}`,
          email: fallbackUser.email,
        },
      });
      return;
    }

    const duplicateQuery: any[] = [{ email: cleanEmail }, { phone: cleanPhone }];
    if (cleanPhone) duplicateQuery.push({ identifier: cleanPhone });
    if (cleanEmail) duplicateQuery.push({ identifier: cleanEmail });

    const existingUser = await User.findOne({ $or: duplicateQuery });
    if (existingUser) {
      console.warn(
        `[MongoDB Auth Register] Conflict: User already exists with phone "${cleanPhone}" or email "${cleanEmail}" (User ID: ${existingUser._id}, Role: ${existingUser.role}).`
      );
      res.status(409).json({
        success: false,
        message: 'An account with this mobile number or email address is already registered. Please sign in.',
      });
      return;
    }

    // 9. Auto-generate official Kisan / Member ID
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const kisanId =
      role === 'admin'
        ? `FF-ADMIN-2026-${randomNum}`
        : `FF-MH-2026-${randomNum}`;

    // 10. Save the new user permanently to MongoDB Atlas users collection
    console.log(
      `[MongoDB Auth Register] Awaiting insert into database "aggentic_future_farming" collection "users"...`
    );
    const newUser = new User({
      fullName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      identifier: cleanEmail || cleanPhone,
      password: cleanPass,
      role,
      district,
      farmSizeAcres: Number(farmSizeAcres) || 5.0,
      primaryCrop,
      department: role === 'admin' ? department || 'District Agriculture Office' : undefined,
      kisanId,
      notificationsSent: {
        sms: false,
        email: false,
      },
    });

    const savedUser = await newUser.save();
    console.log('Saved user to MongoDB users collection:', savedUser._id);
    saveFallbackUser({ ...(savedUser.toObject ? savedUser.toObject() : savedUser), _id: savedUser._id.toString() } as any);

    // 11. Immediately dispatch Welcome SMS & Welcome HTML Email in parallel
    console.log(
      `[Notifications] Dispatching dual-channel SMS & Email for ${savedUser.fullName} (+91-${cleanPhone} • ${cleanEmail})...`
    );
    const notificationResult = await sendRegistrationNotifications({
      fullName: savedUser.fullName,
      phone: cleanPhone,
      email: cleanEmail,
      role: savedUser.role,
      district: savedUser.district,
      kisanId: savedUser.kisanId,
      farmSizeAcres: savedUser.farmSizeAcres,
      primaryCrop: savedUser.primaryCrop,
    });

    // 12. Update User document with notification status
    savedUser.notificationsSent = {
      sms: notificationResult.sms.success,
      email: notificationResult.email.success,
      sentAt: new Date(),
    };
    await savedUser.save();

    // 13. Save receipt document in MongoDB notification_logs collection
    try {
      await NotificationLog.create({
        userId: savedUser._id,
        phone: cleanPhone,
        email: cleanEmail,
        smsMessage: notificationResult.sms.message,
        smsGateway: notificationResult.sms.gateway,
        smsStatus: notificationResult.sms.status,
        emailSubject: `Registration Successful — Welcome to Future Farming (${savedUser.kisanId})`,
        emailPreviewUrl: notificationResult.email.previewUrl,
        emailStatus: notificationResult.email.mode,
        status:
          notificationResult.sms.success && notificationResult.email.success
            ? 'DISPATCHED'
            : 'PARTIAL',
      });
      console.log(
        `[NotificationLog] Receipt saved in MongoDB collection "notification_logs" (User ID: ${savedUser._id})`
      );
    } catch (notifErr: any) {
      console.warn('[NotificationLog Warning] Could not save notification log:', notifErr.message);
    }

    // 14. Audit log registration & notification dispatch
    try {
      await ActivityLog.create({
        type: 'REGISTER',
        title: `${role === 'admin' ? 'Admin Officer' : 'Farmer'} Registered: ${savedUser.fullName}`,
        details: `Account created in database • Region: ${district} • ID: ${savedUser.kisanId}`,
        status: 'Verified',
        userName: savedUser.fullName,
        userRole: savedUser.role,
        district: savedUser.district,
        userId: savedUser._id,
      });

      await ActivityLog.create({
        type: 'NOTIFICATION_DISPATCH',
        title: `Welcome SMS & Email Dispatched: ${savedUser.fullName}`,
        details: `Welcome SMS & Email Dispatched to ${savedUser.fullName} (+91-${cleanPhone} • ${cleanEmail})`,
        status: 'Dispatched',
        userName: savedUser.fullName,
        userRole: savedUser.role,
        district: savedUser.district,
        userId: savedUser._id,
        metadata: {
          phone: cleanPhone,
          email: cleanEmail,
          smsGateway: notificationResult.sms.gateway,
          emailMode: notificationResult.email.mode,
          emailPreviewUrl: notificationResult.email.previewUrl,
        },
      });
    } catch (logErr: any) {
      console.warn('[ActivityLog Warning] Could not record registration log:', logErr.message);
    }

    // 15. Generate JWT Token
    const token = generateToken(savedUser._id.toString(), savedUser.role);

    // 16. Return full user, token, and notification receipt
    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: savedUser,
      notifications: {
        smsSent: notificationResult.sms.success,
        emailSent: notificationResult.email.success,
        phone: savedUser.phone || `+91-${cleanPhone}`,
        email: savedUser.email,
        emailPreviewUrl: notificationResult.email.previewUrl,
      },
    });
  } catch (err: any) {
    console.error('[Auth Controller Error - Register]:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}

/**
 * GET /api/auth/test-email?to=kamataryan328@gmail.com
 * Diagnostic endpoint to test live Gmail SMTP confirmation email dispatch in one click
 */
export async function testEmail(req: Request, res: Response): Promise<void> {
  try {
    const to =
      (req.query.to as string) ||
      process.env.SMTP_USER ||
      'kamataryan328@gmail.com';

    console.log(`[Test Email Endpoint] Sending live Gmail test confirmation email to: ${to}...`);

    const result = await sendRegistrationEmail({
      fullName: 'Aryan Kamat',
      phone: '9822014481',
      email: to,
      role: 'farmer',
      district: 'Kolhapur, MH',
      kisanId: 'FF-MH-2026-TEST',
      farmSizeAcres: 5.0,
      primaryCrop: 'Sugarcane',
    });

    res.status(200).json({
      success: result.success,
      message: result.success
        ? `Confirmation email successfully sent via ${result.mode} to ${to}`
        : `Email dispatch failed: ${result.error}`,
      mode: result.mode,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
    });
  } catch (error: any) {
    console.error('[Test Email Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch test email',
      error: error.message,
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues a signed JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, password, role = 'farmer', adminCode } = req.body;

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Validate required fields
    if (!cleanId || !cleanPass) {
      res.status(400).json({
        success: false,
        message: 'Please enter both your registered Email/Mobile and Password.',
      });
      return;
    }

    // 2. Validate Admin Key if logging in as Admin
    if (role === 'admin') {
      const cleanAdminCode = (adminCode || '').trim();
      if (cleanAdminCode !== ADMIN_ACCESS_CODE) {
        res.status(403).json({
          success: false,
          message: `Invalid Admin Security Key. Required key: ${ADMIN_ACCESS_CODE}`,
        });
        return;
      }
    }

    // 3. Fallback Mode Login if Atlas Unreachable
    if (!isDatabaseConnected()) {
      console.log('[Auth Fallback Active] Handling login via persistent disk fallback store...');
      const fallbackUser = getFallbackUserByQuery({ identifier: cleanId, email: cleanId, phone: cleanId });
      if (!fallbackUser || (role && fallbackUser.role !== role)) {
        res.status(404).json({
          success: false,
          message: 'Account not found for this role. Please click "Register Now" to create an account first.',
        });
        return;
      }

      if (fallbackUser.password) {
        const isMatch = await bcrypt.compare(cleanPass, fallbackUser.password);
        if (!isMatch) {
          res.status(401).json({
            success: false,
            message: 'Invalid password. Please check your password and try again.',
          });
          return;
        }
      }

      const token = generateToken(fallbackUser._id, fallbackUser.role);
      addFallbackActivityLog({
        type: 'LOGIN',
        title: `${fallbackUser.role === 'admin' ? 'Admin Officer' : 'Farmer'} Login (Fallback): ${fallbackUser.fullName}`,
        details: 'Authenticated via persistent fallback store • Session started',
        status: 'Verified',
        userName: fallbackUser.fullName,
        userRole: fallbackUser.role,
        district: fallbackUser.district,
        userId: fallbackUser._id,
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: {
          id: fallbackUser._id,
          fullName: fallbackUser.fullName,
          phone: fallbackUser.phone,
          email: fallbackUser.email,
          identifier: fallbackUser.identifier,
          role: fallbackUser.role,
          district: fallbackUser.district,
          farmSizeAcres: fallbackUser.farmSizeAcres,
          primaryCrop: fallbackUser.primaryCrop,
          kisanId: fallbackUser.kisanId,
          department: fallbackUser.department,
          createdAt: fallbackUser.createdAt,
        },
      });
      return;
    }

    // 3. Lookup user with password hash explicitly selected (supports phone, email, or legacy identifier)
    let user = await User.findOne({
      $or: [
        { identifier: cleanId },
        { phone: cleanId },
        { email: cleanId },
      ],
      role,
    }).select('+password');

    if (!user) {
      // Secondary check against fallback store (e.g. registered in offline mode or pre-seeded)
      const fbUser = getFallbackUserByQuery({ identifier: cleanId, email: cleanId, phone: cleanId });
      if (fbUser && fbUser.role === role) {
        if (fbUser.password) {
          const isMatch = await bcrypt.compare(cleanPass, fbUser.password);
          if (!isMatch) {
            res.status(401).json({
              success: false,
              message: 'Invalid password. Please check your password and try again.',
            });
            return;
          }
        }
        const token = generateToken(fbUser._id, fbUser.role);
        res.status(200).json({
          success: true,
          message: 'Authentication successful.',
          token,
          user: fbUser,
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Account not found for this role. Please click "Register Now" to create an account first.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact an administrator.',
      });
      return;
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await user.comparePassword(cleanPass);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your password and try again.',
      });
      return;
    }

    // 5. Generate signed JWT token
    const token = generateToken(user._id.toString(), user.role);

    // 6. Audit log login event
    try {
      await ActivityLog.create({
        type: 'LOGIN',
        title: `${user.role === 'admin' ? 'Admin Officer' : 'Farmer'} Login: ${user.fullName}`,
        details: `Authenticated successfully • Session started for ${user.district}`,
        status: 'Verified',
        userName: user.fullName,
        userRole: user.role,
        district: user.district,
        userId: user._id,
      });
    } catch (logErr: any) {
      console.warn('[ActivityLog Warning] Could not record login log:', logErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        identifier: user.identifier,
        role: user.role,
        district: user.district,
        farmSizeAcres: user.farmSizeAcres,
        primaryCrop: user.primaryCrop,
        kisanId: user.kisanId,
        department: user.department,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('[Auth Controller Error - Login]:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}

/**
 * GET /api/auth/me
 * Retrieves profile of currently authenticated user via Bearer token
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User session not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Could not fetch user profile.',
    });
  }
}

/**
 * POST /api/auth/logout
 * Records logout event and terminates session
 */
export async function logout(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    if (req.user) {
      await ActivityLog.create({
        type: 'LOGOUT',
        title: `User Signed Out: ${req.user.fullName}`,
        details: `${req.user.role === 'admin' ? 'Admin Portal Session Terminated' : 'Farmer account session closed'}`,
        status: 'Completed',
        userName: req.user.fullName,
        userRole: req.user.role,
        district: req.user.district,
        userId: req.user._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Signed out successfully.',
    });
  } catch (err: any) {
    res.status(200).json({
      success: true,
      message: 'Signed out.',
    });
  }
}

/**
 * GET /api/auth/logs
 * Retrieves telemetry and security audit logs (Admin Protected)
 */
export async function getActivityLogs(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    if (!isDatabaseConnected()) {
      const fallbackLogs = readStore().activity_logs.slice(0, limit);
      res.status(200).json({
        success: true,
        count: fallbackLogs.length,
        logs: fallbackLogs,
      });
      return;
    }

    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Could not retrieve activity logs.',
    });
  }
}

export default {
  register,
  login,
  getMe,
  logout,
  getActivityLogs,
};
