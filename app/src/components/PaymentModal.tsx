import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';
import { CreditCard, Loader2, X, Lock } from 'lucide-react';

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

const StripePaymentForm = ({ clientSecret, onSuccess, onError }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payments/success`,
      },
      redirect: 'if_required' 
    });

    if (submitError) {
      onError(submitError.message || 'Erro ao processar pagamento.');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
       // Requires redirect or processing
       setProcessing(false); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        disabled={!stripe || processing}
        className="w-full py-3 px-4 bg-99blue text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-all"
      >
        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" /> Pagar com Segurança</>}
      </button>
    </form>
  );
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, plan, onSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-initiate Stripe when modal opens
  useEffect(() => {
    if (isOpen) {
      initiateStripe();
    } else {
      setStripeClientSecret(null);
      setError(null);
    }
  }, [isOpen, plan]);

  const initiateStripe = async () => {
    setLoading(true);
    setError(null);
    try {
      // Force HTTPS logic or relative path
      let apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        if (window.location.hostname === 'localhost') {
            apiUrl = 'http://localhost:8000/api';
        } else {
            apiUrl = window.location.origin + '/api';
        }
      }

      const storedToken = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch(`${apiUrl}/payments.php?action=create_payment_intent_stripe`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `Plano ${plan.name}`,
          price: parseFloat(plan.price.toString().replace(',', '.')),
          type: 'subscription',
          plan: plan.id
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = `Server error ${res.status}`;
        try {
            const jsonErr = JSON.parse(errorText);
            if (jsonErr.error) errorMsg = jsonErr.error;
        } catch (e) {
            errorMsg += `: ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      if (data.clientSecret) {
        setStripeClientSecret(data.clientSecret);
      } else {
        throw new Error('Falha ao obter chave de pagamento do servidor.');
      }
    } catch (e: any) {
      console.error("Payment initialization error:", e);
      setError(e.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Assinar {plan.name}</h2>
        <div className="flex justify-between items-baseline mb-6 border-b pb-4">
             <span className="text-gray-600">Total a pagar:</span>
             <span className="text-xl font-bold text-99blue">R$ {plan.price}</span>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-sm">
            <p className="font-bold">Erro ao iniciar pagamento:</p>
            <p>{error}</p>
            <button 
                onClick={initiateStripe} 
                className="mt-2 text-99blue hover:underline font-semibold"
            >
                Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-99blue animate-spin mb-4" />
            <p className="text-gray-500">Preparando pagamento seguro...</p>
          </div>
        ) : stripeClientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
             <StripePaymentForm 
                clientSecret={stripeClientSecret} 
                onSuccess={() => {
                    alert('Pagamento aprovado! Suas conexões foram liberadas.');
                    onSuccess();
                    onClose();
                }}
                onError={(msg) => setError(msg)}
             />
          </Elements>
        ) : null}
        
        <div className="mt-6 flex justify-center items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            <span>Pagamento processado via Stripe SSL Seguro</span>
        </div>
      </div>
    </div>
  );
}
