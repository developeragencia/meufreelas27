import { Link } from 'react-router-dom';

type BrandLogoProps = {
  to?: string;
  heightClassName?: string;
  className?: string;
  /** Use em headers com fundo escuro para o preto da logo ficar transparente */
  darkBg?: boolean;
};

export default function BrandLogo({ to = '/', heightClassName = 'h-9', className = '', darkBg = false }: BrandLogoProps) {
  const textColor = darkBg ? 'text-white' : 'text-gray-900';
  return (
    <Link to={to} className={`inline-flex items-center ${className}`.trim()}>
      <span className={`${heightClassName} inline-flex items-center font-extrabold tracking-tight leading-none select-none text-3xl`.trim()}>
        <span className={textColor}>meu</span>
        <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">freelas</span>
      </span>
    </Link>
  );
}
