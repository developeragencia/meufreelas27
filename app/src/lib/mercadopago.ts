import { initMercadoPago } from '@mercadopago/sdk-react';

// Inicializa o Mercado Pago com a chave pública (opcional se usar apenas redirecionamento via backend)
// Mas útil se formos usar componentes visuais no futuro
const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-placeholder-key';

export const initMP = () => {
  initMercadoPago(MP_PUBLIC_KEY, {
    locale: 'pt-BR'
  });
};
