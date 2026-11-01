import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  createOrder,
  getOrderById,
  getRecentOrders,
  advanceTrackingStage,
} from '../controllers/orderController';

const router = Router();

// Razorpay Payment Endpoints
router.post('/create-razorpay-order', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);

// Standard Order Endpoints
router.post('/create', createOrder);
router.get('/', getRecentOrders);
router.get('/:orderId', getOrderById);

// Live Tracking Simulation Checkpoint Endpoint
router.patch('/:orderId/advance-stage', advanceTrackingStage);

export default router;
