import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivacyPolicy() {
  const { isAuthenticated, user } = useAuth();
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/projects" className="text-gray-300 hover:text-white">Projetos</Link>
              <Link to="/freelancers" className="text-gray-300 hover:text-white">Freelancers</Link>
              {isAuthenticated ? (
                <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                  <Link to="/register" className="px-4 py-2 bg-99blue rounded-lg hover:bg-sky-400">
                    Cadastre-se
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="mb-6">
            A sua privacidade é importante para nós. Esta Política de Privacidade descreve como o MeuFreelas coleta, usa, armazena e protege suas informações pessoais.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. Informações que Coletamos</h2>
          <p className="mb-4">
            Coletamos as seguintes informações quando você utiliza nossa plataforma:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Informações de cadastro (nome, email, telefone)</li>
            <li>Informações de perfil profissional (habilidades, experiência, portfólio)</li>
            <li>Informações de pagamento</li>
            <li>Dados de uso da plataforma</li>
            <li>Comunicações entre usuários</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. Como Usamos suas Informações</h2>
          <p className="mb-4">
            Utilizamos suas informações para:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Fornecer e melhorar nossos serviços</li>
            <li>Processar pagamentos</li>
            <li>Conectar freelancers com clientes</li>
            <li>Enviar notificações importantes</li>
            <li>Prevenir fraudes e garantir segurança</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. Compartilhamento de Informações</h2>
          <p className="mb-6">
            Não vendemos suas informações pessoais. Compartilhamos dados apenas quando necessário para:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Processadores de pagamento</li>
            <li>Prestadores de serviços que nos auxiliam</li>
            <li>Cumprimento de obrigações legais</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. Segurança</h2>
          <p className="mb-6">
            Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">5. Seus Direitos</h2>
          <p className="mb-4">
            Você tem o direito de:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Acessar suas informações pessoais</li>
            <li>Corrigir dados incorretos</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Revogar consentimentos</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">6. Cookies</h2>
          <p className="mb-6">
            Utilizamos cookies para melhorar sua experiência na plataforma. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">7. Alterações nesta Política</h2>
          <p className="mb-6">
            Podemos atualizar esta política periodicamente. Notificaremos você sobre alterações significativas através da plataforma ou por email.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">8. Contato</h2>
          <p className="mb-6">
            Para dúvidas sobre esta política, entre em contato conosco através do email: privacidade@meufreelas.com.br
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Última atualização: Fevereiro de 2026
          </p>
        </div>
      </div>
    </div>
  );
}
