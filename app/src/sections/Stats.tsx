import { useState, useEffect, useRef } from 'react';

interface StatItemProps {
  value: string;
  label: string;
  prefix?: string;
}

function StatItem({ value, label, prefix = '' }: StatItemProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    const isCurrency = value.includes('R$');
    const duration = 2000;
    const steps = 60;
    const stepValue = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = stepValue * step;
      
      if (step >= steps) {
        current = numericValue;
        clearInterval(timer);
      }

      let formatted = '';
      if (isCurrency) {
        formatted = `R$${current.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      } else {
        formatted = Math.floor(current).toLocaleString('pt-BR');
      }
      
      setDisplayValue(formatted);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div ref={ref} className="text-center py-8 px-4 animate-fade-in-up">
      <div className="text-3xl md:text-4xl font-semibold text-gray-800 mb-1">
        {prefix}{displayValue}
      </div>
      <div className="text-gray-500 text-sm md:text-base">{label}</div>
    </div>
  );
}

export default function Stats() {
  const stats = [
    { value: '136391', label: 'projetos concluídos' },
    { value: '3379408', label: 'freelancers cadastrados' },
    { value: '26290596.88', label: 'pago aos freelancers', prefix: 'R$' },
  ];

  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              value={stat.value}
              label={stat.label}
              prefix={stat.prefix}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
