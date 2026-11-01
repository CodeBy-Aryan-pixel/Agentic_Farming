import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'farmer' | 'admin';

export interface IUser extends Document {
  fullName: string;
  phone?: string; // 10-digit Indian Mobile Number
  email?: string; // Registered Email Address
  identifier: string; // Registered email address or 10-digit mobile number (backward compat)
  password?: string;
  role: UserRole;
  district: string;
  farmSizeAcres?: number;
  primaryCrop?: string;
  kisanId?: string;
  department?: string; // For Admin role
  notificationsSent?: {
    sms: boolean;
    email: boolean;
    sentAt?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, '10-digit mobile number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    identifier: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Security: Never return password hash in default queries
    },
    role: {
      type: String,
      enum: {
        values: ['farmer', 'admin'],
        message: '{VALUE} is not a valid role. Allowed roles are: farmer, admin',
      },
      default: 'farmer',
      required: true,
      index: true,
    },
    district: {
      type: String,
      default: 'Kolhapur, MH',
      trim: true,
    },
    farmSizeAcres: {
      type: Number,
      default: 5.0,
      min: [0.1, 'Farm size must be greater than 0'],
    },
    primaryCrop: {
      type: String,
      default: 'Sugarcane',
      trim: true,
    },
    kisanId: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    notificationsSent: {
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      sentAt: { type: Date },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Pre-Save Password Hashing Hook ──────────────────────────────────
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }

  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);
  this.password = await bcrypt.hash(this.password, salt);
});

// ─── Instance Method: Secure Password Comparison ──────────────────────
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// ─── Pre-seed Default Verified Evaluator Accounts ────────────────────
export async function seedDefaultAccounts(): Promise<void> {
  try {
    // 1. Default Farmer
    const existingFarmer = await User.findOne({
      $or: [
        { identifier: 'farmer@futurefarming.in' },
        { email: 'farmer@futurefarming.in' },
        { phone: '9876543210' },
      ],
    });

    if (!existingFarmer) {
      await User.create({
        fullName: 'Ramesh Patil',
        phone: '9876543210',
        email: 'farmer@futurefarming.in',
        identifier: 'farmer@futurefarming.in',
        password: 'Farmer@123',
        role: 'farmer',
        district: 'Kolhapur, MH',
        farmSizeAcres: 5.0,
        primaryCrop: 'Sugarcane',
        kisanId: 'FF-MH-2026-8841',
      });
      console.log('[Database Seed] Pre-seeded Default Farmer (farmer@futurefarming.in / 9876543210)');
    } else if (!existingFarmer.phone || !existingFarmer.email) {
      await User.updateOne(
        { _id: existingFarmer._id },
        { $set: { phone: '9876543210', email: 'farmer@futurefarming.in' } }
      );
    }

    // 2. Default Admin
    const existingAdmin = await User.findOne({
      $or: [
        { identifier: 'admin@futurefarming.in' },
        { email: 'admin@futurefarming.in' },
        { phone: '9999999999' },
      ],
    });

    if (!existingAdmin) {
      await User.create({
        fullName: 'Dr. Sunita Deshmukh',
        phone: '9999999999',
        email: 'admin@futurefarming.in',
        identifier: 'admin@futurefarming.in',
        password: 'Admin@123',
        role: 'admin',
        district: 'Pune, MH',
        department: 'District Agriculture & Pathology Command',
        kisanId: 'FF-ADMIN-2026-0001',
      });
      console.log('[Database Seed] Pre-seeded Default Admin (admin@futurefarming.in / 9999999999)');
    } else if (!existingAdmin.phone || !existingAdmin.email) {
      await User.updateOne(
        { _id: existingAdmin._id },
        { $set: { phone: '9999999999', email: 'admin@futurefarming.in' } }
      );
    }
  } catch (err: any) {
    console.warn(`[Database Seed Warning] Pre-seeding default accounts skipped: ${err.message}`);
  }
}

export default User;
