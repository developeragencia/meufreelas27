import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Users,
  Eye,
  Edit,
  Trash2,
  Search
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  category: string;
  budget: string;
  proposals: number;
  interested: number;
  status: 'Aberto' | 'Em andamento' | 'Concluído' | 'Cancelado';
  createdAt: string;
  deadline: string;
}

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'Todos' | 'Aberto' | 'Em andamento' | 'Concluído'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Demo projects
    const demoProjects: Project[] = [
      {
        id: '1',
        title: 'Desenvolvimento de E-commerce Completo',
        category: 'Desenvolvimento Web',
        budget: 'R$ 5.000 - R$ 10.000',
        proposals: 8,
        interested: 15,
        status: 'Aberto',
        createdAt: '2026-02-15',
        deadline: '15 dias',
      },
      {
        id: '2',
        title: 'Design de Identidade Visual',
        category: 'Design Gráfico',
        budget: 'R$ 1.500 - R$ 3.000',
        proposals: 12,
        interested: 20,
        status: 'Em andamento',
        createdAt: '2026-02-10',
        deadline: '7 dias',
      },
      {
        id: '3',
        title: 'Redação de Artigos SEO',
        category: 'Redação',
        budget: 'R$ 800 - R$ 1.500',
        proposals: 6,
        interested: 10,
        status: 'Concluído',
        createdAt: '2026-01-20',
        deadline: '-',
      },
      {
        id: '4',
        title: 'Desenvolvimento de App Mobile',
        category: 'Desenvolvimento Mobile',
        budget: 'R$ 8.000 - R$ 15.000',
        proposals: 5,
        interested: 12,
        status: 'Aberto',
        createdAt: '2026-02-18',
        deadline: '30 dias',
      },
    ];
    setProjects(demoProjects);
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'Todos' || project.status === filter;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-100 text-green-700';
      case 'Em andamento':
        return 'bg-blue-100 text-blue-700';
      case 'Cancelado':
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
            <Link to="/dashboard" className="text-gray-300 hover:text-white">
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Meus Projetos</h1>
            <p className="text-gray-500">Gerencie todos os seus projetos</p>
          </div>
          <Link
            to="/project/new"
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex space-x-2">
              {(['Todos', 'Aberto', 'Em andamento', 'Concluído'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-99blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link 
                      to={`/project/${project.id}`}
                      className="text-lg font-semibold text-gray-800 hover:text-99blue"
                    >
                      {project.title}
                    </Link>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-3">{project.category}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {project.budget}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {project.deadline}
                    </span>
                    <span className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {project.proposals} propostas
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {project.interested} interessados
                    </span>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex space-x-2">
                  <Link
                    to={`/project/${project.id}`}
                    className="flex items-center px-3 py-2 text-99blue hover:bg-sky-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Link>
                  <button className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Você ainda não tem projetos {filter !== 'Todos' && filter.toLowerCase()}.
            </p>
            <Link
              to="/project/new"
              className="inline-flex items-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Publicar Primeiro Projeto
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
