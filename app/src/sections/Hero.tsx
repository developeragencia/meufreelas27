import { useState, useEffect } from 'react';

const rotatingTexts = [
  'desenvolver o seu código',
  'escrever o seu conteúdo',
  'melhorar o seu SEO',
  'desenhar o seu website',
  'criar o seu vídeo',
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % rotatingTexts.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[500px] flex items-center justify-center pt-24">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-2 leading-tight">
          Encontre o melhor
        </h1>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-2 leading-tight">
          profissional <span className="font-normal">freelancer</span>
        </h1>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
          para{' '}
          <span 
            className={`font-normal inline-block transition-all duration-300 ${
              isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
            }`}
          >
            {rotatingTexts[currentIndex]}
          </span>
          .
        </h1>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <a
            href="#"
            className="w-full sm:w-auto px-10 py-3.5 bg-99blue text-white font-semibold rounded hover:bg-sky-400 transition-all duration-300 transform hover:scale-105"
          >
            Publicar projeto
          </a>
          <a
            href="#"
            className="w-full sm:w-auto px-10 py-3.5 bg-transparent text-white font-semibold rounded border-2 border-white/70 hover:bg-white/10 transition-all duration-300"
          >
            Quero Trabalhar
          </a>
        </div>
      </div>
    </section>
  );
}
