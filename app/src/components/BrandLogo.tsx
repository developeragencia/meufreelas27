import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

type BrandLogoProps = {
  to?: string;
  heightClassName?: string;
  className?: string;
  /** Use em headers com fundo escuro para o preto da logo ficar transparente */
  darkBg?: boolean;
};

export default function BrandLogo({ to = '/', heightClassName = 'h-9', className = '', darkBg = false }: BrandLogoProps) {
  const [processedSrc, setProcessedSrc] = useState<string>('/logo-meufreelas.png');

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = imageData.data;
        // Remove background preto da logo original.
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i];
          const g = px[i + 1];
          const b = px[i + 2];
          if (r < 18 && g < 18 && b < 18) {
            px[i + 3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setProcessedSrc(canvas.toDataURL('image/png'));
      } catch {
        setProcessedSrc('/logo-meufreelas.png');
      }
    };
    img.onerror = () => setProcessedSrc('/logo-meufreelas.png');
    img.src = '/logo-meufreelas.png';
  }, []);

  return (
    <Link to={to} className={`inline-flex items-center ${className}`.trim()}>
      <img
        src={processedSrc}
        alt="MeuFreelas"
        className={`${heightClassName} w-auto object-contain ${darkBg ? 'drop-shadow-[0_0_1px_rgba(255,255,255,0.35)]' : ''}`.trim()}
      />
    </Link>
  );
}
