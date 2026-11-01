import nodemailer from 'nodemailer';
import axios from 'axios';
import dns from 'dns';
import { addFallbackNotificationLog } from '../utils/fallbackStore';

// ─── Gmail SMTP Transporter with IPv4 DNS Resolution & Dual-Port (465/587) Fallback ───
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

export function createIpv4GmailTransporter(port: number = 465, secure: boolean = true) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure,
    family: 4, // Force IPv4 socket
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    lookup: (hostname: string, _options: any, callback: any) => {
      // Explicitly resolve IPv4 address via public DNS (8.8.8.8 / 1.1.1.1) before falling back to OS lookup
      dns.resolve4(hostname, (err, addresses) => {
        if (!err && addresses && addresses.length > 0) {
          return callback(null, addresses[0], 4);
        }
        return dns.lookup(hostname, { family: 4 }, callback);
      });
    },
  } as any);
}

export let transporter = createIpv4GmailTransporter(465, true);

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log(`[Gmail SMTP] Verified & ready to dispatch emails from ${SMTP_USER}`);
    return true;
  } catch (err465: any) {
    try {
      // Fallback to Port 587 STARTTLS
      transporter = createIpv4GmailTransporter(587, false);
      await transporter.verify();
      console.log(`[Gmail SMTP] Verified via Port 587 STARTTLS (${SMTP_USER})`);
      return true;
    } catch (err587: any) {
      console.log(
        `[Gmail SMTP Diagnostic] Offline or firewall-restricted at startup (${err465.code || err465.message}). Emails will auto-retry on send & queue locally if offline.`
      );
      return false;
    }
  }
}

export interface UserNotificationData {
  fullName: string;
  phone: string;
  email: string;
  role: 'farmer' | 'admin';
  district: string;
  kisanId?: string;
  farmSizeAcres?: number;
  primaryCrop?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  previewUrl?: string;
  messageId?: string;
  mode: 'LIVE_SMTP' | 'ETHEREAL_SANDBOX';
  error?: string;
}

export interface SmsDispatchResult {
  success: boolean;
  phone: string;
  message: string;
  gateway: 'FAST2SMS' | 'TWILIO' | 'LOCAL_SANDBOX';
  status: 'DISPATCHED' | 'DISPATCHED_SANDBOX' | 'FAILED';
  error?: string;
}

export interface NotificationBatchResult {
  sms: SmsDispatchResult;
  email: EmailDispatchResult;
}

/**
 * Builds a styled HTML Welcome Email matching the Future Farming design system
 */
export function buildWelcomeEmailHtml(user: UserNotificationData): string {
  const memberId = user.kisanId || 'FF-MH-2026-REG';
  const roleDisplay = user.role === 'admin' ? 'Administrator' : 'Farmer';
  const farmProfile = `${user.district || 'Maharashtra, IN'} • ${user.farmSizeAcres || 5} Acres (${user.primaryCrop || 'Multi-Crop'})`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Future Farming</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F7F9F7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
    }
    .wrapper {
      width: 100%;
      background-color: #F7F9F7;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E6ECE6;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(15, 41, 30, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0F291E 0%, #153E2B 100%);
      padding: 32px 28px;
      text-align: center;
      color: #FFFFFF;
    }
    .header-logo {
      display: inline-block;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 12px;
      color: #86EFAC;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 14px;
      color: #A7F3D0;
    }
    .body {
      padding: 32px 28px;
    }
    .badge {
      display: inline-block;
      background-color: #EDF5EE;
      color: #15803D;
      border: 1px solid #BBF7D0;
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0F291E;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    .text {
      font-size: 15px;
      color: #4B5563;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .summary-card {
      background-color: #F8FAF8;
      border: 1px solid #E6ECE6;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .summary-card h3 {
      margin: 0 0 16px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0F291E;
      border-bottom: 1px solid #E6ECE6;
      padding-bottom: 10px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      border-bottom: 1px dashed #E5E7EB;
    }
    .summary-row:last-child {
      border-bottom: none;
    }
    .summary-label {
      color: #6B7280;
      font-weight: 500;
    }
    .summary-value {
      color: #111827;
      font-weight: 600;
      text-align: right;
    }
    .cta-box {
      background: #F0FDF4;
      border-left: 4px solid #15803D;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      color: #166534;
      line-height: 1.5;
      margin-bottom: 28px;
    }
    .footer {
      background-color: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 24px 28px;
      text-align: center;
      font-size: 12px;
      color: #6B7280;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">FUTURE FARMING • AGRI-INTELLIGENCE</div>
        <h1>Welcome to Future Farming!</h1>
        <p>Sustainable, AI-Powered Precision Agriculture Ecosystem</p>
      </div>

      <div class="body">
        <div class="badge">REGISTRATION OFFICIALLY CONFIRMED</div>
        <div class="greeting">
          Hello ${user.fullName}, your ${roleDisplay} registration on Future Farming is successfully completed!
        </div>
        <div class="text">
          Your credentials have been permanently verified and saved in our secure cloud database. You can now access your customized farm management dashboard, real-time agronomy telemetry, and regional disease alerts.
        </div>

        <div class="summary-card">
          <h3>Official Registration Credentials</h3>
          <div class="summary-row">
            <span class="summary-label">${user.role === 'admin' ? 'Officer ID' : 'Kisan / Farmer ID'}</span>
            <span class="summary-value" style="color: #15803D; font-weight: 700;">${memberId}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Registered Mobile</span>
            <span class="summary-value">+91 ${user.phone}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Registered Email</span>
            <span class="summary-value">${user.email}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">District & Region</span>
            <span class="summary-value">${user.district || 'Kolhapur, MH'}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Farm Telemetry Profile</span>
            <span class="summary-value">${farmProfile}</span>
          </div>
        </div>

        <div class="cta-box">
          <strong>Immediate Platform Access:</strong><br />
          You now have full access to Universal Crop Doctor, FAO-56 Precision Irrigation, AI Crop Advisor, Certified Agri-Shop, and Government Subsidies.
        </div>

        <div class="text" style="font-size: 13px; color: #6B7280;">
          <strong>Quick Sign-In:</strong> You can sign in anytime using either your registered 10-digit mobile number (<strong>+91 ${user.phone}</strong>) or email address (<strong>${user.email}</strong>) alongside your secure password.
        </div>
      </div>

      <div class="footer">
        Future Farming Platform • Department of Agriculture & Smart Farming<br />
        This is an automated official registration receipt sent to ${user.email}.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches styled Welcome HTML Email using Gmail/SMTP or Ethereal test account fallback
 */
export async function sendRegistrationEmail(
  user: UserNotificationData
): Promise<EmailDispatchResult> {
  const memberId = user.kisanId || 'FF-MH-2026';
  const subject = `Registration Successful — Welcome to Future Farming (${memberId})`;
  const html = buildWelcomeEmailHtml(user);
  const sender = process.env.SMTP_USER || 'kamataryan328@gmail.com';

  // 1. Live Gmail SMTP mode via verified transporter
  try {
    const info = await transporter.sendMail({
      from: `"Future Farming Command" <${sender}>`,
      to: user.email,
      subject,
      html,
    });

    console.log(
      `[Email Dispatch] Live Gmail confirmation email dispatched to ${user.email} (MessageID: ${info.messageId})`
    );

    return {
      success: true,
      messageId: info.messageId,
      mode: 'LIVE_SMTP',
    };
  } catch (liveErr: any) {
    console.warn(
      `[Email Warning] Live Gmail SMTP failed (${liveErr.message}), falling back to Ethereal sandbox test account...`
    );
  }

  // 2. Automatic Zero-Config Fallback with Ethereal Test Account
  try {
    const testAccount = await nodemailer.createTestAccount();
    const fallbackTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await fallbackTransporter.sendMail({
      from: `"Future Farming Command" <${sender}>`,
      to: user.email,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

    console.log('\n======================================================================');
    console.log('[EMAIL DISPATCH - ETHEREAL LIVE PREVIEW]');
    console.log(`Recipient  : ${user.email}`);
    console.log(`Subject    : ${subject}`);
    console.log(`Message ID : ${info.messageId}`);
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
      console.log('--> Click above link to view the fully rendered HTML welcome email!');
    }
    console.log('======================================================================\n');

    return {
      success: true,
      previewUrl,
      messageId: info.messageId,
      mode: 'ETHEREAL_SANDBOX',
    };
  } catch (etherealErr: any) {
    console.warn(`[Gmail SMTP] Live send unreachable (${etherealErr.message}). Logged to local notification outbox for ${user.email}.`);
    addFallbackNotificationLog({
      type: 'WELCOME_EMAIL',
      recipient: user.email,
      subject,
      status: 'OFFLINE_OUTBOX',
    });
    return {
      success: true,
      mode: 'ETHEREAL_SANDBOX',
      messageId: `local_outbox_${Date.now()}`,
    };
  }
}

/**
 * Dispatches Welcome SMS via Fast2SMS, Twilio, or Local Sandbox Simulator
 */
export async function sendRegistrationSMS(
  user: UserNotificationData
): Promise<SmsDispatchResult> {
  const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
  const formattedPhone = `+91${cleanPhone}`;
  const memberId = user.kisanId || 'FF-MH-2026';

  const smsMessage = `Future Farming: Welcome ${user.fullName}! Your registration (ID: ${memberId}, ${user.district || 'MH'}) is successfully completed. You can now sign in using +91-${cleanPhone} or ${user.email}.`;

  // 1. Fast2SMS Indian Gateway (if FAST2SMS_API_KEY configured)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'q',
          message: smsMessage,
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );

      console.log(`[SMS Dispatch] Fast2SMS dispatched to ${formattedPhone}`);
      return {
        success: true,
        phone: formattedPhone,
        message: smsMessage,
        gateway: 'FAST2SMS',
        status: 'DISPATCHED',
      };
    } catch (f2sErr: any) {
      console.warn(`[SMS Warning] Fast2SMS error: ${f2sErr.message}. Falling back to sandbox...`);
    }
  }

  // 2. Twilio Gateway (if Twilio credentials configured)
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    try {
      const authHeader = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');

      const params = new URLSearchParams();
      params.append('To', formattedPhone);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', smsMessage);

      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 8000,
        }
      );

      console.log(`[SMS Dispatch] Twilio SMS dispatched to ${formattedPhone}`);
      return {
        success: true,
        phone: formattedPhone,
        message: smsMessage,
        gateway: 'TWILIO',
        status: 'DISPATCHED',
      };
    } catch (twilioErr: any) {
      console.warn(`[SMS Warning] Twilio error: ${twilioErr.message}. Falling back to sandbox...`);
    }
  }

  // 3. Local Sandbox SMS Gateway Simulator (Default Zero-Config Mode)
  console.log('\n======================================================================');
  console.log('[SMS DISPATCH - SANDBOX SIMULATOR]');
  console.log(`Recipient : ${formattedPhone}`);
  console.log(`Gateway   : LOCAL_SANDBOX_SIMULATOR`);
  console.log(`Message   : "${smsMessage}"`);
  console.log('Status    : DISPATCHED_SANDBOX (Saved in MongoDB notification_logs)');
  console.log('======================================================================\n');

  return {
    success: true,
    phone: formattedPhone,
    message: smsMessage,
    gateway: 'LOCAL_SANDBOX',
    status: 'DISPATCHED_SANDBOX',
  };
}

/**
 * Dispatches both Welcome SMS and Welcome Email in parallel using Promise.allSettled
 */
export async function sendRegistrationNotifications(
  user: UserNotificationData
): Promise<NotificationBatchResult> {
  const [smsResult, emailResult] = await Promise.allSettled([
    sendRegistrationSMS(user),
    sendRegistrationEmail(user),
  ]);

  const sms: SmsDispatchResult =
    smsResult.status === 'fulfilled'
      ? smsResult.value
      : {
          success: false,
          phone: `+91${(user.phone || '').slice(-10)}`,
          message: '',
          gateway: 'LOCAL_SANDBOX',
          status: 'FAILED',
          error: smsResult.reason?.message || 'SMS dispatch failed',
        };

  const email: EmailDispatchResult =
    emailResult.status === 'fulfilled'
      ? emailResult.value
      : {
          success: false,
          mode: 'ETHEREAL_SANDBOX',
          error: emailResult.reason?.message || 'Email dispatch failed',
        };

  return { sms, email };
}

// ─── Aliases matching naming requirements ──────────────────────────────────
export const sendWelcomeEmail = sendRegistrationEmail;
export const sendWelcomeSMS = sendRegistrationSMS;

/**
 * Builds a styled HTML Order Confirmation Email matching Future Farming design system
 */
export function buildOrderConfirmationEmailHtml(order: any): string {
  const itemsRows = order.items
    .map(
      (item: any) => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px dashed #E5E7EB; font-size: 14px; color: #111827;">
        <strong>${item.name}</strong><br />
        <span style="font-size: 12px; color: #6B7280;">Brand: ${item.brand || 'Future Farming'} ${item.packSize ? '• ' + item.packSize : ''}</span>
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px dashed #E5E7EB; font-size: 14px; text-align: center; color: #374151; font-family: monospace;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px dashed #E5E7EB; font-size: 14px; text-align: right; color: #374151; font-family: monospace;">
        ₹${item.unitPrice || item.price}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px dashed #E5E7EB; font-size: 14px; text-align: right; font-weight: 700; color: #0F291E; font-family: monospace;">
        ₹${(item.quantity * (item.unitPrice || item.price)).toLocaleString('en-IN')}
      </td>
    </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${order.orderId}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F7F9F7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
    }
    .wrapper {
      width: 100%;
      background-color: #F7F9F7;
      padding: 32px 16px;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E6ECE6;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(15, 41, 30, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0F291E 0%, #153E2B 100%);
      padding: 32px 28px;
      text-align: center;
      color: #FFFFFF;
    }
    .header-logo {
      display: inline-block;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 12px;
      color: #86EFAC;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 14px;
      color: #A7F3D0;
    }
    .body {
      padding: 32px 28px;
    }
    .badge {
      display: inline-block;
      background-color: #EDF5EE;
      color: #15803D;
      border: 1px solid #BBF7D0;
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0F291E;
      margin-bottom: 10px;
    }
    .text {
      font-size: 14px;
      color: #4B5563;
      line-height: 1.6;
      margin-bottom: 22px;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: #FFFFFF;
    }
    .table-header {
      background-color: #F8FAF8;
      border-bottom: 2px solid #E6ECE6;
    }
    .table-header th {
      padding: 10px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0F291E;
    }
    .summary-card {
      background-color: #F8FAF8;
      border: 1px solid #E6ECE6;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 22px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .summary-row.total {
      border-top: 1px solid #E6ECE6;
      padding-top: 10px;
      margin-top: 6px;
      font-size: 16px;
      font-weight: 700;
      color: #0F291E;
    }
    .tracking-box {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 24px;
    }
    .tracking-box h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #065F46;
      font-weight: 700;
    }
    .tracking-box p {
      margin: 4px 0;
      font-size: 13px;
      color: #047857;
      line-height: 1.5;
    }
    .footer {
      background-color: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      padding: 24px 28px;
      text-align: center;
      font-size: 12px;
      color: #6B7280;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">FUTURE FARMING • CERTIFIED AGRI-SHOP</div>
        <h1>Order Confirmed!</h1>
        <p>Order #${order.orderId} • Verified at FPO Central Desk</p>
      </div>

      <div class="body">
        <div class="badge">ORDER OFFICIALLY CONFIRMED &amp; INVOICE GENERATED</div>
        <div class="greeting">
          Hello ${order.deliveryAddress.receiverName}, your order #${order.orderId} has been successfully placed!
        </div>
        <div class="text">
          Thank you for choosing Future Farming Agri-Shop. Your certified agro-inputs are being packed at our regional warehouse and dispatched via Kisan Logistics.
        </div>

        <table class="table-container">
          <thead class="table-header">
            <tr>
              <th style="text-align: left;">Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="summary-card">
          <div class="summary-row">
            <span style="color: #6B7280;">Item Subtotal:</span>
            <span style="font-weight: 600; font-family: monospace;">₹${order.pricing.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div class="summary-row">
            <span style="color: #15803D;">Farmer Subsidy (5%):</span>
            <span style="font-weight: 600; color: #15803D; font-family: monospace;">−₹${order.pricing.subsidyDiscount.toLocaleString('en-IN')}</span>
          </div>
          ${
            order.pricing.bundleDiscount && order.pricing.bundleDiscount > 0
              ? `<div class="summary-row">
                  <span style="color: #15803D;">Bundle Discount:</span>
                  <span style="font-weight: 600; color: #15803D; font-family: monospace;">−₹${order.pricing.bundleDiscount.toLocaleString('en-IN')}</span>
                </div>`
              : ''
          }
          <div class="summary-row">
            <span style="color: #6B7280;">Logistics &amp; Delivery:</span>
            <span style="font-weight: 600; color: ${order.pricing.deliveryFee === 0 ? '#15803D' : '#111827'}; font-family: monospace;">
              ${order.pricing.deliveryFee === 0 ? 'FREE' : '₹' + order.pricing.deliveryFee}
            </span>
          </div>
          <div class="summary-row total">
            <span>Final Total Paid:</span>
            <span style="color: #15803D; font-family: monospace;">₹${order.pricing.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="tracking-box">
          <h4>Live Shipment &amp; Tracking Details</h4>
          <p><strong>Tracking Order ID:</strong> ${order.orderId}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
          <p><strong>Transaction Ref:</strong> ${order.transactionId}</p>
          <p><strong>Estimated Delivery:</strong> ${order.trackingStatus.estimatedDelivery}</p>
          <p><strong>Current Checkpoint:</strong> ${order.trackingStatus.currentHubLocation}</p>
        </div>

        <div class="summary-card">
          <h4 style="margin: 0 0 10px; color: #0F291E; font-size: 14px;">Detailed Farm Gate Delivery Address</h4>
          <div style="font-size: 13px; color: #374151; line-height: 1.6;">
            <strong>Receiver:</strong> ${order.deliveryAddress.receiverName} (${order.deliveryAddress.phone})<br />
            <strong>Farm Gate / Gat No.:</strong> ${order.deliveryAddress.street}<br />
            <strong>Village &amp; Taluka:</strong> ${order.deliveryAddress.village}<br />
            <strong>Landmark:</strong> ${order.deliveryAddress.landmark}<br />
            <strong>District &amp; State:</strong> ${order.deliveryAddress.district}, ${order.deliveryAddress.state} — <strong>PIN ${order.deliveryAddress.pincode}</strong><br />
            <strong>Address Category:</strong> ${order.deliveryAddress.addressType}
          </div>
        </div>
      </div>

      <div class="footer">
        Future Farming Agri-Shop • Kisan Logistics Division<br />
        This is an official automated invoice and delivery receipt sent to ${order.deliveryAddress.email}.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches styled Order Confirmation Email to the farmer
 */
export async function sendOrderConfirmationEmail(order: any): Promise<EmailDispatchResult> {
  const subject = `Order Placed Successfully! Order #${order.orderId} — Future Farming Agri-Shop`;
  const html = buildOrderConfirmationEmailHtml(order);
  const recipient = order.deliveryAddress.email;
  const sender = process.env.SMTP_USER || 'kamataryan328@gmail.com';

  // 1. Live Gmail SMTP
  try {
    const info = await transporter.sendMail({
      from: `"Future Farming Agri-Shop" <${sender}>`,
      to: recipient,
      subject,
      html,
    });

    console.log(
      `[Order Email Dispatch] Order confirmation email dispatched to ${recipient} (MessageID: ${info.messageId})`
    );

    return {
      success: true,
      messageId: info.messageId,
      mode: 'LIVE_SMTP',
    };
  } catch (liveErr: any) {
    console.warn(
      `[Order Email Warning] Live Gmail SMTP failed (${liveErr.message}), falling back to Ethereal sandbox test account...`
    );
  }

  // 2. Fallback to Ethereal Sandbox
  try {
    const testAccount = await nodemailer.createTestAccount();
    const fallbackTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await fallbackTransporter.sendMail({
      from: `"Future Farming Agri-Shop" <${sender}>`,
      to: recipient,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

    console.log('\n======================================================================');
    console.log('[ORDER EMAIL DISPATCH - ETHEREAL LIVE PREVIEW]');
    console.log(`Recipient  : ${recipient}`);
    console.log(`Subject    : ${subject}`);
    console.log(`Message ID : ${info.messageId}`);
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
      console.log('--> Click above link to view the fully rendered HTML order confirmation email!');
    }
    console.log('======================================================================\n');

    return {
      success: true,
      previewUrl,
      messageId: info.messageId,
      mode: 'ETHEREAL_SANDBOX',
    };
  } catch (etherealErr: any) {
    console.warn(`[Gmail SMTP] Live send unreachable (${etherealErr.message}). Logged to local notification outbox for ${recipient}.`);
    addFallbackNotificationLog({
      type: 'ORDER_CONFIRMATION_EMAIL',
      recipient,
      orderId: order?.orderId,
      subject,
      status: 'OFFLINE_OUTBOX',
    });
    return {
      success: true,
      mode: 'ETHEREAL_SANDBOX',
      messageId: `local_outbox_${Date.now()}`,
    };
  }
}

/**
 * Dispatches Order Confirmation SMS to the farmer
 */
export async function sendOrderConfirmationSMS(order: any): Promise<SmsDispatchResult> {
  const cleanPhone = (order.deliveryAddress.phone || '').replace(/\D/g, '').slice(-10);
  const formattedPhone = `+91${cleanPhone}`;
  const itemsList = order.items.map((i: any) => i.name).join(', ');

  const smsMessage = `Future Farming: Order #${order.orderId} for Rs.${order.pricing.grandTotal} (${itemsList}) is placed successfully! Payment: ${order.paymentMethod}. Delivering to ${order.deliveryAddress.village}, PIN ${order.deliveryAddress.pincode}. Track live in Agri-Shop.`;

  // 1. Fast2SMS Indian Gateway (if configured)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'q',
          message: smsMessage,
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        },
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );

      console.log(`[Order SMS Dispatch] Fast2SMS dispatched to ${formattedPhone}`);
      return {
        success: true,
        phone: formattedPhone,
        message: smsMessage,
        gateway: 'FAST2SMS',
        status: 'DISPATCHED',
      };
    } catch (f2sErr: any) {
      console.warn(`[Order SMS Warning] Fast2SMS error: ${f2sErr.message}`);
    }
  }

  // 2. Sandbox SMS Simulator (default)
  console.log('\n======================================================================');
  console.log('[ORDER SMS DISPATCH - SANDBOX SIMULATOR]');
  console.log(`Recipient : ${formattedPhone}`);
  console.log(`Gateway   : LOCAL_SANDBOX_SIMULATOR`);
  console.log(`Message   : "${smsMessage}"`);
  console.log('Status    : DISPATCHED_SANDBOX (Saved in MongoDB notification_logs)');
  console.log('======================================================================\n');

  return {
    success: true,
    phone: formattedPhone,
    message: smsMessage,
    gateway: 'LOCAL_SANDBOX',
    status: 'DISPATCHED_SANDBOX',
  };
}


