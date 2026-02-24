import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Briefcase, MessageSquare, DollarSign, Star,
  Settings, Bell, Search, TrendingUp, LogOut, User, FileText,
  Award, CreditCard, Building2, Wallet, Crown,
  ChevronDown, ChevronRight, RefreshCw, Plus, Building,
  BarChart3, Menu, X, Home, Folder, HelpCircle, BookOpen, Type, GitBranch, FileCheck, MapPin, RotateCcw
} from 'lucide-react';
import BadgesWidget from '../components/BadgesWidget';
import BrandLogo from '../components/BrandLogo';
import { apiListNotifications, apiListPayments, apiListProposals, hasApi } from '../lib/api';
import { calculateFreelancerProfileCompletion } from '../lib/profileCompletion';

interface Proposal {
  id: string;
  projectTitle: string;
  value: string;
  status: string;
  sentAt: string;
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

export default function FreelancerDashboard() {
  const navigate = useNavigate();
  const { user, logout, switchAccountType, createSecondaryAccount } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['projetos', 'perfil', 'conta', 'ferramentas', 'ajuda']);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [earnings, setEarnings] = useState('R$ 0,00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !hasApi()) {
        setProposals([]);
        setNotifications(0);
        setEarnings('R$ 0,00');
        setLoading(false);
        return;
      }

      const [proposalsRes, paymentsRes, notificationsRes] = await Promise.all([
        apiListProposals({ freelancerId: user.id }),
        apiListPayments({ userId: user.id, userType: 'freelancer' }),
        apiListNotifications(user.id),
      ]);

      if (proposalsRes.ok) {
        const mapped = (proposalsRes.proposals || []).map((p) => ({
          id: p.id,
          projectTitle: p.projectTitle,
          value: p.value,
          status: p.status,
          sentAt: p.createdAt,
        }));
        setProposals(mapped);
      } else {
        setProposals([]);
      }

      if (paymentsRes.ok) {
        setEarnings(paymentsRes.summary?.monthReceived || 'R$ 0,00');
      }

      if (notificationsRes.ok) {
        const unread = (notificationsRes.notifications || []).filter((n) => !n.isRead).length;
        setNotifications(unread);
      } else {
        setNotifications(0);
      }

      setLoading(false);
    };

    load();
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
    if (success) navigate('/dashboard');
  };

  const handleCreateClientAccount = async () => {
    setSwitchLoading(true);
    const success = await createSecondaryAccount('client');
    setSwitchLoading(false);
    setShowSwitchModal(false);
    if (success) navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading || !user) {
    // Loading state
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-99blue" />
      </div>
    );
  }

  const stats = [
    { label: 'Projetos', value: '0', icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Propostas', value: proposals.length.toString(), icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Ganhos', value: earnings, icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Avaliação', value: (user.rating != null ? user.rating : 0).toFixed(1), icon: Star, color: 'bg-yellow-500' },
  ];
  const savedProfile = (() => {
    try {
      const raw = localStorage.getItem(`profile_${user.id}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();
  const profileCompletion = calculateFreelancerProfileCompletion({
    ...user,
    bio: user.bio || savedProfile.bio,
    skills: (Array.isArray(savedProfile.skills) ? savedProfile.skills.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean) : user.skills) || [],
    hourlyRate: user.hourlyRate || savedProfile.hourlyRate,
    phone: user.phone || savedProfile.phone,
    location: user.location || savedProfile.location,
  });
  const badges = [
    user.isVerified ? 'Perfil Verificado' : null,
    user.isPremium ? 'Premium' : null,
    (user.rating || 0) >= 4.5 && (user.completedProjects || 0) >= 3 ? 'Alta Performance' : null,
    (user.completedProjects || 0) === 0 ? 'Freelancer Novo' : null,
  ].filter(Boolean) as string[];

  const quickLinks: MenuItem[] = [
    { icon: MessageSquare, label: 'Mensagens', href: '/messages', badge: notifications },
    { icon: DollarSign, label: 'Pagamentos', href: '/payments' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
  ];

  const menuSections: MenuSection[] = [
    {
      title: 'Projetos',
      items: [
        { icon: Search, label: 'Buscar projetos', href: '/projects' },
        { icon: Briefcase, label: 'Meus projetos', href: '/freelancer/projects' },
        { icon: FileText, label: 'Minhas propostas', href: '/freelancer/proposals' },
      ]
    },
    {
      title: 'Perfil',
      items: [
        { icon: User, label: 'Editar perfil', href: '/profile/edit' },
        { icon: Award, label: 'Meu perfil', href: '/profile' },
        { icon: Star, label: 'Portfólio', href: '/profile/edit?tab=portfolio' },
      ]
    },
    {
      title: 'Conta',
      items: [
        { icon: CreditCard, label: 'Cartões', href: '/account?tab=cards' },
        { icon: Building2, label: 'Conta bancária', href: '/account?tab=bank' },
        { icon: Wallet, label: 'Pagamentos', href: '/account?tab=payments' },
        { icon: FileCheck, label: 'Verificações', href: '/account?tab=verification' },
        { icon: Crown, label: 'Assinatura', href: '/premium' },
      ]
    },
    {
      title: 'Ferramentas',
      items: [
        { icon: TrendingUp, label: 'Calculadora', href: '/tools' },
        { icon: BarChart3, label: 'Análise', href: '/analytics' },
        { icon: RotateCcw, label: 'Histórico de reembolsos', href: '/payments?tab=refunds' },
        { icon: MapPin, label: 'Informações de localização', href: '/account?tab=location' },
      ]
    },
    {
      title: 'Ajuda',
      items: [
        { icon: GitBranch, label: 'Fluxo de um projeto', href: '/como-funciona#fluxo' },
        { icon: HelpCircle, label: 'Como funciona', href: '/como-funciona' },
        { icon: MessageSquare, label: 'Central de ajuda', href: '/ajuda' },
        { icon: Type, label: 'Formatação de textos', href: '/formatacao-de-textos' },
        { icon: BookOpen, label: 'Blog', href: '/blog' },
      ]
    },
  ];

  const bottomNavItems = [
    { icon: Home, label: 'Início', href: '/freelancer/dashboard', active: true },
    { icon: Search, label: 'Buscar', href: '/projects' },
    { icon: Folder, label: 'Projetos', href: '/freelancer/projects' },
    { icon: MessageSquare, label: 'Mensagens', href: '/messages', badge: 2 },
    { icon: User, label: 'Perfil', href: '/profile' },
  ];

  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003366&color=fff`;

  const SidebarContent = () => (
    <nav className="p-4">
      <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
        <img src={avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
        <div className="ml-3">
          <p className="font-semibold text-gray-800 truncate max-w-[150px]" title={user.name}>{user.name}</p>
          <p className="text-sm text-gray-500 truncate max-w-[150px]" title={user.email}>{user.email}</p>
        </div>
      </div>

      <Link
        to="/freelancer/dashboard"
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
            {item.badge != null && item.badge > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
            )}
          </Link>
        ))}
      </div>

      {menuSections.map((section) => (
        <div key={section.title} className="mb-2">
          <button
            type="button"
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
          type="button"
          onClick={handleLogout}
          className="flex items-center px-4 py-3 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-16 md:pb-0 overflow-x-hidden">
      <header className="bg-99dark text-white hidden md:block sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BrandLogo to="/" darkBg />
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowSwitchModal(true)}
                className="flex items-center px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {user.hasClientAccount ? 'Alternar' : 'Criar Cliente'}
              </button>
              <Link to="/messages" className="relative p-2 text-gray-300 hover:text-white" title="Mensagens">
                <MessageSquare className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications > 99 ? '99+' : notifications}
                  </span>
                )}
              </Link>
              <Link to="/notifications" className="relative p-2 text-gray-300 hover:text-white">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications}</span>
                )}
              </Link>
              <div className="flex items-center space-x-2">
                <img src={avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                <span className="text-sm max-w-[120px] truncate" title={user.name}>{user.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-6 h-11">
            <Link
              to="/freelancer/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-99blue"
            >
              Página inicial
            </Link>
            {menuSections.map((section) => (
              <div key={section.title} className="relative group">
                <button
                  type="button"
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-99blue"
                >
                  {section.title}
                  <ChevronDown className="w-4 h-4 ml-1 text-gray-400 group-hover:text-99blue" />
                </button>
                <div className="absolute left-0 mt-2 bg-white shadow-lg rounded-lg py-2 min-w-[220px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-30">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>

      <header className="bg-99dark text-white md:hidden sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            type="button"
            className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <BrandLogo to="/" darkBg heightClassName="h-7" />
          <Link to="/notifications" className="relative p-2">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications}</span>
            )}
          </Link>
        </div>
      </header>

      <div className="flex">
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden
            />
            <aside className="fixed left-0 top-0 w-72 h-full bg-white shadow-xl z-50 md:hidden overflow-y-auto">
              <div className="p-4 border-b bg-99dark flex items-center justify-between">
                <span className="text-xl font-bold text-white">Menu</span>
                <button
                  type="button"
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

        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              Bem-vindo, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 text-sm md:text-base">Aqui está o resumo da sua atividade</p>
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

          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-800">Meu perfil</h2>
              <Link to="/profile/edit" className="text-99blue text-sm hover:underline">Editar</Link>
            </div>
            <p className="text-sm text-gray-500">
              {user.isPremium ? 'Conta premium ativa.' : 'Membro basico. '}
              {!user.isPremium && <Link to="/premium" className="text-99blue font-medium hover:underline">Seja premium.</Link>}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Minhas conexões</h2>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-2">Conexões disponíveis: <strong className="text-gray-800">20</strong></p>
              <p className="text-sm text-gray-500 mb-2">
                10 conexões restantes de um total de 10 referentes ao seu plano (Gratuito). Essas conexões serão renovadas no dia {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('pt-BR')}.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                10 conexões não expiráveis.
              </p>
              <Link to="/plans" className="inline-block px-4 py-2 bg-99blue text-white rounded font-medium text-sm hover:bg-blue-600 transition-colors">
                Assinar plano
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Perfil preenchido ({profileCompletion.score}%)</h2>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full mb-3">
                <div className="h-full bg-99blue rounded-full transition-all" style={{ width: `${profileCompletion.score}%` }} />
              </div>
            </div>
            
            <BadgesWidget />
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${item.active ? 'text-99blue' : 'text-gray-400'}`}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge != null && item.badge > 0 && (
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
                {user.hasClientAccount ? 'Alternar Conta' : 'Criar Conta Cliente'}
              </h3>
              <button type="button" onClick={() => setShowSwitchModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {user.hasClientAccount ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-99blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="w-8 h-8 text-99blue" />
                </div>
                <p className="text-gray-600 mb-6">Deseja alternar para o painel de cliente?</p>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowSwitchModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="button" onClick={handleSwitchAccount} disabled={switchLoading} className="flex-1 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light disabled:opacity-50">
                    {switchLoading ? 'Alternando...' : 'Alternar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 mb-4">Crie uma conta cliente para publicar projetos!</p>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowSwitchModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Agora não</button>
                  <button type="button" onClick={handleCreateClientAccount} disabled={switchLoading} className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
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
