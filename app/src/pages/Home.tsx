import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, Search, User, LogOut, Briefcase, CheckCircle, Menu, X } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const rotatingTexts = [
  'desenvolver o seu código',
  'escrever o seu conteúdo',
  'melhorar o seu SEO',
  'desenhar o seu website',
  'criar o seu vídeo',
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % rotatingTexts.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Main Header */}
        <div className="bg-99dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <div className="flex items-center">
                <BrandLogo heightClassName="h-8" darkBg />
              </div>

              {/* Search Bar */}
              <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
                <div className="relative flex w-full">
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowDropdown(true)}
                    onMouseLeave={() => setShowDropdown(false)}
                  >
                    <button className="flex items-center px-4 py-2 bg-99blue text-white text-sm font-medium rounded-l hover:bg-99blue-light transition-colors">
                      Freelancers
                      <ChevronDown className="ml-2 w-4 h-4" />
                    </button>
                    {showDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded shadow-lg py-2 animate-fade-in">
                        <Link to="/freelancers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Freelancers</Link>
                        <Link to="/projects" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Projetos</Link>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar freelancers"
                    className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border-0 focus:outline-none focus:ring-0"
                  />
                  <button className="px-4 py-2 bg-white border-l border-gray-200 rounded-r hover:bg-gray-50 transition-colors">
                    <Search className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Right Navigation - Desktop Only */}
              <div className="hidden md:flex items-center space-x-4">
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 text-white"
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 bg-99blue rounded-full flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <span className="hidden md:block text-sm">{user?.name.split(' ')[0]}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 animate-fade-in">
                        <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          Dashboard
                        </Link>
                        {user?.type === 'client' && (
                          <Link to="/project/new" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Publicar Projeto
                          </Link>
                        )}
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sair
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                      Login
                    </Link>
                    <Link to="/register" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                      Cadastre-se
                    </Link>
                    <Link
                      to="/project/new"
                      className="px-5 py-2 bg-99blue text-white text-sm font-semibold rounded hover:bg-99blue-light transition-colors"
                    >
                      Publicar projeto
                    </Link>
                  </>
                )}
              </div>
              
              {/* Mobile Menu Button */}
              <div className="flex md:hidden items-center">
                <button 
                  className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 w-72 h-full bg-white shadow-xl z-50 md:hidden overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between bg-99dark">
                <span className="text-xl font-bold text-white">Menu</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-4">
                <Link 
                  to="/como-funciona" 
                  className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Como Funciona
                </Link>
                <Link 
                  to="/freelancers" 
                  className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Encontrar Freelancers
                </Link>
                <Link 
                  to="/projects" 
                  className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Encontrar Trabalho
                </Link>
                <div className="border-t border-gray-200 my-4"></div>
                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="flex items-center px-4 py-3 rounded-lg mb-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      className="flex items-center px-4 py-3 rounded-lg mb-2 bg-99blue text-white hover:bg-99blue-light transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Cadastre-se
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </>
        )}

        {/* Sub Header - Desktop Only */}
        <div className="hidden md:block bg-99dark/95 border-t border-gray-600/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-end space-x-8 h-10">
              <Link to="/como-funciona" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Como Funciona
              </Link>
              <Link to="/freelancers" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Encontrar Freelancers
              </Link>
              <Link to="/projects" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Encontrar Trabalho
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[500px] flex items-center justify-center">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-2 leading-tight">
              Encontre o melhor
            </h1>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-2 leading-tight">
              profissional <span className="font-normal">freelancer</span>
            </h1>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6 leading-tight">
              para{' '}
              <span 
                className={`font-normal inline-block transition-all duration-300 ${
                  isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
                }`}
              >
                {rotatingTexts[currentIndex]}
              </span>
              .
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                to="/project/new"
                className="w-full sm:w-auto px-10 py-3.5 bg-99blue text-white font-semibold rounded hover:bg-99blue-light transition-all duration-300 transform hover:scale-105"
              >
                Publicar projeto
              </Link>
              <Link
                to="/projects"
                className="w-full sm:w-auto px-10 py-3.5 bg-transparent text-white font-semibold rounded border-2 border-white/70 hover:bg-white/10 transition-all duration-300"
              >
                Quero Trabalhar
              </Link>
            </div>
          </div>
        </section>

        {/* Freelancer Banner */}
        <section className="bg-99dark py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-white text-sm">
              Você é um freelancer? Junte-se a nós!{' '}
              <Link 
                to="/register" 
                className="text-white hover:text-gray-200 font-medium underline underline-offset-2 transition-colors"
              >
                Cadastre-se
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <Stats />

        {/* Categories Section */}
        <Categories />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Testimonials Section */}
        <Testimonials />

        {/* CTA Section */}
        <CTA />

        {/* Freelancer CTA */}
        <FreelancerCTA />
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}

// Stats Component
function Stats() {
  const stats = [
    { value: '136.391', label: 'projetos concluídos' },
    { value: '3.379.408', label: 'freelancers cadastrados' },
    { value: 'R$26.290.596', label: 'pago aos freelancers' },
  ];

  return (
    <section className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {stats.map((stat, index) => (
            <div key={index} className="text-center py-8 px-4 animate-fade-in-up">
              <div className="text-3xl md:text-4xl font-semibold text-gray-800 mb-1">
                {stat.value}
              </div>
              <div className="text-gray-500 text-sm md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Categories Component
function Categories() {
  const categories = [
    { title: 'Desenhar o seu', subtitle: 'website', bgColor: 'bg-99blue', hoverColor: 'bg-99blue-light' },
    { title: 'Escrever o seu', subtitle: 'conteúdo', bgColor: 'bg-99blue', hoverColor: 'bg-99blue-light' },
    { title: 'Desenvolver o seu', subtitle: 'código', bgColor: 'bg-99blue', hoverColor: 'bg-99blue-light' },
    { title: 'Melhorar o seu', subtitle: 'SEO', bgColor: 'bg-99blue', hoverColor: 'bg-99blue-light' },
    { title: 'Desenhar o seu', subtitle: 'logotipo', bgColor: 'bg-99blue', hoverColor: 'bg-99blue-light' },
    { title: 'Criar o seu', subtitle: 'vídeo', bgColor: 'bg-99blue', hoverColor: 'bg-99blue-light' },
  ];

  return (
    <section className="bg-99gray py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-light text-center text-gray-800 mb-12">
          Encontre freelancers talentosos para...
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category, index) => (
            <Link
              key={index}
              to="/freelancers"
              className={`group relative block overflow-hidden rounded-lg ${category.bgColor} transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1`}
              style={{ minHeight: '160px' }}
            >
              <div className={`absolute inset-0 ${category.hoverColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <div>
                  <p className="text-white/90 text-sm">{category.title}</p>
                  <p className="text-white text-xl font-semibold">{category.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/freelancers"
            className="inline-flex items-center px-6 py-3 bg-99blue text-white font-medium rounded hover:bg-99blue-light transition-all duration-300"
          >
            Ver todas categorias
          </Link>
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      icon: Briefcase,
      title: 'Publique uma vaga',
      description: 'Publique a sua vaga para milhares de profissionais, você irá receber propostas de freelancers talentosos em poucos minutos.',
    },
    {
      icon: User,
      title: 'Contrate',
      description: 'Reveja o histórico de trabalho, feedback de clientes e portfólio para limitar os candidatos. Então faça uma entrevista pelo chat e escolha o melhor.',
    },
    {
      icon: CheckCircle,
      title: 'Pague com segurança',
      description: 'Com o pagamento seguro do MeuFreelas, o pagamento será repassado para o freelancer somente quando o projeto estiver concluído.',
    },
  ];

  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-4">
            Como Funciona?
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Anuncie o seu trabalho facilmente, contrate freelancers e pague com segurança.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center px-6 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 text-99blue">
                <step.icon className="w-12 h-12" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Component
function Testimonials() {
  const [currentPage, setCurrentPage] = useState(0);

  const testimonials = [
    {
      quote: 'Muito bom site para quem busca profissionais de diversos segmentos e especialização. Depois que você faz um projeto com esse site, você se pergunta: como eu trabalhava sem esse site? Valeu muito a pena!',
      author: 'Rafael Leite',
    },
    {
      quote: 'Dentre as plataformas de freelas, o MeuFreelas foi o que tem a maior base de respostas entre propostas de freelas. O nível da base de dados de profissionais disponíveis é muito acima do esperado.',
      author: 'Lincoln Tamashiro',
    },
    {
      quote: 'O MeuFreelas foi um achado. Já conhecia o site há certo tempo mas não acreditava em sua eficiência. Como tenho muitas demandas passei a ser um usuário permanente.',
      author: 'Jorge Medeiros',
    },
    {
      quote: 'Pela primeira vez que utilizei o site, tive uma excelente experiência e com certeza recomendo o MeuFreelas pela rapidez no suporte ao usuário e segurança no processo.',
      author: 'Vanessa Custodio',
    },
  ];

  const itemsPerPage = 2;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  return (
    <section className="bg-99gray py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-light text-center text-gray-800 mb-12">
          O que nossos clientes estão dizendo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {testimonials
            .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
            .map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm h-full">
                <p className="text-gray-600 text-sm leading-relaxed mb-4">" {testimonial.quote} "</p>
                <p className="text-gray-800 font-medium text-sm">- {testimonial.author}</p>
              </div>
            ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                currentPage === index
                  ? 'bg-99blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Component
function CTA() {
  return (
    <section className="bg-white py-16 border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xl md:text-2xl font-light text-gray-800 mb-8">
          Está pronto para encontrar o freelancer ideal para o seu projeto?
        </h2>
        <Link
          to="/project/new"
          className="inline-block px-8 py-3.5 bg-99blue text-white font-semibold rounded hover:bg-99blue-light transition-all duration-300 transform hover:scale-105"
        >
          Publique um projeto!
        </Link>
      </div>
    </section>
  );
}

// Freelancer CTA Component
function FreelancerCTA() {
  return (
    <section className="bg-99gray py-12 border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-600 mb-6">
          Você é um freelancer? Nós conectamos milhares de profissionais a empresas todos os dias.
        </p>
        <Link
          to="/register"
          className="inline-block px-8 py-3.5 bg-99blue text-white font-semibold rounded hover:bg-99blue-light transition-all duration-300 transform hover:scale-105"
        >
          Cadastre-se
        </Link>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-99darker py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-semibold mb-4">MeuFreelas</h4>
            <Link to="/como-funciona" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Como funciona</Link>
            <Link to="#" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Blog</Link>
            <Link to="#" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Central de ajuda</Link>
            <Link to="#" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Termos de uso</Link>
            <Link to="#" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Política de privacidade</Link>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Para Empresas</h4>
            <Link to="/dashboard" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Área de empresa</Link>
            <Link to="/register" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Cadastro de empresa</Link>
            <Link to="/como-funciona" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Como funciona</Link>
            <Link to="/project/new" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Publique seu projeto</Link>
            <Link to="/freelancers" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Lista de freelancers</Link>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Para Freelancers</h4>
            <Link to="/dashboard" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Área de freelancer</Link>
            <Link to="/register" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Cadastro de freelancer</Link>
            <Link to="/como-funciona" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Como funciona</Link>
            <Link to="/projects" className="block text-gray-400 hover:text-white text-sm transition-colors py-1">Lista de projetos</Link>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Siga-nos</h4>
            <div className="flex space-x-4 mt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} MeuFreelas. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Cookie Banner Component
function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasAccepted = localStorage.getItem('meufreelas_cookiesAccepted');
      if (!hasAccepted) {
        setIsVisible(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    localStorage.setItem('meufreelas_cookiesAccepted', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-99dark/95 backdrop-blur-sm animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <p className="text-white text-sm flex-1 pr-4">
            Nós fazemos uso de cookies em nosso site para melhorar a sua experiência. Ao utilizar o MeuFreelas, você aceita o uso de cookies de acordo com a nossa{' '}
            <Link to="#" className="text-99blue hover:text-99blue-light underline underline-offset-2 transition-colors">
              política de privacidade
            </Link>
            .
          </p>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
