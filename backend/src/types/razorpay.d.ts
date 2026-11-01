declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
    headers?: Record<string, string>;
  }

  interface OrderCreateOptions {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, any>;
    partial_payment?: boolean;
    [key: string]: any;
  }

  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, any>;
    created_at: number;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(options: OrderCreateOptions, callback?: (err: any, order: RazorpayOrder) => void): Promise<RazorpayOrder>;
      fetch(orderId: string, callback?: (err: any, order: RazorpayOrder) => void): Promise<RazorpayOrder>;
      all(options?: any, callback?: (err: any, orders: any) => void): Promise<any>;
    };
    payments: any;
  }

  export = Razorpay;
}
