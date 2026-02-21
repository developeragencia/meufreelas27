import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show banner after a short delay
    const timer = setTimeout(() => {
      const hasAccepted = localStorage.getItem('cookiesAccepted');
      if (!hasAccepted) {
        setIsVisible(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-99dark/95 backdrop-blur-sm animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="text-white text-sm flex-1 pr-4">
            Nós fazemos uso de cookies em nosso site para melhorar a sua experiência. Ao utilizar o MeuFreelas, você aceita o uso de cookies de acordo com a nossa{' '}
            <a
              href="#"
              className="text-99blue hover:text-sky-300 underline underline-offset-2 transition-colors"
            >
              política de privacidade
            </a>
            .
          </p>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
