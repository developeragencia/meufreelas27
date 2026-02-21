import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, X, Check, Briefcase, DollarSign, 
  Globe, Lock, Info, ChevronDown, Paperclip
} from 'lucide-react';

const categories = [
  'Administração & Contabilidade',
  'Advogados & Leis',
  'Atendimento ao Consumidor',
  'Design & Criação',
  'Educação & Consultoria',
  'Engenharia & Arquitetura',
  'Escrita',
  'Fotografia & Audiovisual',
  'Suporte Administrativo',
  'Tradução',
  'Vendas & Marketing',
  'Web, Mobile & Software',
  'Outra Categoria'
];

const skills = [
  '.NET Compact Framework', '.NET Framework', '.NET para Web', '.NET Remoting',
  '1ShoppingCart', '3DS Max', 'A/B Testing', 'Adobe After Effects',
  'Adobe Illustrator', 'Adobe Photoshop', 'Adobe Premiere', 'Angular',
  'API REST', 'AWS', 'Azure', 'Bootstrap', 'C#', 'C++', 'CSS3',
  'Django', 'Docker', 'Figma', 'Flutter', 'Git', 'HTML5', 'Java',
  'JavaScript', 'jQuery', 'Kotlin', 'Kubernetes', 'Laravel', 'MongoDB',
  'MySQL', 'Node.js', 'PHP', 'PostgreSQL', 'Python', 'React', 'React Native',
  'Redis', 'Ruby on Rails', 'Rust', 'SASS', 'Scala', 'Spring Boot',
  'SQL Server', 'Swift', 'TypeScript', 'Vue.js', 'WordPress', 'Xamarin'
];

const experienceLevels = [
  {
    id: 'beginner',
    label: 'Iniciante',
    description: 'Estou à procura de freelancers com os menores valores.'
  },
  {
    id: 'intermediate',
    label: 'Intermediário',
    description: 'Estou à procura de uma combinação de experiência e valor.'
  },
  {
    id: 'expert',
    label: 'Especialista',
    description: 'Estou disposto a pagar valores mais elevados para freelancers experientes.'
  }
];

const proposalDays = [
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' }
];

export default function NewProject() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    selectedSkills: [] as string[],
    experienceLevel: 'intermediate',
    proposalDays: '30',
    visibility: 'public',
    budget: ''
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (user?.type !== 'client') {
    navigate('/freelancer/dashboard');
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addSkill = (skill: string) => {
    if (formData.selectedSkills.length < 5 && !formData.selectedSkills.includes(skill)) {
      setFormData({
        ...formData,
        selectedSkills: [...formData.selectedSkills, skill]
      });
    }
    setSkillSearch('');
    setShowSkillsDropdown(false);
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      selectedSkills: formData.selectedSkills.filter(s => s !== skill)
    });
  };

  const filteredSkills = skills.filter(skill => 
    skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !formData.selectedSkills.includes(skill)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.title || !formData.description) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Save project to localStorage
    const projects = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]');
    const newProject = {
      id: Date.now().toString(),
      clientId: user?.id,
      ...formData,
      files: files.map(f => f.name),
      status: 'Aberto',
      proposals: 0,
      createdAt: new Date().toISOString()
    };
    projects.push(newProject);
    localStorage.setItem('meufreelas_projects', JSON.stringify(projects));

    // Update goals
    const goals = JSON.parse(localStorage.getItem(`goals_${user?.id}`) || '[]');
    const publishGoal = goals.find((g: any) => g.id === 'publish_project');
    if (publishGoal && !publishGoal.completed) {
      publishGoal.completed = true;
      publishGoal.completedAt = new Date().toISOString();
      localStorage.setItem(`goals_${user?.id}`, JSON.stringify(goals));
    }

    setIsSubmitting(false);
    setSuccessMessage('Projeto publicado com sucesso!');
    
    setTimeout(() => {
      navigate('/my-projects');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-99blue text-white">
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
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-white/80 hover:text-white">Página inicial</Link>
              <Link to="/projects" className="text-white/80 hover:text-white">Projetos</Link>
              <Link to="/freelancers" className="text-white/80 hover:text-white">Freelancers</Link>
              <Link to="/dashboard" className="text-white/80 hover:text-white">Dashboard</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Publique um projeto</h1>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <Check className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Escolha uma categoria
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent appearance-none bg-white"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Title */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Dê um nome para o trabalho
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Redator para blog de tecnologia"
              maxLength={75}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
            <p className="text-right text-sm text-gray-500 mt-1">{formData.title.length}/75</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Descreva o trabalho a ser feito
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva detalhadamente o que você precisa..."
              rows={6}
              maxLength={5000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent resize-none"
            />
            <p className="text-right text-sm text-gray-500 mt-1">{formData.description.length}/5000</p>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Orçamento (R$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="Ex: 5000"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              <Info className="w-4 h-4 inline mr-1" />
              Deixe em branco para receber propostas com diferentes valores
            </p>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Anexe um arquivo <span className="text-gray-500 font-normal">(Opcional)</span>
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-99blue transition-colors"
            >
              <div className="flex items-center justify-center">
                <span className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium mr-3">
                  Adicionar arquivos
                </span>
                <span className="text-gray-500">Ou se preferir arraste seus arquivos aqui.</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Paperclip className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Quais habilidades são desejadas? <span className="text-gray-500 font-normal">(Opcional)</span>
            </label>
            
            <div className="relative">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value);
                  setShowSkillsDropdown(true);
                }}
                onFocus={() => setShowSkillsDropdown(true)}
                placeholder="Digite para buscar habilidades..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
              
              {showSkillsDropdown && skillSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              Selecionadas (max 5): {formData.selectedSkills.length}/5
            </p>
            
            {formData.selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.selectedSkills.map((skill) => (
                  <span 
                    key={skill}
                    className="inline-flex items-center px-3 py-1 bg-99blue/10 text-99blue rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-99blue-dark"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experience Level */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Nível de experiência desejado
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {experienceLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, experienceLevel: level.id })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.experienceLevel === level.id
                      ? 'border-99blue bg-99blue/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-medium mb-2 ${
                    formData.experienceLevel === level.id ? 'text-99blue' : 'text-gray-700'
                  }`}>
                    {level.label}
                  </p>
                  <p className="text-sm text-gray-500">{level.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Proposal Days */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Durante quantos dias você quer receber propostas?
            </label>
            <div className="relative w-48">
              <select
                value={formData.proposalDays}
                onChange={(e) => setFormData({ ...formData, proposalDays: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent appearance-none bg-white"
              >
                {proposalDays.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Visibilidade do projeto
            </label>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="mt-1 w-4 h-4 text-99blue border-gray-300 focus:ring-99blue"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">Público</span>
                  </div>
                  <p className="text-sm text-gray-500">Visível para todos os profissionais.</p>
                </div>
              </label>
              
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="mt-1 w-4 h-4 text-99blue border-gray-300 focus:ring-99blue"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">Privado</span>
                  </div>
                  <p className="text-sm text-gray-500">Apenas os freelancers que forem convidados poderão se candidatar.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Publicando...
                </>
              ) : (
                <>
                  <Briefcase className="w-5 h-5 mr-2" />
                  Publicar projeto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
