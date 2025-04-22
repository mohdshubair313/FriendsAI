export interface FeedbackData {
    name: string;
    email: string;
    message: string;
  }
  
  export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }
  
  export interface RazorpayInstance {
    open: () => void;
  }
  
  export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
    theme: {
      color: string;
    };
  }
  
  // ✅ Global type extension (place this here or in global.d.ts)
  declare global {
    interface Window {
      Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
  }
  