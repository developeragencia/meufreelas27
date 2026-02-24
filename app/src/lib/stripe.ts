import { loadStripe } from '@stripe/stripe-js';

// Substitua pela sua chave pública real do Stripe
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_live_placeholder_solicite_ao_usuario';

export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
