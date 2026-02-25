import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Loader2, X, Lock, ExternalLink } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: any;
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, plan, onSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
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

      // Use o novo endpoint create_checkout_session
      const res = await fetch(`${apiUrl}/payments.php?action=create_checkout_session`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `Plano ${plan.name} - MeuFreelas`,
          price: parseFloat(plan.price.toString().replace(',', '.')),
          type: 'subscription',
          plan: plan.id,
          successUrl: `${window.location.origin}/payments/success`,
          cancelUrl: `${window.location.origin}/payments/failure`
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
      if (data.url) {
        // Redirecionar para a página segura do Stripe
        window.location.href = data.url;
      } else {
        throw new Error('URL de pagamento não recebida.');
      }
    } catch (e: any) {
      console.error("Payment initialization error:", e);
      setError(e.message || 'Erro de conexão.');
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

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
            <p className="font-bold">Erro ao iniciar pagamento:</p>
            <p>{error}</p>
          </div>
        )}

        <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 px-6 bg-99blue text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-70 flex justify-center items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Redirecionando para o Stripe...</span>
                </>
            ) : (
                <>
                    <CreditCard className="w-5 h-5" />
                    <span>Ir para Pagamento Seguro</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                </>
            )}
        </button>
        
        <div className="mt-6 flex justify-center items-center gap-2 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            <span>Você será redirecionado para o ambiente seguro do Stripe</span>
        </div>
      </div>
    </div>
  );
}
