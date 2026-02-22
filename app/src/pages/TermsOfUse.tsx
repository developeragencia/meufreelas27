import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function TermsOfUse() {
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Termos de Uso</h1>
        
        <div className="prose prose-lg max-w-none text-gray-600">
          <p className="mb-6">
            Bem-vindo ao MeuFreelas! Ao utilizar nossa plataforma, você concorda com os seguintes termos e condições. Leia atentamente antes de usar nossos serviços.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p className="mb-6">
            Ao acessar ou usar o MeuFreelas, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, não utilize a plataforma.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. Descrição do Serviço</h2>
          <p className="mb-6">
            O MeuFreelas é uma plataforma que conecta freelancers a clientes que precisam de serviços profissionais. Nós facilitamos a comunicação, negociação e pagamento entre as partes.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. Cadastro e Conta</h2>
          <p className="mb-4">
            Para utilizar a plataforma, você deve:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Ter pelo menos 18 anos de idade</li>
            <li>Fornecer informações verdadeiras e atualizadas</li>
            <li>Manter a confidencialidade de sua senha</li>
            <li>Ser responsável por todas as atividades em sua conta</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. Para Freelancers</h2>
          <p className="mb-4">
            Como freelancer, você concorda em:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Fornecer informações verdadeiras sobre suas habilidades e experiência</li>
            <li>Cumprir prazos acordados com clientes</li>
            <li>Manter a qualidade do trabalho prometido</li>
            <li>Comunicar-se de forma profissional</li>
            <li>Não solicitar pagamentos fora da plataforma</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">5. Para Clientes</h2>
          <p className="mb-4">
            Como cliente, você concorda em:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Fornecer descrições claras e completas dos projetos</li>
            <li>Pagar pelos serviços contratados conforme acordado</li>
            <li>Comunicar-se de forma respeitosa com freelancers</li>
            <li>Não solicitar trabalho gratuito como "teste"</li>
            <li>Utilizar o sistema de pagamento da plataforma</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">6. Taxas e Pagamentos</h2>
          <p className="mb-6">
            O MeuFreelas cobra uma taxa de serviço sobre os valores pagos aos freelancers. As taxas são claramente informadas antes da contratação. O pagamento é processado de forma segura através da plataforma.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">7. Propriedade Intelectual</h2>
          <p className="mb-6">
            O cliente recebe os direitos de propriedade intelectual do trabalho entregue, exceto quando acordado de outra forma. O freelancer mantém os direitos de portfólio para exibir o trabalho em seu perfil.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">8. Conduta Proibida</h2>
          <p className="mb-4">
            É estritamente proibido:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Usar a plataforma para atividades ilegais</li>
            <li>Assediar ou discriminar outros usuários</li>
            <li>Publicar conteúdo falso ou enganoso</li>
            <li>Tentar burlar o sistema de pagamento</li>
            <li>Criar múltiplas contas</li>
            <li>Compartilhar informações de contato antes da contratação</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">9. Rescisão</h2>
          <p className="mb-6">
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, sem aviso prévio. Você pode encerrar sua conta a qualquer momento.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">10. Limitação de Responsabilidade</h2>
          <p className="mb-6">
            O MeuFreelas não se responsabiliza pela qualidade do trabalho realizado pelos freelancers nem pelo cumprimento de obrigações pelos clientes. Nossa responsabilidade está limitada ao valor da taxa de serviço.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">11. Alterações nos Termos</h2>
          <p className="mb-6">
            Podemos modificar estes termos a qualquer momento. As alterações entram em vigor após a publicação na plataforma. O uso continuado após as alterações constitui aceitação dos novos termos.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">12. Contato</h2>
          <p className="mb-6">
            Para dúvidas sobre estes termos, entre em contato: suporte@meufreelas.com.br
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Última atualização: Fevereiro de 2026
          </p>
        </div>
      </div>
    </div>
  );
}
