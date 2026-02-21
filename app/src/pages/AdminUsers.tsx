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
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  LogOut,
  Plus,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  type: 'freelancer' | 'client' | 'admin';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  phone?: string;
  location?: string;
  registeredAt: string;
  lastLogin?: string;
  avatar?: string;
  verified: boolean;
  projectsCount?: number;
  proposalsCount?: number;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'freelancer' | 'client' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending' | 'blocked'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'freelancer' as 'freelancer' | 'client' | 'admin',
    phone: '',
    location: '',
    status: 'active' as 'active' | 'inactive' | 'pending' | 'blocked'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.type !== 'admin') {
      navigate(user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterType, filterStatus]);

  const loadUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const mockUsers: UserData[] = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@email.com',
        type: 'freelancer',
        status: 'active',
        phone: '(11) 98765-4321',
        location: 'São Paulo, SP',
        registeredAt: '2024-01-15T10:30:00',
        lastLogin: '2024-02-20T14:20:00',
        verified: true,
        proposalsCount: 45,
        projectsCount: 12
      },
      {
        id: '2',
        name: 'Empresa ABC Ltda',
        email: 'contato@abc.com',
        type: 'client',
        status: 'active',
        phone: '(11) 3456-7890',
        location: 'Rio de Janeiro, RJ',
        registeredAt: '2024-01-10T09:00:00',
        lastLogin: '2024-02-19T16:45:00',
        verified: true,
        projectsCount: 8
      },
      {
        id: '3',
        name: 'Maria Santos',
        email: 'maria@email.com',
        type: 'freelancer',
        status: 'pending',
        phone: '(21) 99876-5432',
        location: 'Belo Horizonte, MG',
        registeredAt: '2024-02-18T11:20:00',
        verified: false,
        proposalsCount: 3
      },
      {
        id: '4',
        name: 'Tech Solutions',
        email: 'tech@sol.com',
        type: 'client',
        status: 'active',
        phone: '(31) 4567-8901',
        location: 'Curitiba, PR',
        registeredAt: '2023-12-05T14:30:00',
        lastLogin: '2024-02-20T09:15:00',
        verified: true,
        projectsCount: 25
      },
      {
        id: '5',
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        type: 'freelancer',
        status: 'blocked',
        phone: '(41) 98765-1234',
        location: 'Porto Alegre, RS',
        registeredAt: '2023-11-20T10:00:00',
        verified: false,
        proposalsCount: 8
      },
      {
        id: '6',
        name: 'Marketing Pro',
        email: 'marketing@pro.com',
        type: 'client',
        status: 'inactive',
        phone: '(51) 3456-7890',
        location: 'Florianópolis, SC',
        registeredAt: '2023-10-15T16:45:00',
        lastLogin: '2024-01-10T11:30:00',
        verified: true,
        projectsCount: 5
      }
    ];
    const allUsers = [...mockUsers, ...storedUsers];
    setUsers(allUsers);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(u => u.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleAddUser = () => {
    const newUser: UserData = {
      id: Date.now().toString(),
      ...formData,
      registeredAt: new Date().toISOString(),
      verified: false
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers.filter(u => !['1','2','3','4','5','6'].includes(u.id))));
    setShowAddModal(false);
    resetForm();
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    const updatedUsers = users.map(u => 
      u.id === selectedUser.id ? { ...u, ...formData } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers.filter(u => !['1','2','3','4','5','6'].includes(u.id))));
    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    const updatedUsers = users.filter(u => u.id !== selectedUser.id);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers.filter(u => !['1','2','3','4','5','6'].includes(u.id))));
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = (userId: string, newStatus: UserData['status']) => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, status: newStatus } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers.filter(u => !['1','2','3','4','5','6'].includes(u.id))));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      type: 'freelancer',
      phone: '',
      location: '',
      status: 'active'
    });
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      type: user.type,
      phone: user.phone || '',
      location: user.location || '',
      status: user.status
    });
    setShowEditModal(true);
  };

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Users, label: 'Usuários', active: true, href: '/admin/users' },
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
            <h1 className="text-2xl font-semibold text-gray-800">Gerenciamento de Usuários</h1>
            <p className="text-gray-500">Gerencie todos os usuários da plataforma</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Total de Usuários</p>
              <p className="text-2xl font-semibold text-gray-800">{users.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Freelancers</p>
              <p className="text-2xl font-semibold text-blue-600">{users.filter(u => u.type === 'freelancer').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Clientes</p>
              <p className="text-2xl font-semibold text-green-600">{users.filter(u => u.type === 'client').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-gray-500 text-sm">Pendentes</p>
              <p className="text-2xl font-semibold text-yellow-600">{users.filter(u => u.status === 'pending').length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
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
                  <option value="freelancer">Freelancer</option>
                  <option value="client">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="pending">Pendente</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Usuário
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                            {userData.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-800">{userData.name}</p>
                            <p className="text-sm text-gray-500">{userData.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userData.type === 'freelancer' ? 'bg-blue-100 text-blue-700' :
                          userData.type === 'client' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {userData.type === 'freelancer' ? 'Freelancer' : userData.type === 'client' ? 'Cliente' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userData.status === 'active' ? 'bg-green-100 text-green-700' :
                          userData.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                          userData.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {userData.status === 'active' ? 'Ativo' : userData.status === 'inactive' ? 'Inativo' : userData.status === 'pending' ? 'Pendente' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(userData.registeredAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(userData)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {userData.status === 'active' ? (
                            <button
                              onClick={() => handleToggleStatus(userData.id, 'blocked')}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                              title="Bloquear"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(userData.id, 'active')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Ativar"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedUser(userData); setShowDeleteModal(true); }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuários
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Novo Usuário</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="freelancer">Freelancer</option>
                  <option value="client">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Criar Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Editar Usuário</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="freelancer">Freelancer</option>
                  <option value="client">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="pending">Pendente</option>
                  <option value="blocked">Bloqueado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditUser}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Excluir Usuário</h2>
              <p className="text-gray-500 mb-6">
                Tem certeza que deseja excluir o usuário <strong>{selectedUser.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
