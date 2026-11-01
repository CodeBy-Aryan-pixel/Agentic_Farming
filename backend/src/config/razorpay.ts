import Razorpay from 'razorpay';

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('[razorpay] WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in environment. Payment features will be disabled.');
}

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export default razorpayInstance;
