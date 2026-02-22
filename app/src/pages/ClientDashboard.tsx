import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, MessageSquare, Search, Settings, LogOut, Users, DollarSign, Plus, RefreshCw, User } from 'lucide-react';

type Project = {
  id: string;
  title?: string;
  proposals?: number;
  budget?: string;
  status?: string;
  clientId?: string;
};

function loadArray(key: string): any[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function firstName(name?: string): string {
  if (!name) return 'Usuário';
  return name.split(' ')[0] || name;
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, logout, switchAccountType, createSecondaryAccount } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const allProjects = loadArray('meufreelas_projects');
    setProjects(allProjects.filter((p) => p?.clientId === user.id));
  }, [user]);

  const totalProposals = useMemo(
    () => projects.reduce((sum, p) => sum + Number(p?.proposals || 0), 0),
    [projects]
  );

  if (!user) return null;

  const onSwitch = async () => {
    setSwitchLoading(true);
    const ok = user.hasFreelancerAccount ? await switchAccountType() : await createSecondaryAccount('freelancer');
    setSwitchLoading(false);
    if (ok) navigate('/freelancer/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-99dark text-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">meu<span className="font-light">freelas</span></Link>
          <div className="flex items-center gap-4">
            <button onClick={onSwitch} disabled={switchLoading} className="px-3 py-1.5 bg-white/10 rounded-lg text-sm">
              <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" />{user.hasFreelancerAccount ? 'Alternar conta' : 'Criar conta freelancer'}</span>
            </button>
            <button onClick={logout} className="px-3 py-1.5 bg-white/10 rounded-lg text-sm">
              <span className="inline-flex items-center gap-2"><LogOut className="w-4 h-4" />Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=003366&color=fff`}
              alt={user.name}
              className="w-14 h-14 rounded-full"
            />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Bem-vindo, {firstName(user.name)}!</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500">Projetos</p><p className="text-2xl font-bold">{projects.length}</p></div>
          <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500">Propostas recebidas</p><p className="text-2xl font-bold">{totalProposals}</p></div>
          <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500">Freelancers contratados</p><p className="text-2xl font-bold">0</p></div>
          <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500">Gastos</p><p className="text-2xl font-bold">R$ 0</p></div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link to="/project/new" className="bg-white rounded-xl shadow-sm p-4 hover:bg-gray-50"><span className="inline-flex items-center gap-2"><Plus className="w-4 h-4" />Publicar projeto</span></Link>
          <Link to="/my-projects" className="bg-white rounded-xl shadow-sm p-4 hover:bg-gray-50"><span className="inline-flex items-center gap-2"><Briefcase className="w-4 h-4" />Meus projetos</span></Link>
          <Link to="/freelancers" className="bg-white rounded-xl shadow-sm p-4 hover:bg-gray-50"><span className="inline-flex items-center gap-2"><Search className="w-4 h-4" />Buscar freelancers</span></Link>
        </section>

        <section className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Projetos recentes</h2>
            <Link to="/my-projects" className="text-99blue text-sm">Ver todos</Link>
          </div>
          {projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Você ainda não publicou projetos.</p>
              <Link to="/project/new" className="text-99blue hover:underline">Publicar agora</Link>
            </div>
          ) : (
            <div className="divide-y">
              {projects.slice(0, 5).map((p) => (
                <div key={p.id} className="p-4">
                  <p className="font-medium text-gray-900">{p.title || 'Projeto sem título'}</p>
                  <p className="text-sm text-gray-500 mt-1">{p.status || 'Aberto'} • {p.proposals || 0} propostas {p.budget ? `• ${p.budget}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 flex gap-3">
          <Link to="/messages" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><MessageSquare className="w-4 h-4" />Mensagens</Link>
          <Link to="/payments" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><DollarSign className="w-4 h-4" />Pagamentos</Link>
          <Link to="/settings" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><Settings className="w-4 h-4" />Configurações</Link>
          <Link to="/profile" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><User className="w-4 h-4" />Perfil</Link>
          <Link to="/freelancers" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><Users className="w-4 h-4" />Freelancers</Link>
        </section>
      </main>
    </div>
  );
}
