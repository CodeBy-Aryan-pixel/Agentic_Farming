import mongoose, { Document, Model, Schema } from 'mongoose';
import { UserRole } from './User';

export type ActivityType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'AUTH'
  | 'CROP_SCAN'
  | 'AGRI_ORDER'
  | 'IRRIGATION'
  | 'SCHEME_CHECK'
  | 'ADMIN_ALERT'
  | 'NOTIFICATION_DISPATCH';

export type ActivityStatus =
  | 'Completed'
  | 'Action Required'
  | 'Dispatched'
  | 'Verified';

export interface IActivityLog extends Document {
  type: ActivityType;
  title: string;
  details: string;
  status: ActivityStatus;
  userName: string;
  userRole: UserRole;
  district: string;
  userId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'REGISTER',
        'AUTH',
        'CROP_SCAN',
        'AGRI_ORDER',
        'IRRIGATION',
        'SCHEME_CHECK',
        'ADMIN_ALERT',
        'NOTIFICATION_DISPATCH',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Completed', 'Action Required', 'Dispatched', 'Verified'],
      default: 'Completed',
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userRole: {
      type: String,
      enum: ['farmer', 'admin'],
      required: true,
      index: true,
    },
    district: {
      type: String,
      default: 'Kolhapur, MH',
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for fast timeline queries
ActivityLogSchema.index({ createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;
