import { Link } from 'react-router-dom';

type BrandLogoProps = {
  to?: string;
  heightClassName?: string;
  className?: string;
  /** Use em headers com fundo escuro para o preto da logo ficar transparente */
  darkBg?: boolean;
};

export default function BrandLogo({ to = '/', heightClassName = 'h-9', className = '', darkBg = false }: BrandLogoProps) {
  return (
    <Link to={to} className={`inline-flex items-center ${className}`.trim()}>
      <img
        src="/logo-meufreelas.png"
        alt="MeuFreelas"
        className={`${heightClassName} w-auto object-contain ${darkBg ? 'drop-shadow-[0_0_1px_rgba(255,255,255,0.35)]' : ''}`.trim()}
      />
    </Link>
  );
}
