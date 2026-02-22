import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  MessageCircle, 
  FileText, 
  Shield, 
  CreditCard,
  User,
  Briefcase,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: React.ElementType;
  faqs: FAQ[];
}

export default function HelpCenter() {
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>('Geral');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const categories: FAQCategory[] = [
    {
      title: 'Geral',
      icon: MessageCircle,
      faqs: [
        {
          question: 'O que é o MeuFreelas?',
          answer: 'O MeuFreelas é uma plataforma que conecta freelancers a clientes que precisam de serviços profissionais. Facilitamos a comunicação, negociação e pagamento entre as partes.',
        },
        {
          question: 'Como funciona o MeuFreelas?',
          answer: 'Clientes publicam projetos descrevendo o que precisam. Freelancers enviam propostas com seus valores e prazos. O cliente escolhe o freelancer ideal e o trabalho começa. O pagamento é processado de forma segura pela plataforma.',
        },
        {
          question: 'O MeuFreelas é gratuito?',
          answer: 'Sim! O cadastro é gratuito tanto para freelancers quanto para clientes. Cobramos apenas uma taxa de serviço sobre os valores pagos, que varia de 5% a 20% dependendo do valor do projeto.',
        },
      ],
    },
    {
      title: 'Para Freelancers',
      icon: User,
      faqs: [
        {
          question: 'Como me cadastro como freelancer?',
          answer: 'Clique em "Cadastre-se", escolha "Quero Trabalhar", preencha seus dados e complete seu perfil com suas habilidades, experiência e portfólio.',
        },
        {
          question: 'Como encontro projetos?',
          answer: 'Acesse a página "Encontrar Trabalho" e use os filtros para buscar projetos compatíveis com suas habilidades. Você também pode receber notificações de projetos relevantes.',
        },
        {
          question: 'Como envio uma proposta?',
          answer: 'Ao encontrar um projeto interessante, clique em "Enviar Proposta", descreva como você pode ajudar, informe seu valor e prazo. Seja claro e profissional!',
        },
        {
          question: 'Quando recebo o pagamento?',
          answer: 'O pagamento é liberado quando o projeto é concluído e aprovado pelo cliente. O valor fica disponível em sua conta e pode ser sacado para sua conta bancária.',
        },
      ],
    },
    {
      title: 'Para Clientes',
      icon: Briefcase,
      faqs: [
        {
          question: 'Como publico um projeto?',
          answer: 'Clique em "Publicar projeto", escolha a categoria, descreva o que precisa, defina o orçamento e prazo. Quanto mais detalhes, melhores serão as propostas.',
        },
        {
          question: 'Como escolho o freelancer certo?',
          answer: 'Analise o perfil, portfólio, avaliações e histórico de trabalho dos candidatos. Converse com eles para tirar dúvidas e avaliar a comunicação.',
        },
        {
          question: 'Como funciona o pagamento?',
          answer: 'Você faz o pagamento através da plataforma. O valor fica retido até a conclusão do projeto, garantindo segurança para você e para o freelancer.',
        },
        {
          question: 'Posso cancelar um projeto?',
          answer: 'Sim, você pode cancelar um projeto antes de contratar um freelancer. Se já houver um freelancer trabalhando, entre em contato com o suporte.',
        },
      ],
    },
    {
      title: 'Pagamentos',
      icon: CreditCard,
      faqs: [
        {
          question: 'Quais formas de pagamento são aceitas?',
          answer: 'Aceitamos cartões de crédito, boleto bancário, PIX e transferência bancária. Para freelancers, oferecemos saque para conta bancária.',
        },
        {
          question: 'Qual a taxa do MeuFreelas?',
          answer: 'A taxa de serviço varia de 5% a 20% sobre o valor do projeto, com mínimo de R$ 10,00. A taxa exata é informada antes da contratação.',
        },
        {
          question: 'Como funciona o pagamento seguro?',
          answer: 'O valor do projeto fica retido na plataforma até a conclusão do trabalho. Isso protege tanto o cliente quanto o freelancer.',
        },
      ],
    },
    {
      title: 'Segurança',
      icon: Shield,
      faqs: [
        {
          question: 'Meus dados estão seguros?',
          answer: 'Sim! Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados nunca são vendidos a terceiros.',
        },
        {
          question: 'Como denunciar um usuário?',
          answer: 'Você pode denunciar um usuário através do botão "Denunciar" no perfil dele ou entrando em contato com nosso suporte.',
        },
        {
          question: 'O que fazer em caso de disputa?',
          answer: 'Entre em contato com nosso suporte imediatamente. Analisaremos a situação e ajudaremos a resolver o conflito de forma justa.',
        },
      ],
    },
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
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
      <div className="bg-99blue py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Central de Ajuda
          </h1>
          <p className="text-white/80 mb-8">
            Como podemos ajudar você hoje?
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por pergunta ou tópico..."
              className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {searchTerm ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Resultados da busca
            </h2>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.title} className="mb-8">
                  <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                    <category.icon className="w-5 h-5 mr-2" />
                    {category.title}
                  </h3>
                  <div className="space-y-2">
                    {category.faqs.map((faq, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-sm">
                        <button
                          onClick={() => setOpenFAQ(openFAQ === faq.question ? null : faq.question)}
                          className="w-full flex items-center justify-between p-4 text-left"
                        >
                          <span className="font-medium text-gray-800">{faq.question}</span>
                          {openFAQ === faq.question ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        {openFAQ === faq.question && (
                          <div className="px-4 pb-4">
                            <p className="text-gray-600">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum resultado encontrado para "{searchTerm}"</p>
                <p className="text-gray-400 mt-2">Tente buscar com outros termos</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Categorias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <button
                  key={category.title}
                  onClick={() => setOpenCategory(openCategory === category.title ? null : category.title)}
                  className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-sky-100 rounded-lg mr-4">
                        <category.icon className="w-6 h-6 text-99blue" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{category.title}</h3>
                        <p className="text-sm text-gray-500">{category.faqs.length} artigos</p>
                      </div>
                    </div>
                    {openCategory === category.title ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {openCategory === category.title && (
                    <div className="mt-4 space-y-2">
                      {category.faqs.map((faq, index) => (
                        <div key={index} className="border-t border-gray-100 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFAQ(openFAQ === faq.question ? null : faq.question);
                            }}
                            className="w-full flex items-center justify-between py-2 text-left"
                          >
                            <span className="text-sm text-gray-700">{faq.question}</span>
                            {openFAQ === faq.question ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          {openFAQ === faq.question && (
                            <p className="text-sm text-gray-600 pb-2">{faq.answer}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Não encontrou o que procurava?
          </h2>
          <p className="text-gray-500 mb-6">
            Nossa equipe de suporte está pronta para ajudar você
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="mailto:suporte@meufreelas.com.br"
              className="inline-flex items-center justify-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Falar com Suporte
            </a>
            <Link
              to="/como-funciona"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-5 h-5 mr-2" />
              Como Funciona
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
