import { useState, useEffect } from 'react';
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
  Shield,
  AlertTriangle,
  Ban,
  UserX,
  Search,
  Eye,
  Unlock,
  LogOut,
  X,
  Gavel
} from 'lucide-react';
import { type Sanction, getAllSanctions, liftSanction, processAppeal } from '../utils/sanctions';
import type { ViolationType } from '../utils/contentModerator';

const violationLabels: Record<ViolationType, string> = {
  PHONE_NUMBER: 'Telefone',
  EMAIL: 'Email',
  URL: 'Link externo',
  SOCIAL_MEDIA: 'Rede social',
  PAYMENT_REQUEST: 'Pagamento externo',
  OFFENSIVE_CONTENT: 'Conteúdo ofensivo',
  COMMISSION_MENTION: 'Menção à comissão'
};

export default function AdminSanctions() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [filteredSanctions, setFilteredSanctions] = useState<Sanction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'violation' | 'penalty' | 'ban'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'lifted'>('all');
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLiftModal, setShowLiftModal] = useState(false);
  const [liftReason, setLiftReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.type !== 'admin') {
      navigate(user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    loadSanctions();
  }, []);

  useEffect(() => {
    filterSanctions();
  }, [sanctions, searchTerm, filterType, filterStatus]);

  const loadSanctions = () => {
    const allSanctions = getAllSanctions();
    // Mock data for demo
    const mockSanctions: Sanction[] = [
      {
        id: 'sanction_1',
        userId: 'user1',
        userName: 'João Silva',
        userType: 'freelancer',
        type: 'violation',
        violations: ['PHONE_NUMBER'],
        reason: 'Violação dos Termos de Uso',
        description: 'Compartilhamento de número de telefone',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      },
      {
        id: 'sanction_2',
        userId: 'user2',
        userName: 'Maria Santos',
        userType: 'freelancer',
        type: 'penalty',
        violations: ['EMAIL', 'URL'],
        reason: 'Penalização por múltiplas violações',
        description: 'Compartilhamento de email e link externo',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      },
      {
        id: 'sanction_3',
        userId: 'user3',
        userName: 'Pedro Costa',
        userType: 'client',
        type: 'ban',
        violations: ['PAYMENT_REQUEST', 'PHONE_NUMBER', 'EMAIL'],
        reason: 'Banimento por violação grave ou reincidência',
        description: 'Solicitação de pagamento externo, telefone e email',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ];
    setSanctions([...mockSanctions, ...allSanctions]);
  };

  const filterSanctions = () => {
    let filtered = sanctions;

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    setFilteredSanctions(filtered);
  };

  const handleLiftSanction = () => {
    if (!selectedSanction) return;
    
    const success = liftSanction(selectedSanction.id, user?.id || 'admin');
    if (success) {
      loadSanctions();
      setShowLiftModal(false);
      setSelectedSanction(null);
      setLiftReason('');
    }
  };

  const handleProcessAppeal = (approved: boolean) => {
    if (!selectedSanction) return;
    
    const success = processAppeal(selectedSanction.id, approved);
    if (success) {
      loadSanctions();
      setShowDetailModal(false);
      setSelectedSanction(null);
    }
  };

  const getSanctionIcon = (type: string) => {
    switch (type) {
      case 'violation':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'penalty':
        return <UserX className="w-5 h-5 text-red-500" />;
      case 'ban':
        return <Ban className="w-5 h-5 text-red-700" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSanctionBadge = (type: string) => {
    switch (type) {
      case 'violation':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Violação</span>;
      case 'penalty':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Penalização</span>;
      case 'ban':
        return <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-medium">Banimento</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">-</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Ativa</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Expirada</span>;
      case 'lifted':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Removida</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">-</span>;
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Usuários', href: '/admin/users' },
    { icon: Shield, label: 'Sanções', active: true, href: '/admin/sanctions' },
    { icon: Briefcase, label: 'Projetos', href: '/admin/projects' },
    { icon: DollarSign, label: 'Financeiro', href: '/admin/financeiro' },
    { icon: MessageSquare, label: 'Suporte', href: '/admin/suporte' },
    { icon: Settings, label: 'Configurações', href: '/admin/configuracoes' },
  ];

  if (!user || user.type !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
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
              <button onClick={logout} className="flex items-center space-x-2 text-gray-300 hover:text-white">
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Administrativo</p>
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg mb-1 transition-colors ${
                  item.active ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="flex-1">{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Gerenciamento de Sanções</h1>
            <p className="text-gray-500">Gerencie violações, penalizações e banimentos</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Violações</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {sanctions.filter(s => s.type === 'violation').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Penalizações</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {sanctions.filter(s => s.type === 'penalty').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center mr-3">
                  <Ban className="w-5 h-5 text-red-800" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Banimentos</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {sanctions.filter(s => s.type === 'ban').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Gavel className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Apelações</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {sanctions.filter(s => s.appealStatus === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por usuário ou motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Todos os tipos</option>
                <option value="violation">Violação</option>
                <option value="penalty">Penalização</option>
                <option value="ban">Banimento</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativa</option>
                <option value="expired">Expirada</option>
                <option value="lifted">Removida</option>
              </select>
            </div>
          </div>

          {/* Sanctions Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violações</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSanctions.map((sanction) => (
                    <tr key={sanction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                            {sanction.userName.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-800">{sanction.userName}</p>
                            <p className="text-sm text-gray-500">{sanction.userType === 'freelancer' ? 'Freelancer' : 'Cliente'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getSanctionIcon(sanction.type)}
                          <span className="ml-2">{getSanctionBadge(sanction.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {sanction.violations.map((v, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {violationLabels[v]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(sanction.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(sanction.createdAt).toLocaleDateString('pt-BR')}
                        {sanction.expiresAt && (
                          <p className="text-xs text-gray-400">
                            Expira: {new Date(sanction.expiresAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => { setSelectedSanction(sanction); setShowDetailModal(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {sanction.status === 'active' && (
                            <button
                              onClick={() => { setSelectedSanction(sanction); setShowLiftModal(true); }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Remover sanção"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredSanctions.length === 0 && (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma sanção encontrada</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSanction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                {getSanctionIcon(selectedSanction.type)}
                <span className="ml-2">Detalhes da Sanção</span>
              </h2>
              <button onClick={() => setShowDetailModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Usuário</p>
                <p className="font-medium">{selectedSanction.userName}</p>
                <p className="text-sm text-gray-500">{selectedSanction.userType === 'freelancer' ? 'Freelancer' : 'Cliente'}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Motivo</p>
                <p className="font-medium">{selectedSanction.reason}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedSanction.description}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Violações Detectadas</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSanction.violations.map((v, i) => (
                    <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {violationLabels[v]}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Data da Sanção</p>
                  <p className="font-medium">{new Date(selectedSanction.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                {selectedSanction.expiresAt && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Expira em</p>
                    <p className="font-medium">{new Date(selectedSanction.expiresAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
              
              {selectedSanction.appealStatus === 'pending' && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Apelação Pendente</p>
                  <p className="text-sm text-yellow-700 mb-3">{selectedSanction.appealReason}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleProcessAppeal(true)}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleProcessAppeal(false)}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lift Modal */}
      {showLiftModal && selectedSanction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Unlock className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Remover Sanção</h2>
              <p className="text-gray-500 mb-4">
                Tem certeza que deseja remover a sanção de <strong>{selectedSanction.userName}</strong>?
              </p>
              
              <textarea
                value={liftReason}
                onChange={(e) => setLiftReason(e.target.value)}
                placeholder="Motivo da remoção (opcional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                rows={3}
              />
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => { setShowLiftModal(false); setSelectedSanction(null); setLiftReason(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLiftSanction}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Remover Sanção
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
