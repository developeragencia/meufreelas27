import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, TrendingUp, DollarSign, Briefcase, Star,
  ChevronDown, Download
} from 'lucide-react';

interface MonthlyData {
  month: string;
  earnings: number;
  projects: number;
  proposals: number;
}

interface SkillStat {
  name: string;
  projects: number;
  earnings: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'projects'>('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Mock data
  const monthlyData: MonthlyData[] = [
    { month: 'Jan', earnings: 4500, projects: 5, proposals: 12 },
    { month: 'Fev', earnings: 6200, projects: 7, proposals: 18 },
    { month: 'Mar', earnings: 5800, projects: 6, proposals: 15 },
    { month: 'Abr', earnings: 7500, projects: 8, proposals: 22 },
    { month: 'Mai', earnings: 8200, projects: 9, proposals: 25 },
    { month: 'Jun', earnings: 9100, projects: 10, proposals: 28 },
  ];

  const skillStats: SkillStat[] = [
    { name: 'React', projects: 15, earnings: 18500 },
    { name: 'Node.js', projects: 12, earnings: 15200 },
    { name: 'TypeScript', projects: 18, earnings: 22100 },
    { name: 'Python', projects: 8, earnings: 9800 },
    { name: 'UI/UX Design', projects: 6, earnings: 7200 },
  ];

  const totalEarnings = monthlyData.reduce((sum, d) => sum + d.earnings, 0);
  const totalProjects = monthlyData.reduce((sum, d) => sum + d.projects, 0);
  const totalProposals = monthlyData.reduce((sum, d) => sum + d.proposals, 0);
  const avgProjectValue = totalEarnings / totalProjects;

  const maxEarnings = Math.max(...monthlyData.map(d => d.earnings));

  return (
    <div className="min-h-screen bg-gray-100">
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
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Análise e Estatísticas</h1>
            <p className="text-gray-500">Acompanhe seu desempenho e crescimento</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="appearance-none px-4 py-2 pr-10 bg-white rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-99blue"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 3 meses</option>
                <option value="1y">Último ano</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex">
              {[
                { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
                { id: 'earnings', label: 'Ganhos', icon: DollarSign },
                { id: 'projects', label: 'Projetos', icon: Briefcase },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-99blue text-99blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">+23%</span>
            </div>
            <p className="text-gray-500 text-sm">Total em Ganhos</p>
            <p className="text-2xl font-bold text-gray-900">R$ {totalEarnings.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">+15%</span>
            </div>
            <p className="text-gray-500 text-sm">Projetos Concluídos</p>
            <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-green-600 text-sm font-medium">+8%</span>
            </div>
            <p className="text-gray-500 text-sm">Propostas Enviadas</p>
            <p className="text-2xl font-bold text-gray-900">{totalProposals}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Estável</span>
            </div>
            <p className="text-gray-500 text-sm">Avaliação Média</p>
            <p className="text-2xl font-bold text-gray-900">4.9</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ganhos por Mês</h3>
            <div className="space-y-4">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex items-center">
                  <span className="w-12 text-sm text-gray-500">{data.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-99blue rounded-full transition-all duration-500"
                        style={{ width: `${(data.earnings / maxEarnings) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-gray-900">
                    R$ {data.earnings.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Desempenho por Habilidade</h3>
            <div className="space-y-4">
              {skillStats.map((skill) => (
                <div key={skill.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{skill.name}</p>
                    <p className="text-sm text-gray-500">{skill.projects} projetos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-99blue">R$ {skill.earnings.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      Média: R$ {Math.round(skill.earnings / skill.projects).toLocaleString()}/projeto
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Conversão</h3>
            <div className="flex items-center justify-center py-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#003366"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(totalProjects / totalProposals) * 351.86} 351.86`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {Math.round((totalProjects / totalProposals) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm">
              {totalProjects} projetos de {totalProposals} propostas
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Valor Médio por Projeto</h3>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-99blue">
                R$ {Math.round(avgProjectValue).toLocaleString()}
              </p>
              <p className="text-gray-500 mt-2">Baseado nos últimos 6 meses</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clientes Recorrentes</h3>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-green-600">68%</p>
              <p className="text-gray-500 mt-2">Dos clientes voltam a contratar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
