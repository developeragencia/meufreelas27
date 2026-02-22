import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, MessageSquare, Search, Settings, LogOut, Star, DollarSign, RefreshCw, User } from 'lucide-react';

type Proposal = {
  id: string;
  projectTitle?: string;
  value?: string;
  status?: string;
  freelancerId?: string;
};

function safeName(value?: string): string {
  if (!value) return 'Usuário';
  return value.split(' ')[0] || value;
}

function loadArray(key: string): any[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function FreelancerDashboard() {
  const navigate = useNavigate();
  const { user, logout, switchAccountType, createSecondaryAccount } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [switchLoading, setSwitchLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const allProposals = loadArray('meufreelas_proposals');
    setProposals(allProposals.filter((p) => p?.freelancerId === user.id));
  }, [user]);

  const totalReceived = useMemo(
    () => proposals.reduce((sum, p) => sum + Number((p?.value || '').replace(/[^\d]/g, '') || 0), 0),
    [proposals]
  );

  if (!user) return null;

  const onSwitch = async () => {
    setSwitchLoading(true);
    const ok = user.hasClientAccount ? await switchAccountType() : await createSecondaryAccount('client');
    setSwitchLoading(false);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-99dark text-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">meu<span className="font-light">freelas</span></Link>
          <div className="flex items-center gap-4">
            <button onClick={onSwitch} disabled={switchLoading} className="px-3 py-1.5 bg-white/10 rounded-lg text-sm">
              <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" />{user.hasClientAccount ? 'Alternar conta' : 'Criar conta cliente'}</span>
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
              <h1 className="text-xl font-semibold text-gray-900">Bem-vindo, {safeName(user.name)}!</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500">Propostas</p><p className="text-2xl font-bold">{proposals.length}</p></div>
          <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500">Avaliação</p><p className="text-2xl font-bold">{Number(user.rating || 0).toFixed(1)}</p></div>
          <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500">Ganhos estimados</p><p className="text-2xl font-bold">R$ {totalReceived.toLocaleString('pt-BR')}</p></div>
          <div className="bg-white rounded-xl shadow-sm p-4"><p className="text-sm text-gray-500">Conta</p><p className="text-2xl font-bold">Freelancer</p></div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link to="/projects" className="bg-white rounded-xl shadow-sm p-4 hover:bg-gray-50"><span className="inline-flex items-center gap-2"><Search className="w-4 h-4" />Buscar projetos</span></Link>
          <Link to="/freelancer/proposals" className="bg-white rounded-xl shadow-sm p-4 hover:bg-gray-50"><span className="inline-flex items-center gap-2"><Briefcase className="w-4 h-4" />Minhas propostas</span></Link>
          <Link to="/messages" className="bg-white rounded-xl shadow-sm p-4 hover:bg-gray-50"><span className="inline-flex items-center gap-2"><MessageSquare className="w-4 h-4" />Mensagens</span></Link>
        </section>

        <section className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Últimas propostas</h2>
            <Link to="/freelancer/proposals" className="text-99blue text-sm">Ver todas</Link>
          </div>
          {proposals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhuma proposta enviada ainda.</p>
              <Link to="/projects" className="text-99blue hover:underline">Buscar projetos agora</Link>
            </div>
          ) : (
            <div className="divide-y">
              {proposals.slice(0, 5).map((p) => (
                <div key={p.id} className="p-4">
                  <p className="font-medium text-gray-900">{p.projectTitle || 'Projeto'}</p>
                  <p className="text-sm text-gray-500 mt-1">{p.status || 'Pendente'} {p.value ? `• ${p.value}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 flex gap-3">
          <Link to="/profile" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><User className="w-4 h-4" />Meu perfil</Link>
          <Link to="/settings" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><Settings className="w-4 h-4" />Configurações</Link>
          <Link to="/payments" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><DollarSign className="w-4 h-4" />Pagamentos</Link>
          <Link to="/premium" className="px-4 py-2 bg-white rounded-lg shadow-sm border inline-flex items-center gap-2"><Star className="w-4 h-4" />Premium</Link>
        </section>
      </main>
    </div>
  );
}
