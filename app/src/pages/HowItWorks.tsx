import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FilePlus, Users, ShieldCheck, Search, MessageSquare, CreditCard, CheckCircle } from 'lucide-react';

export default function HowItWorks() {
  const { isAuthenticated, user } = useAuth();
  const freelancerSteps = [
    {
      icon: Search,
      title: 'Encontre Projetos',
      description: 'Navegue por milhares de projetos publicados por clientes de todo o Brasil. Use filtros para encontrar oportunidades que combinam com suas habilidades.',
    },
    {
      icon: FilePlus,
      title: 'Envie Propostas',
      description: 'Escolha os projetos que mais te interessam e envie propostas personalizadas. Apresente seu portfólio e explique por que você é a pessoa certa para o trabalho.',
    },
    {
      icon: MessageSquare,
      title: 'Negocie e Converse',
      description: 'Converse diretamente com os clientes pelo nosso chat. Tire dúvidas, negocie valores e prazos, e estabeleça uma boa comunicação desde o início.',
    },
    {
      icon: CheckCircle,
      title: 'Execute o Projeto',
      description: 'Após ser contratado, execute o trabalho com excelência. Mantenha o cliente informado sobre o progresso e entregue dentro do prazo combinado.',
    },
    {
      icon: CreditCard,
      title: 'Receba com Segurança',
      description: 'O pagamento é garantido pelo MeuFreelas. O valor fica retido até a conclusão do projeto, garantindo segurança para você e para o cliente.',
    },
  ];

  const clientSteps = [
    {
      icon: FilePlus,
      title: 'Publique seu Projeto',
      description: 'Descreva o que você precisa, defina o orçamento e o prazo. É rápido, fácil e gratuito publicar um projeto no MeuFreelas.',
    },
    {
      icon: Users,
      title: 'Receba Propostas',
      description: 'Em poucos minutos, você começará a receber propostas de freelancers qualificados. Compare perfis, portfólios e avaliações.',
    },
    {
      icon: MessageSquare,
      title: 'Escolha o Melhor',
      description: 'Converse com os candidatos, tire suas dúvidas e escolha o freelancer que melhor atende às suas necessidades e orçamento.',
    },
    {
      icon: ShieldCheck,
      title: 'Pague com Segurança',
      description: 'O pagamento é processado de forma segura pelo MeuFreelas. O valor só é liberado para o freelancer quando o projeto estiver concluído.',
    },
    {
      icon: CheckCircle,
      title: 'Avalie o Trabalho',
      description: 'Após a conclusão, avalie o freelancer e deixe seu feedback. Isso ajuda a comunidade e melhora a qualidade dos serviços.',
    },
  ];

  const benefits = [
    { title: 'Pagamento Garantido', description: 'Seu dinheiro está protegido até a conclusão do projeto' },
    { title: 'Freelancers Verificados', description: 'Avaliações e histórico de trabalho transparentes' },
    { title: 'Suporte 24/7', description: 'Nossa equipe está sempre pronta para ajudar' },
    { title: 'Sem Taxas Ocultas', description: 'Transparência em todos os custos' },
  ];

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

      {/* Hero */}
      <div className="bg-gradient-to-br from-99blue to-sky-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Como Funciona o MeuFreelas
          </h1>
          <p className="text-xl text-white/90 mb-8">
            A maneira mais simples e segura de encontrar trabalho freelance ou contratar talentos
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-99blue font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Quero Trabalhar
            </Link>
            <Link
              to="/project/new"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Quero Contratar
            </Link>
          </div>
        </div>
      </div>

      {/* For Freelancers */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Para Freelancers
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Encontre oportunidades incríveis e construa sua carreira freelance de sucesso
            </p>
          </div>

          <div className="space-y-8">
            {freelancerSteps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row items-start bg-white rounded-lg shadow-sm p-8">
                <div className="flex-shrink-0 mb-4 md:mb-0">
                  <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-99blue" />
                  </div>
                </div>
                <div className="md:ml-8 flex-1">
                  <div className="flex items-center mb-2">
                    <span className="w-8 h-8 bg-99blue text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-800">{step.title}</h3>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* For Clients */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Para Empresas e Clientes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Encontre os melhores talentos para seus projetos de forma rápida e segura
            </p>
          </div>

          <div className="space-y-8">
            {clientSteps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row items-start bg-white rounded-lg shadow-sm p-8 border border-gray-100">
                <div className="flex-shrink-0 mb-4 md:mb-0">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="md:ml-8 flex-1">
                  <div className="flex items-center mb-2">
                    <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-800">{step.title}</h3>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Por que escolher o MeuFreelas?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Oferecemos a melhor experiência para freelancers e clientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-99blue" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-99dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-gray-300 mb-8">
            Junte-se a milhões de freelancers e clientes que já escolheram o MeuFreelas
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-99blue text-white font-semibold rounded-lg hover:bg-sky-400 transition-colors"
            >
              Criar Conta Grátis
            </Link>
            <Link
              to="/projects"
              className="px-8 py-3 border-2 border-gray-500 text-gray-300 font-semibold rounded-lg hover:border-white hover:text-white transition-colors"
            >
              Explorar Projetos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
