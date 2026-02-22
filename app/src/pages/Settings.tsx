import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard, 
  Shield,
  Camera,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowLeft,
  Briefcase,
  Mail,
  Smartphone,
  Globe,
  Trash2,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { BR_STATES, getCitiesByUf } from '../constants/brLocations';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguranca' | 'notificacoes' | 'pagamento'>('perfil');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [citiesOptions, setCitiesOptions] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    stateUf: '',
    city: '',
    bio: '',
    website: '',
  });

  // Security
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    emailProjects: true,
    emailMessages: true,
    emailPayments: true,
    pushProjects: false,
    pushMessages: true,
    pushPayments: true,
    newsletter: false
  });

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'card', name: 'Visa terminado em 4242', expiry: '12/2027', isDefault: true },
    { id: '2', type: 'bank', name: 'Banco do Brasil', details: 'Ag: 1234 | CC: ****5678', isDefault: false }
  ]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        setAvatar(newAvatar);
        updateUser({ avatar: newAvatar });
        showSuccess('Foto de perfil atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem(`profile_${user?.id}`);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      const stateUf = (parsed.stateUf as string) || '';
      const city = (parsed.city as string) || '';
      const location = (parsed.location as string) || '';
      setProfileData((prev) => ({
        ...prev,
        phone: (parsed.phone as string) || '',
        bio: (parsed.bio as string) || '',
        website: (parsed.website as string) || '',
        stateUf,
        city,
        location: city && stateUf ? `${city}, ${stateUf}` : location,
      }));
    } catch {
      // Ignora storage inválido para não quebrar a página.
    }
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      if (!profileData.stateUf) {
        setCitiesOptions([]);
        setIsLoadingCities(false);
        return;
      }
      setIsLoadingCities(true);
      const cities = await getCitiesByUf(profileData.stateUf);
      if (mounted) {
        setCitiesOptions(cities);
        setIsLoadingCities(false);
      }
    };
    loadCities();
    return () => {
      mounted = false;
    };
  }, [profileData.stateUf]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedLocation =
      profileData.city && profileData.stateUf
        ? `${profileData.city}, ${profileData.stateUf}`
        : profileData.location;
    let previousProfile: Record<string, unknown> = {};
    try {
      previousProfile = JSON.parse(localStorage.getItem(`profile_${user?.id}`) || '{}') as Record<string, unknown>;
    } catch {
      previousProfile = {};
    }
    localStorage.setItem(
      `profile_${user?.id}`,
      JSON.stringify({
        ...previousProfile,
        phone: profileData.phone,
        bio: profileData.bio,
        website: profileData.website,
        city: profileData.city,
        stateUf: profileData.stateUf,
        location: normalizedLocation,
      })
    );
    updateUser({ 
      name: profileData.name,
      avatar: avatar 
    });
    window.dispatchEvent(new CustomEvent('meufreelas:profile-updated', { detail: { userId: user?.id } }));
    showSuccess('Perfil atualizado com sucesso!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres!');
      return;
    }
    showSuccess('Senha alterada com sucesso!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSaveNotifications = () => {
    showSuccess('Preferências de notificação salvas!');
  };

  const handleSetDefaultPayment = (id: string) => {
    setPaymentMethods(methods => 
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
  };

  const handleRemovePayment = (id: string) => {
    if (confirm('Tem certeza que deseja remover este método de pagamento?')) {
      setPaymentMethods(methods => methods.filter(m => m.id !== id));
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('ATENÇÃO: Esta ação não pode ser desfeita. Deseja realmente excluir sua conta?')) {
      if (confirm('Digite "EXCLUIR" para confirmar a exclusão da sua conta.')) {
        logout();
        navigate('/');
      }
    }
  };

  const clientProfileChecks = [
    Boolean(avatar),
    Boolean(profileData.name.trim()),
    Boolean(profileData.phone.trim()),
    Boolean(profileData.stateUf),
    Boolean(profileData.city),
    Boolean(profileData.bio.trim()),
  ];
  const clientProfilePercent = Math.round(
    (clientProfileChecks.filter(Boolean).length / clientProfileChecks.length) * 100
  );

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link to="/" className="text-2xl font-bold">
                meu<span className="font-light">freelas</span>
              </Link>
            </div>
            <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Configurações</h1>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveTab('perfil')}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeTab === 'perfil' ? 'bg-99blue/10 text-99blue border-r-2 border-99blue' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5 mr-3" />
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('seguranca')}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeTab === 'seguranca' ? 'bg-99blue/10 text-99blue border-r-2 border-99blue' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Lock className="w-5 h-5 mr-3" />
                Segurança
              </button>
              <button
                onClick={() => setActiveTab('notificacoes')}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeTab === 'notificacoes' ? 'bg-99blue/10 text-99blue border-r-2 border-99blue' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-5 h-5 mr-3" />
                Notificações
              </button>
              <button
                onClick={() => setActiveTab('pagamento')}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  activeTab === 'pagamento' ? 'bg-99blue/10 text-99blue border-r-2 border-99blue' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="w-5 h-5 mr-3" />
                Pagamento
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'perfil' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Informações do Perfil</h2>
                <div className="mb-6 rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Progresso do perfil</span>
                    <span className="text-xs font-semibold text-99blue">{clientProfilePercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full rounded-full bg-99blue transition-all" style={{ width: `${clientProfilePercent}%` }} />
                  </div>
                </div>
                
                {/* Avatar */}
                <div className="flex items-center mb-6">
                  <div className="relative">
                    <div 
                      onClick={handleAvatarClick}
                      className="w-24 h-24 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {avatar ? (
                        <img src={avatar} alt={user?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-99blue flex items-center justify-center text-white text-3xl font-semibold">
                          {user?.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 p-2 bg-99blue text-white rounded-full hover:bg-99blue-light transition-colors shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="ml-6">
                    <p className="font-medium text-gray-900">Foto de perfil</p>
                    <p className="text-sm text-gray-500">JPG, PNG ou GIF. Máximo 2MB.</p>
                    <button 
                      onClick={handleAvatarClick}
                      className="mt-2 text-sm text-99blue hover:underline"
                    >
                      Alterar foto
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={profileData.stateUf}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              stateUf: e.target.value,
                              city: '',
                              location: '',
                            }))
                          }
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                        >
                          <option value="">Selecione o estado</option>
                          {BR_STATES.map((state) => (
                            <option key={state.uf} value={state.uf}>
                              {state.name} ({state.uf})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={profileData.city}
                        disabled={!profileData.stateUf || isLoadingCities}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            city: e.target.value,
                            location: e.target.value && prev.stateUf ? `${e.target.value}, ${prev.stateUf}` : '',
                          }))
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="">
                          {!profileData.stateUf
                            ? 'Selecione primeiro o estado'
                            : isLoadingCities
                              ? 'Carregando cidades...'
                              : 'Selecione a cidade'}
                        </option>
                        {citiesOptions.map((cityName) => (
                          <option key={cityName} value={cityName}>
                            {cityName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biografia
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={4}
                      placeholder="Conte um pouco sobre você..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                        placeholder="https://seusite.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="flex items-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6">Alterar Senha</h2>
                  
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Senha atual
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nova senha
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar nova senha
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="flex items-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-4">Autenticação de Dois Fatores</h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-800">Autenticação de dois fatores</p>
                        <p className="text-sm text-gray-500">Adicione uma camada extra de segurança</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Ativar
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-4">Sessões Ativas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Globe className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Navegador atual</p>
                          <p className="text-sm text-gray-500">São Paulo, Brasil • Chrome em Windows</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">Atual</span>
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
                  <h3 className="text-md font-semibold text-red-600 mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Zona de Perigo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Conta
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Preferências de Notificação</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Email
                    </h3>
                    <div className="space-y-3 ml-7">
                      {[
                        { key: 'emailProjects', label: 'Novos projetos relacionados às minhas habilidades' },
                        { key: 'emailMessages', label: 'Novas mensagens' },
                        { key: 'emailPayments', label: 'Pagamentos processados' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between py-2">
                          <span className="text-gray-700">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="w-5 h-5 text-99blue border-gray-300 rounded focus:ring-99blue"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Push
                    </h3>
                    <div className="space-y-3 ml-7">
                      {[
                        { key: 'pushProjects', label: 'Novos projetos' },
                        { key: 'pushMessages', label: 'Novas mensagens' },
                        { key: 'pushPayments', label: 'Pagamentos' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between py-2">
                          <span className="text-gray-700">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="w-5 h-5 text-99blue border-gray-300 rounded focus:ring-99blue"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Marketing
                    </h3>
                    <div className="ml-7">
                      <label className="flex items-center justify-between py-2">
                        <span className="text-gray-700">Newsletter semanal</span>
                        <input
                          type="checkbox"
                          checked={notifications.newsletter}
                          onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                          className="w-5 h-5 text-99blue border-gray-300 rounded focus:ring-99blue"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t mt-6">
                  <button
                    onClick={handleSaveNotifications}
                    className="flex items-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Preferências
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'pagamento' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Métodos de Pagamento</h2>
                
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-12 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${
                            method.type === 'card' ? 'bg-red-500' : 'bg-blue-500'
                          }`}>
                            {method.type === 'card' ? 'VISA' : 'BB'}
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-gray-800">{method.name}</p>
                            <p className="text-sm text-gray-500">{method.expiry || method.details}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {method.isDefault ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Principal</span>
                          ) : (
                            <button
                              onClick={() => handleSetDefaultPayment(method.id)}
                              className="text-sm text-99blue hover:underline"
                            >
                              Tornar principal
                            </button>
                          )}
                          <button
                            onClick={() => handleRemovePayment(method.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-99blue hover:text-99blue transition-colors flex items-center justify-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar novo método de pagamento
                </button>

                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-medium text-gray-900 mb-4">Preferências de Saque</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">Saque automático</p>
                        <p className="text-sm text-gray-500">Transferir para conta bancária quando atingir R$ 100</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-99blue"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
