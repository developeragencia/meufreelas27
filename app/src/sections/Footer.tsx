import { Facebook, Twitter, Linkedin } from 'lucide-react';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <a
      href={href}
      className="block text-gray-400 hover:text-white text-sm transition-colors py-1"
    >
      {children}
    </a>
  );
}

interface FooterColumnProps {
  title: string;
  children: React.ReactNode;
}

function FooterColumn({ title, children }: FooterColumnProps) {
  return (
    <div>
      <h4 className="text-white font-semibold mb-4">{title}</h4>
      {children}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-99darker py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* MeuFreelas Column */}
          <FooterColumn title="MeuFreelas">
            <FooterLink href="#">Como funciona</FooterLink>
            <FooterLink href="#">Blog</FooterLink>
            <FooterLink href="#">Central de ajuda</FooterLink>
            <FooterLink href="#">Termos de uso</FooterLink>
            <FooterLink href="#">Política de privacidade</FooterLink>
          </FooterColumn>

          {/* Para Empresas Column */}
          <FooterColumn title="Para Empresas">
            <FooterLink href="#">Área de empresa</FooterLink>
            <FooterLink href="#">Cadastro de empresa</FooterLink>
            <FooterLink href="#">Como funciona</FooterLink>
            <FooterLink href="#">Publique seu projeto</FooterLink>
            <FooterLink href="#">Lista de freelancers</FooterLink>
          </FooterColumn>

          {/* Para Freelancers Column */}
          <FooterColumn title="Para Freelancers">
            <FooterLink href="#">Área de freelancer</FooterLink>
            <FooterLink href="#">Cadastro de freelancer</FooterLink>
            <FooterLink href="#">Como funciona</FooterLink>
            <FooterLink href="#">Lista de projetos</FooterLink>
          </FooterColumn>

          {/* Siga-nos Column */}
          <FooterColumn title="Siga-nos">
            <div className="flex space-x-4 mt-2">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </FooterColumn>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} 99Freelas. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
