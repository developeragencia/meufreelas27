import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Briefcase, MessageSquare, DollarSign, Users,
  Settings, Bell, Plus, TrendingUp, LogOut, User, Search,
  CreditCard, Building2, Wallet, Crown,
  ChevronDown, ChevronRight, RefreshCw, Award,
  Menu, X, Home, Folder
} from 'lucide-react';
import GoalsWidget from '../components/GoalsWidget';

interface Project {
  id: string;
  title: string;
  proposals: number;
  budget: string;
  status: string;
  createdAt: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, logout, switchAccountType, createSecondaryAccount } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['projects']);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications] = useState(0);

  useEffect(() => {
    if (!user) return;
    const savedProjects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
    const userProjects = savedProjects.filter((p: any) => p.clientId === user.id);
    setProjects(userProjects);
  }, [user]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleSwitchAccount = async () => {
    setSwitchLoading(true);
    const success = await switchAccountType();
    setSwitchLoading(false);
    setShowSwitchModal(false);
    if (success) navigate('/freelancer/dashboard');
  };

  const handleCreateFreelancerAccount = async () => {
    setSwitchLoading(true);
    const success = await createSecondaryAccount('freelancer');
    setSwitchLoading(false);
    setShowSwitchModal(false);
    if (success) navigate('/freelancer/dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-99blue" />
      </div>
    );
  }

  const totalProposals = projects.reduce((sum, p) => sum + (p.proposals || 0), 0);

  const stats = [
    { label: 'Projetos', value: projects.length.toString(), icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Propostas', value: totalProposals.toString(), icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Gasto', value: 'R$ 0', icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Contratados', value: '0', icon: Users, color: 'bg-orange-500' },
  ];

  const quickLinks: MenuItem[] = [
    { icon: MessageSquare, label: 'Mensagens', href: '/messages' },
    { icon: DollarSign, label: 'Pagamentos', href: '/payments' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
  ];

  const menuSections: MenuSection[] = [
    {
      title: 'Projetos',
      items: [
        { icon: Plus, label: 'Publicar projeto', href: '/project/new' },
        { icon: Briefcase, label: 'Meus projetos', href: '/my-projects' },
        { icon: Search, label: 'Buscar freelancers', href: '/freelancers' },
      ]
    },
    {
      title: 'Perfil',
      items: [
        { icon: User, label: 'Editar perfil', href: '/profile/edit' },
        { icon: Award, label: 'Meu perfil', href: '/profile' },
      ]
    },
    {
      title: 'Conta',
      items: [
        { icon: CreditCard, label: 'Cartões', href: '/account?tab=cards' },
        { icon: Building2, label: 'Conta bancária', href: '/account?tab=bank' },
        { icon: Wallet, label: 'Pagamentos', href: '/account?tab=payments' },
        { icon: Crown, label: 'Assinatura', href: '/premium' },
      ]
    },
  ];

  const bottomNavItems = [
    { icon: Home, label: 'Início', href: '/dashboard', active: true },
    { icon: Plus, label: 'Publicar', href: '/project/new' },
    { icon: Folder, label: 'Projetos', href: '/my-projects' },
    { icon: MessageSquare, label: 'Mensagens', href: '/messages', badge: 2 },
    { icon: User, label: 'Perfil', href: '/profile' },
  ];

  const SidebarContent = () => (
    <nav className="p-4">
      <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
        <div className="w-12 h-12 bg-99blue rounded-full flex items-center justify-center text-white font-semibold">
          <User className="w-6 h-6" />
        </div>
        <div className="ml-3">
          <p className="font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <Link
        to="/dashboard"
        className="flex items-center px-4 py-3 rounded-lg mb-1 bg-99blue/10 text-99blue"
        onClick={() => setMobileMenuOpen(false)}
      >
        <LayoutDashboard className="w-5 h-5 mr-3" />
        <span className="flex-1">Dashboard</span>
      </Link>

      <div className="mb-4">
        {quickLinks.map((item, index) => (
          <Link
            key={index}
            to={item.href}
            className="flex items-center px-4 py-2 rounded-lg mb-1 text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="flex-1">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
            )}
          </Link>
        ))}
      </div>

      {menuSections.map((section) => (
        <div key={section.title} className="mb-2">
          <button
            onClick={() => toggleSection(section.title.toLowerCase())}
            className="flex items-center w-full px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
          >
            {expandedSections.includes(section.title.toLowerCase()) ? (
              <ChevronDown className="w-3 h-3 mr-1" />
            ) : (
              <ChevronRight className="w-3 h-3 mr-1" />
            )}
            {section.title}
          </button>
          {expandedSections.includes(section.title.toLowerCase()) && (
            <div className="ml-2">
              {section.items.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className="flex items-center px-4 py-2 rounded-lg mb-1 text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="pt-4 border-t border-gray-200 mt-4">
        <button
          onClick={logout}
          className="flex items-center px-4 py-3 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-16 md:pb-0">
      <header className="bg-99dark text-white hidden md:block sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold">
                meu<span className="font-light">freelas</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSwitchModal(true)}
                className="flex items-center px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {user.hasFreelancerAccount ? 'Alternar' : 'Criar Freelancer'}
              </button>
              <Link to="/notifications" className="relative p-2 text-gray-300 hover:text-white">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications}</span>
                )}
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-99blue rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-sm">{user.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <header className="bg-99dark text-white md:hidden sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <button 
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="text-xl font-bold">
            meu<span className="font-light">freelas</span>
          </Link>
          <Link to="/notifications" className="relative p-2">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications}</span>
            )}
          </Link>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white min-h-[calc(100vh-64px)] shadow-sm hidden md:block sticky top-16">
          <SidebarContent />
        </aside>

        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 w-72 h-full bg-white shadow-xl z-50 md:hidden overflow-y-auto">
              <div className="p-4 border-b bg-99dark flex items-center justify-between">
                <span className="text-xl font-bold text-white">Menu</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <SidebarContent />
            </aside>
          </>
        )}

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              Bem-vindo, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 text-sm md:text-base">Gerencie seus projetos e encontre talentos</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center">
                  <div className={`${stat.color} p-2 md:p-3 rounded-lg`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-gray-500 text-xs">{stat.label}</p>
                    <p className="text-lg md:text-xl font-semibold text-gray-800">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Link to="/project/new" className="bg-gradient-to-r from-99blue to-99blue-light rounded-xl p-4 md:p-6 text-white">
              <h3 className="font-semibold mb-1">Publicar Novo Projeto</h3>
              <p className="text-sm text-white/80 mb-3">Encontre os melhores freelancers</p>
              <span className="inline-block px-4 py-2 bg-white text-99blue rounded-lg text-sm font-medium">
                Publicar Projeto
              </span>
            </Link>
            <Link to="/freelancers" className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-1">Buscar Freelancers</h3>
              <p className="text-sm text-gray-500 mb-3">Encontre profissionais qualificados</p>
              <span className="text-99blue text-sm font-medium">Ver freelancers →</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Meus Projetos</h2>
              <Link to="/my-projects" className="text-99blue text-sm">Ver todos</Link>
            </div>
            {projects.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{project.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{project.proposals} propostas</span>
                          <span className="text-99blue font-medium">{project.budget}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Concluído' ? 'bg-green-100 text-green-700' :
                        project.status === 'Aberto' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Você ainda não publicou projetos</p>
                <Link to="/project/new" className="text-99blue text-sm mt-2 inline-block">Publicar projeto</Link>
              </div>
            )}
          </div>

          <GoalsWidget />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                item.active ? 'text-99blue' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {showSwitchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {user.hasFreelancerAccount ? 'Alternar Conta' : 'Criar Conta Freelancer'}
              </h3>
              <button onClick={() => setShowSwitchModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {user.hasFreelancerAccount ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-99blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-99blue" />
                </div>
                <p className="text-gray-600 mb-6">Deseja alternar para o painel de freelancer?</p>
                <div className="flex space-x-3">
                  <button onClick={() => setShowSwitchModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleSwitchAccount} disabled={switchLoading} className="flex-1 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light disabled:opacity-50">
                    {switchLoading ? 'Alternando...' : 'Alternar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 mb-4">Crie uma conta freelancer para começar a trabalhar!</p>
                <div className="flex space-x-3">
                  <button onClick={() => setShowSwitchModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Agora não</button>
                  <button onClick={handleCreateFreelancerAccount} disabled={switchLoading} className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                    {switchLoading ? 'Criando...' : 'Criar Conta'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
