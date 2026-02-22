import { Link } from 'react-router-dom';

type BrandLogoProps = {
  to?: string;
  heightClassName?: string;
  className?: string;
};

export default function BrandLogo({ to = '/', heightClassName = 'h-9', className = '' }: BrandLogoProps) {
  return (
    <Link to={to} className={`inline-flex items-center ${className}`.trim()}>
      <img src="/logo-original.png" alt="MeuFreelas" className={`${heightClassName} w-auto`} />
    </Link>
  );
}
