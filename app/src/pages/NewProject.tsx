import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Briefcase, Check, ChevronDown, Globe, Lock, Paperclip, X } from 'lucide-react';
import { getSortedSkills } from '../constants/skills';
import { apiCreateProject, hasApi } from '../lib/api';

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
  'Outra Categoria',
];

const experienceLevels = [
  { id: 'beginner', label: 'Iniciante', description: 'Estou à procura de freelancers com os menores valores.' },
  { id: 'intermediate', label: 'Intermediário', description: 'Estou à procura de uma combinação de experiência e valor.' },
  { id: 'expert', label: 'Especialista', description: 'Estou disposto a pagar valores mais elevados para freelancers experientes.' },
];

const proposalDays = [
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
];

function safeParseProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem('meufreelas_projects') || '[]') as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function NewProject() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skillsDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    selectedSkills: [] as string[],
    experienceLevel: 'intermediate',
    proposalDays: '30',
    visibility: 'public' as 'public' | 'private',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const allSkills = getSortedSkills();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(event.target as Node)) {
        setShowSkillsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.type !== 'client' && !user?.hasClientAccount) return <Navigate to="/freelancer/dashboard" replace />;

  const filteredSkills = allSkills.filter(
    (skill) => skill.toLowerCase().includes(skillSearch.toLowerCase()) && !formData.selectedSkills.includes(skill)
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const total = [...files, ...selected].slice(0, 5);
    setFiles(total);
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const addSkill = (skill: string) => {
    if (formData.selectedSkills.length >= 5 || formData.selectedSkills.includes(skill)) return;
    setFormData((prev) => ({ ...prev, selectedSkills: [...prev.selectedSkills, skill] }));
    setSkillSearch('');
    setShowSkillsDropdown(false);
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({ ...prev, selectedSkills: prev.selectedSkills.filter((s) => s !== skill) }));
  };

  const validateForm = (): string | null => {
    if (!formData.category) return 'Selecione uma categoria.';
    if (!formData.title.trim() || formData.title.trim().length < 10) return 'O título deve ter pelo menos 10 caracteres.';
    if (!formData.description.trim() || formData.description.trim().length < 30) return 'A descrição deve ter pelo menos 30 caracteres.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      userId: user!.id,
      category: formData.category,
      title: formData.title.trim(),
      description: formData.description.trim(),
      skills: formData.selectedSkills,
      experienceLevel: formData.experienceLevel,
      proposalDays: formData.proposalDays,
      visibility: formData.visibility,
    };

    let createdProject: Record<string, unknown> | null = null;
    if (hasApi()) {
      const res = await apiCreateProject(payload);
      if (!res.ok) {
        setIsSubmitting(false);
        setErrorMessage(res.error || 'Não foi possível publicar o projeto.');
        return;
      }
      createdProject = res.project || null;
    }

    const cachedProjects = safeParseProjects();
    const fallbackProject = {
      id: Date.now().toString(),
      clientId: user!.id,
      ...payload,
      files: files.map((f) => f.name),
      status: 'Aberto',
      proposals: 0,
      createdAt: new Date().toISOString(),
    };
    cachedProjects.push(createdProject || fallbackProject);
    localStorage.setItem('meufreelas_projects', JSON.stringify(cachedProjects));

    setSuccessMessage('Projeto publicado com sucesso!');
    setIsSubmitting(false);
    setTimeout(() => navigate('/my-projects'), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link to="/" className="text-2xl font-bold">
                meu<span className="font-light">freelas</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-white/80 hover:text-white">
                Página inicial
              </Link>
              <Link to="/projects" className="text-white/80 hover:text-white">
                Projetos
              </Link>
              <Link to="/freelancers" className="text-white/80 hover:text-white">
                Freelancers
              </Link>
              <Link to="/dashboard" className="text-white/80 hover:text-white">
                Dashboard
              </Link>
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
        {errorMessage && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">Escolha uma categoria</label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent appearance-none bg-white"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">Dê um nome para o trabalho</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Redator para blog de tecnologia"
              maxLength={75}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
            <p className="text-right text-sm text-gray-500 mt-1">{formData.title.length}/75</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">Descreva o trabalho a ser feito</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva detalhadamente o que você precisa..."
              rows={6}
              maxLength={5000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent resize-none"
            />
            <p className="text-right text-sm text-gray-500 mt-1">{formData.description.length}/5000</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">
              Anexe um arquivo <span className="text-gray-500 font-normal">(Opcional)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-99blue transition-colors"
            >
              <div className="flex items-center justify-center">
                <span className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium mr-3">Adicionar arquivos</span>
                <span className="text-gray-500">Ou se preferir arraste seus arquivos aqui.</span>
              </div>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Máximo de 5 arquivos por projeto.</p>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Paperclip className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="p-1 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6" ref={skillsDropdownRef}>
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
              {showSkillsDropdown && skillSearch.trim() && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredSkills.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Nenhuma habilidade encontrada.</div>
                  ) : (
                    filteredSkills.slice(0, 80).map((skill) => (
                      <button key={skill} type="button" onClick={() => addSkill(skill)} className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">
                        {skill}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">Selecionadas (max 5): {formData.selectedSkills.length}/5</p>
            {formData.selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.selectedSkills.map((skill) => (
                  <span key={skill} className="inline-flex items-center px-3 py-1 bg-99blue/10 text-99blue rounded-full text-sm">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="ml-2 hover:text-99blue-dark">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">Nível de experiência desejado</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {experienceLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, experienceLevel: level.id }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.experienceLevel === level.id ? 'border-99blue bg-99blue/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-medium mb-2 ${formData.experienceLevel === level.id ? 'text-99blue' : 'text-gray-700'}`}>{level.label}</p>
                  <p className="text-sm text-gray-500">{level.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">Durante quantos dias você quer receber propostas?</label>
            <div className="relative w-full sm:w-48">
              <select
                value={formData.proposalDays}
                onChange={(e) => setFormData((prev) => ({ ...prev, proposalDays: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent appearance-none bg-white"
              >
                {proposalDays.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-lg font-medium text-gray-900 mb-3">Visibilidade do projeto</label>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                  className="mt-1 w-4 h-4 text-99blue border-gray-300 focus:ring-99blue"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">Privado</span>
                  </div>
                  <p className="text-sm text-gray-500">Apenas os freelancers convidados poderão se candidatar.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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
