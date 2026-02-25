import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';

// Componente interno do formulário Stripe
const StripePaymentForm = ({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payments/success`,
      },
      redirect: 'if_required' // Tenta não redirecionar se possível
    });

    if (submitError) {
      setError(submitError.message || 'Erro ao processar pagamento.');
      setProcessing(false);
    } else {
      // Pagamento bem sucedido
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        disabled={!stripe || processing}
        className="w-full py-3 px-4 bg-99blue text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
      >
        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pagar Agora'}
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
  const [method, setMethod] = useState<'stripe' | 'mercadopago' | null>(null);
  const [loading, setLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectMethod = async (selected: 'stripe' | 'mercadopago') => {
    setMethod(selected);
    setLoading(true);

    try {
      const token = localStorage.getItem('token'); // Assumindo JWT
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (selected === 'mercadopago') {
        // Criar preferência no backend
        const res = await fetch(`${import.meta.env.VITE_API_URL}/payments.php?action=create_preference_mp`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: `Plano ${plan.name} - MeuFreelas`,
            price: parseFloat(plan.price.replace(',', '.')),
            type: 'subscription',
            plan: plan.id
          })
        });
        const data = await res.json();
        if (data.init_point) {
          window.location.href = data.init_point; // Redireciona para MP
        }
      } else if (selected === 'stripe') {
        // Criar PaymentIntent no backend
        const res = await fetch(`${import.meta.env.VITE_API_URL}/payments.php?action=create_payment_intent_stripe`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: `Plano ${plan.name}`,
            price: parseFloat(plan.price.replace(',', '.')),
            type: 'subscription',
            plan: plan.id
          })
        });
        const data = await res.json();
        if (data.clientSecret) {
          setStripeClientSecret(data.clientSecret);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Pagamento Seguro</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Você está contratando:</p>
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-bold text-gray-900">Plano {plan.name}</span>
              <span className="text-xl font-bold text-99blue">R$ {plan.price}</span>
            </div>
          </div>

          {!method ? (
            <div className="space-y-4">
              <button
                onClick={() => handleSelectMethod('stripe')}
                className="w-full p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-99blue hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded shadow-sm border border-gray-100">
                    <CreditCard className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-gray-800 group-hover:text-99blue">Stripe</span>
                    <span className="text-sm text-gray-500">Cartão de Crédito</span>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-99blue" />
              </button>

              <button
                onClick={() => handleSelectMethod('mercadopago')}
                className="w-full p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded shadow-sm border border-gray-100">
                    <img src="https://img.icons8.com/color/48/mercado-pago.png" alt="MP" className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-gray-800 group-hover:text-blue-600">Mercado Pago</span>
                    <span className="text-sm text-gray-500">Pix, Boleto, Cartão</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
              </button>
            </div>
          ) : (
            <div>
              {method === 'stripe' && stripeClientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                  <StripePaymentForm clientSecret={stripeClientSecret} onSuccess={onSuccess} />
                </Elements>
              )}
              {method === 'mercadopago' && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
                  <p className="text-gray-600">Redirecionando para o Mercado Pago...</p>
                </div>
              )}
              
              <button 
                onClick={() => { setMethod(null); setStripeClientSecret(null); }}
                className="mt-4 text-sm text-gray-500 hover:text-gray-800 underline"
              >
                Voltar e escolher outro método
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
