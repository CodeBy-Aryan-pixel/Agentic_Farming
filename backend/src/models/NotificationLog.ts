import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotificationLog extends Document {
  userId?: mongoose.Types.ObjectId;
  phone: string;
  email: string;
  smsMessage: string;
  smsGateway: string;
  smsStatus: string;
  emailSubject: string;
  emailPreviewUrl?: string;
  emailStatus: string;
  status: 'DISPATCHED' | 'DISPATCHED_SANDBOX' | 'FAILED' | 'PARTIAL';
  createdAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    smsMessage: {
      type: String,
      required: true,
    },
    smsGateway: {
      type: String,
      default: 'SANDBOX',
    },
    smsStatus: {
      type: String,
      default: 'DISPATCHED_SANDBOX',
    },
    emailSubject: {
      type: String,
      required: true,
    },
    emailPreviewUrl: {
      type: String,
    },
    emailStatus: {
      type: String,
      default: 'SENT',
    },
    status: {
      type: String,
      enum: ['DISPATCHED', 'DISPATCHED_SANDBOX', 'FAILED', 'PARTIAL'],
      default: 'DISPATCHED',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'notification_logs',
  }
);

export const NotificationLog: Model<INotificationLog> =
  mongoose.models.NotificationLog ||
  mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);

export default NotificationLog;
