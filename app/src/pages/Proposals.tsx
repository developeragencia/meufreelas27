import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  MessageSquare,
  Eye
} from 'lucide-react';

interface Proposal {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  value: string;
  status: 'Pendente' | 'Aceita' | 'Recusada';
  sentAt: string;
  message: string;
}

export default function Proposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filter, setFilter] = useState<'Todas' | 'Pendente' | 'Aceita' | 'Recusada'>('Todas');

  useEffect(() => {
    if (!user) return;
    try {
      const stored = JSON.parse(localStorage.getItem('meufreelas_proposals') || '[]');
      const safe = Array.isArray(stored) ? stored : [];
      const normalized: Proposal[] = safe
        .filter((p: any) => p?.freelancerId === user.id)
        .map((p: any) => ({
          id: String(p.id),
          projectId: String(p.projectId || ''),
          projectTitle: p.projectTitle || 'Projeto',
          clientName: p.clientName || 'Cliente',
          value: p.value || 'R$ 0',
          status: (p.status === 'Aceita' || p.status === 'Recusada') ? p.status : 'Pendente',
          sentAt: p.sentAt || '',
          message: p.message || '',
        }));
      setProposals(normalized);
    } catch {
      setProposals([]);
    }
  }, [user]);

  const filteredProposals = proposals.filter(p => 
    filter === 'Todas' || p.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aceita':
        return 'bg-green-100 text-green-700';
      case 'Recusada':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
            <Link to="/freelancer/dashboard" className="text-gray-300 hover:text-white">
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Minhas Propostas</h1>
            <p className="text-gray-500">Gerencie suas propostas enviadas</p>
          </div>
          <Link
            to="/projects"
            className="px-4 py-2 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors"
          >
            Buscar Projetos
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto whitespace-nowrap space-x-2 mb-6 pb-1">
          {(['Todas', 'Pendente', 'Aceita', 'Recusada'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-99blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <div key={proposal.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Link 
                      to={`/project/${proposal.projectId}`}
                      className="text-lg font-semibold text-gray-800 hover:text-99blue"
                    >
                      {proposal.projectTitle}
                    </Link>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-3">
                    Cliente: {proposal.clientName}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {proposal.value}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Enviada {proposal.sentAt}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">{proposal.message}</p>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                  <Link
                    to={`/project/${proposal.projectId}`}
                    className="flex items-center px-4 py-2 text-99blue hover:bg-sky-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Projeto
                  </Link>
                  {proposal.status === 'Aceita' && (
                    <Link
                      to="/messages"
                      className="flex items-center px-4 py-2 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Conversar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Nenhuma proposta {filter !== 'Todas' && filter.toLowerCase()}
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === 'Todas' 
                ? 'Você ainda não enviou nenhuma proposta.' 
                : `Você não tem propostas ${filter.toLowerCase()}.`}
            </p>
            <Link
              to="/projects"
              className="inline-block px-6 py-3 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors"
            >
              Encontrar Projetos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
