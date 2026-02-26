// Razorpay Payment Integration
// Note: Add your actual credentials to .env file (DO NOT commit with real values)

const RAZORPAY_KEY_ID = (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_S4waRmpOGwrvyl';

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiateRazorpayPayment = async ({
  amount,
  currency = 'INR',
  description,
  receipt,
  patientName,
  patientEmail,
  patientPhone,
  onSuccess,
  onFailure
}: {
  amount: number;
  currency?: string;
  description: string;
  receipt: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}) => {
  const isLoaded = await loadRazorpayScript();
  
  if (!isLoaded) {
    onFailure({ error: 'Failed to load Razorpay' });
    return;
  }

  // For test mode without backend, don't include order_id
  // Razorpay will auto-generate one
  const options: any = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100, // Razorpay expects amount in paise
    currency,
    name: 'Hospital Management',
    description,
    handler: function (response: any) {
      onSuccess(response);
    },
    prefill: {
      name: patientName,
      email: patientEmail || '',
      contact: patientPhone || ''
    },
    theme: {
      color: '#2563eb'
    },
    modal: {
      ondismiss: function() {
        console.log('Payment modal closed');
      }
    }
  };
  
  // Only add order_id if it's a proper Razorpay order ID (starts with order_)
  // Otherwise, Razorpay will auto-generate one for test mode
  if (receipt && receipt.startsWith('order_')) {
    options.order_id = receipt;
  }

  try {
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (error) {
    onFailure(error);
  }
};

// For server-side order creation (if you have a backend endpoint)
export const createRazorpayOrder = async ({
  amount,
  receipt,
  notes
}: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}) => {
  try {
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // in paise
        currency: 'INR',
        receipt,
        notes
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export default {
  loadRazorpayScript,
  initiateRazorpayPayment,
  createRazorpayOrder
};