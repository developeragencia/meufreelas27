import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  DollarSign, 
  MessageSquare, 
  Settings,
  Bell,
  TrendingUp,
  BarChart3,
  Shield,
  LogOut
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.type !== 'admin') {
      navigate(user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  if (!user || user.type !== 'admin') return null;

  const stats = [
    { label: 'Total de Usuários', value: '45.231', icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Projetos Ativos', value: '1.847', icon: Briefcase, color: 'bg-green-500', change: '+8%' },
    { label: 'Faturamento do Mês', value: 'R$ 2.4M', icon: DollarSign, color: 'bg-purple-500', change: '+23%' },
    { label: 'Taxa de Conversão', value: '78%', icon: TrendingUp, color: 'bg-orange-500', change: '+5%' },
  ];

  const recentUsers = [
    { id: 1, name: 'João Silva', email: 'joao@email.com', type: 'Freelancer', date: '2 minutos atrás', status: 'Ativo' },
    { id: 2, name: 'Empresa ABC', email: 'contato@abc.com', type: 'Cliente', date: '15 minutos atrás', status: 'Ativo' },
    { id: 3, name: 'Maria Santos', email: 'maria@email.com', type: 'Freelancer', date: '1 hora atrás', status: 'Pendente' },
    { id: 4, name: 'Tech Solutions', email: 'tech@sol.com', type: 'Cliente', date: '2 horas atrás', status: 'Ativo' },
  ];

  const recentProjects = [
    { id: 1, title: 'Desenvolvimento de E-commerce', client: 'Loja Virtual Ltda', budget: 'R$ 8.500', status: 'Em andamento' },
    { id: 2, title: 'Design de Identidade Visual', client: 'Startup Tech', budget: 'R$ 3.200', status: 'Aberto' },
    { id: 3, title: 'Redação de Conteúdo SEO', client: 'Marketing Pro', budget: 'R$ 1.500', status: 'Concluído' },
  ];

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true, href: '/admin/dashboard' },
    { icon: Users, label: 'Usuários', active: false, href: '#' },
    { icon: Briefcase, label: 'Projetos', active: false, href: '#' },
    { icon: DollarSign, label: 'Financeiro', active: false, href: '#' },
    { icon: MessageSquare, label: 'Suporte', active: false, href: '#' },
    { icon: BarChart3, label: 'Relatórios', active: false, href: '#' },
    { icon: Shield, label: 'Segurança', active: false, href: '#' },
    { icon: Settings, label: 'Configurações', active: false, href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold">
                meu<span className="font-light">freelas</span>
              </a>
              <span className="ml-4 px-3 py-1 bg-red-500 text-xs rounded-full">ADMIN</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-300 hover:text-white">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={logout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:block">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white min-h-screen shadow-sm hidden md:block">
          <nav className="p-4">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Menu Administrativo
              </p>
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg mb-1 transition-colors ${
                    item.active
                      ? 'bg-red-50 text-red-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{item.label}</span>
                </a>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-800">
              Painel Administrativo
            </h1>
            <p className="text-gray-500">Visão geral da plataforma</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-500 text-sm font-medium">{stat.change}</span>
                </div>
                <div className="mt-4">
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Users */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Últimos Usuários</h2>
                  <a href="#" className="text-99blue hover:underline text-sm">Ver todos</a>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentUsers.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-400">{user.type}</span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-gray-400">{user.date}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Projetos Recentes</h2>
                  <a href="#" className="text-99blue hover:underline text-sm">Ver todos</a>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentProjects.map((project) => (
                  <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-800">{project.title}</h4>
                        <p className="text-sm text-gray-500">{project.client}</p>
                        <p className="text-sm text-99blue mt-1">{project.budget}</p>
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
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-2">Gerenciar Usuários</h3>
              <p className="text-sm text-white/80 mb-4">Visualize e gerencie todos os usuários</p>
              <a href="#" className="inline-block px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                Acessar
              </a>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-2">Projetos</h3>
              <p className="text-sm text-white/80 mb-4">Gerencie todos os projetos da plataforma</p>
              <a href="#" className="inline-block px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                Acessar
              </a>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-2">Financeiro</h3>
              <p className="text-sm text-white/80 mb-4">Visualize relatórios financeiros</p>
              <a href="#" className="inline-block px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                Acessar
              </a>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <h3 className="font-semibold mb-2">Suporte</h3>
              <p className="text-sm text-white/80 mb-4">Atenda tickets de suporte</p>
              <a href="#" className="inline-block px-4 py-2 bg-white text-orange-600 rounded-lg text-sm font-medium hover:bg-gray-100">
                Acessar
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
