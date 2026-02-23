import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Clock, DollarSign, Eye, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiDeleteProject, apiListProjects, apiListProposals, hasApi, type ApiProject } from '../lib/api';

export default function MyProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [freelancerProjects, setFreelancerProjects] = useState<ApiProject[]>([]);
  const [filter, setFilter] = useState<'Todos' | 'Aberto' | 'Em andamento' | 'Concluído'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    if (!hasApi()) {
      if (user.type === 'client') {
        try {
          const raw = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
          const list: ApiProject[] = raw
            .filter((p: { client_id?: string; clientId?: string }) => (p.client_id || p.clientId) === user.id)
            .map((p: Record<string, unknown>) => ({
              id: String(p.id ?? ''),
              clientId: String(p.client_id ?? p.clientId ?? ''),
              clientName: String(p.clientName ?? 'Cliente'),
              title: String(p.title ?? ''),
              description: String(p.description ?? ''),
              budget: String(p.budget ?? ''),
              category: String(p.category ?? ''),
              skills: Array.isArray(p.skills) ? p.skills : [],
              experienceLevel: String(p.experienceLevel ?? 'intermediate'),
              proposalDays: String(p.proposalDays ?? ''),
              visibility: 'public',
              status: (p.status === 'in_progress' ? 'Em andamento' : p.status === 'completed' ? 'Concluído' : p.status === 'cancelled' ? 'Cancelado' : 'Aberto') as ApiProject['status'],
              proposals: 0,
              createdAt: String(p.createdAt ?? ''),
              updatedAt: String(p.updatedAt ?? p.createdAt ?? ''),
            }));
          setProjects(list);
        } catch {
          setProjects([]);
        }
      } else {
        setProjects([]);
        setFreelancerProjects([]);
      }
      setIsLoading(false);
      return;
    }
    if (user.type === 'client') {
      const res = await apiListProjects({ clientId: user.id, sortBy: 'recent' });
      setIsLoading(false);
      if (!res.ok) return;
      setProjects(res.projects || []);
      setFreelancerProjects([]);
      return;
    }

    const res = await apiListProposals({ freelancerId: user.id, status: 'Aceita' });
    setIsLoading(false);
    if (!res.ok) return;
    const mapped: ApiProject[] = (res.proposals || []).map((proposal) => ({
      id: proposal.projectId,
      clientId: proposal.clientId,
      clientName: proposal.clientName,
      title: proposal.projectTitle,
      description: proposal.message,
      budget: proposal.value,
      category: 'Projeto contratado',
      skills: [],
      experienceLevel: 'intermediate',
      proposalDays: proposal.deliveryDays,
      visibility: 'public',
      status: proposal.projectStatus || 'Em andamento',
      proposals: 1,
      createdAt: proposal.createdAt,
      updatedAt: proposal.createdAt,
    }));
    setFreelancerProjects(mapped);
    setProjects([]);
  };

  useEffect(() => {
    loadProjects();
  }, [user?.id]);

  const sourceProjects = user?.type === 'freelancer' ? freelancerProjects : projects;

  const filteredProjects = useMemo(() => {
    return sourceProjects.filter((project) => {
      const matchesFilter = filter === 'Todos' || project.status === filter;
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sourceProjects, filter, searchTerm]);

  const getStatusColor = (status: string) => {
    if (status === 'Concluído') return 'bg-green-100 text-green-700';
    if (status === 'Em andamento') return 'bg-blue-100 text-blue-700';
    if (status === 'Cancelado') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const handleDelete = async (projectId: string) => {
    if (user?.type !== 'client') return;
    if (!user?.id) return;
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    const res = await apiDeleteProject(projectId, user.id);
    if (!res.ok) return;
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
            <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Meus Projetos</h1>
            <p className="text-gray-500">
              {user?.type === 'client' ? 'Gerencie todos os seus projetos' : 'Acompanhe seus projetos contratados'}
            </p>
          </div>
          {user?.type === 'client' && (
            <Link to="/project/new" className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Link>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex overflow-x-auto whitespace-nowrap space-x-2 pb-1">
              {(['Todos', 'Aberto', 'Em andamento', 'Concluído'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status ? 'bg-99blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar projetos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-500">Carregando projetos...</div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link to={`/project/${project.id}`} className="text-lg font-semibold text-gray-800 hover:text-99blue">
                        {project.title}
                      </Link>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>{project.status}</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">{project.category}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {project.budget || 'A combinar'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {project.proposalDays ? `${project.proposalDays} dias` : '-'}
                      </span>
                      <span className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {project.proposals} propostas
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex space-x-2">
                    <Link to={`/project/${project.id}`} className="flex items-center px-3 py-2 text-99blue hover:bg-sky-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Link>
                    {user?.type === 'client' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id)}
                        className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredProjects.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum projeto encontrado</h3>
            <p className="text-gray-500 mb-4">
              {user?.type === 'client'
                ? `Você ainda não tem projetos ${filter !== 'Todos' ? filter.toLowerCase() : ''}.`
                : 'Você ainda não tem projetos contratados.'}
            </p>
            {user?.type === 'client' ? (
              <Link to="/project/new" className="inline-flex items-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Publicar Primeiro Projeto
              </Link>
            ) : (
              <Link to="/projects" className="inline-flex items-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors">
                <Search className="w-4 h-4 mr-2" />
                Buscar Projetos
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
