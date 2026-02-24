import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSortedSkills } from '../constants/skills';
import { BR_STATES, getCitiesByUf } from '../constants/brLocations';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Globe, Linkedin, Github, Camera, Save, ArrowLeft,
  DollarSign, Clock, FileText, Award, CheckCircle, Plus, X, Trash2, ExternalLink, ChevronDown
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link?: string;
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const isFreelancer = user?.type === 'freelancer' || Boolean((user as { hasFreelancerAccount?: boolean })?.hasFreelancerAccount);
  
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'skills' | 'portfolio'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Personal info
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [city, setCity] = useState('');
  const [citiesOptions, setCitiesOptions] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  
  // Professional info
  const [title, setTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availability, setAvailability] = useState('full-time');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  
  // Skills
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const skillsDropdownRef = useRef<HTMLDivElement>(null);
  const allSkillsOptions = getSortedSkills();
  
  // Portfolio
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', image: '', link: '' });

  useEffect(() => {
    // Load user data from localStorage
    const savedProfile = localStorage.getItem(`profile_${user?.id}`);
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setPhone(profile.phone || '');
      const parsedLocation = (profile.location || '') as string;
      const parsedState = (profile.stateUf || '') as string;
      const parsedCity = (profile.city || '') as string;
      if (parsedState || parsedCity) {
        setStateUf(parsedState);
        setCity(parsedCity);
        setLocation(parsedCity && parsedState ? `${parsedCity}, ${parsedState}` : parsedLocation);
      } else if (parsedLocation.includes(',')) {
        const [locCity, locState] = parsedLocation.split(',').map((s: string) => s.trim());
        setCity(locCity || '');
        setStateUf((locState || '').toUpperCase());
        setLocation(parsedLocation);
      } else {
        setLocation(parsedLocation);
      }
      setBio(profile.bio || '');
      setTitle(profile.title || '');
      setExperience(profile.experience || '');
      setHourlyRate(profile.hourlyRate || '');
      setAvailability(profile.availability || 'full-time');
      setWebsite(profile.website || '');
      setLinkedin(profile.linkedin || '');
      setGithub(profile.github || '');
      setSkills(profile.skills || []);
      setPortfolioItems(profile.portfolioItems || []);
    }
  }, [user]);

  useEffect(() => {
    if (!isFreelancer && activeTab !== 'personal') setActiveTab('personal');
  }, [isFreelancer, activeTab]);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      if (!stateUf) {
        setCitiesOptions([]);
        setIsLoadingCities(false);
        return;
      }
      setIsLoadingCities(true);
      const cities = await getCitiesByUf(stateUf);
      if (mounted) {
        setCitiesOptions(cities);
        setIsLoadingCities(false);
      }
    };
    loadCities();
    return () => {
      mounted = false;
    };
  }, [stateUf]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioImageClick = () => {
    portfolioFileInputRef.current?.click();
  };

  const handlePortfolioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioForm({ ...portfolioForm, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = (skillName: string) => {
    const name = skillName.trim();
    if (name && !skills.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      setSkills([...skills, { id: Date.now().toString(), name }]);
      setSkillSearch('');
      setShowSkillsDropdown(false);
    }
  };

  const filteredSkillsForSelect = allSkillsOptions.filter(
    (s) =>
      s.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !skills.some((added) => added.name.toLowerCase() === s.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(e.target as Node)) {
        setShowSkillsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id));
  };

  const openAddPortfolioModal = () => {
    setEditingPortfolioItem(null);
    setPortfolioForm({ title: '', description: '', image: '', link: '' });
    setShowPortfolioModal(true);
  };

  const openEditPortfolioModal = (item: PortfolioItem) => {
    setEditingPortfolioItem(item);
    setPortfolioForm({ title: item.title, description: item.description, image: item.image, link: item.link || '' });
    setShowPortfolioModal(true);
  };

  const handleSavePortfolio = () => {
    if (!portfolioForm.title.trim()) return;
    
    if (editingPortfolioItem) {
      // Edit existing
      setPortfolioItems(items => items.map(item => 
        item.id === editingPortfolioItem.id 
          ? { ...item, ...portfolioForm }
          : item
      ));
    } else {
      // Add new
      const newItem: PortfolioItem = {
        id: Date.now().toString(),
        ...portfolioForm
      };
      setPortfolioItems([...portfolioItems, newItem]);
    }
    setShowPortfolioModal(false);
    setPortfolioForm({ title: '', description: '', image: '', link: '' });
    setEditingPortfolioItem(null);
  };

  const handleRemovePortfolio = (id: string) => {
    if (confirm('Tem certeza que deseja remover este projeto?')) {
      setPortfolioItems(items => items.filter(item => item.id !== id));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Save profile data
    const profileData = {
      phone,
      location: city && stateUf ? `${city}, ${stateUf}` : location,
      city,
      stateUf,
      bio,
      title,
      experience,
      hourlyRate,
      availability,
      website,
      linkedin,
      github,
      skills,
      portfolioItems
    };
    
    localStorage.setItem(`profile_${user?.id}`, JSON.stringify(profileData));
    
    // Update user avatar and name if changed
    if (avatar !== user?.avatar || name !== user?.name) {
      updateUser({ avatar, name });
    }

    window.dispatchEvent(new CustomEvent('meufreelas:profile-updated', { detail: { userId: user?.id } }));
    
    setIsLoading(false);
    setSuccessMessage('Perfil atualizado com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const completionChecksClient = [Boolean(avatar), Boolean(name.trim()), Boolean(phone.trim()), Boolean(stateUf), Boolean(city), Boolean(bio.trim())];
  const completionChecksFreelancer = [
    Boolean(avatar),
    Boolean(name.trim()),
    Boolean(phone.trim()),
    Boolean(stateUf),
    Boolean(city),
    Boolean(bio.trim()),
    skills.length > 0,
    Boolean(title.trim()),
  ];
  const completionChecks = isFreelancer ? completionChecksFreelancer : completionChecksClient;
  const completionPercent = Math.round((completionChecks.filter(Boolean).length / completionChecks.length) * 100);

  const renderPersonalTab = () => (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div 
          onClick={handleAvatarClick}
          className="relative w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
        >
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div>
          <h3 className="font-medium text-gray-900">Foto de perfil</h3>
          <p className="text-sm text-gray-500">Clique na imagem para alterar</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={stateUf}
              onChange={(e) => {
                const nextUf = e.target.value;
                setStateUf(nextUf);
                setCity('');
                setLocation('');
              }}
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
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={city}
            onChange={(e) => {
              const nextCity = e.target.value;
              setCity(nextCity);
              setLocation(nextCity && stateUf ? `${nextCity}, ${stateUf}` : '');
            }}
            disabled={!stateUf || isLoadingCities}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value="">
              {!stateUf ? 'Selecione primeiro o estado' : isLoadingCities ? 'Carregando cidades...' : 'Selecione a cidade'}
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
          Sobre mim
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Conte um pouco sobre você..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderProfessionalTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título profissional
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desenvolvedor Full Stack"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anos de experiência
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            >
              <option value="">Selecione</option>
              <option value="0-1">Menos de 1 ano</option>
              <option value="1-3">1 a 3 anos</option>
              <option value="3-5">3 a 5 anos</option>
              <option value="5-10">5 a 10 anos</option>
              <option value="10+">Mais de 10 anos</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor hora (R$)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="Ex: 100"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Disponibilidade
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            >
              <option value="full-time">Tempo integral</option>
              <option value="part-time">Meio período</option>
              <option value="freelance">Freelance</option>
              <option value="weekends">Fins de semana</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-medium text-gray-900 mb-4">Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://seusite.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/seuperfil"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub
            </label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/seuperfil"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkillsTab = () => (
    <div className="space-y-6">
      <div ref={skillsDropdownRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adicionar habilidade
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
            placeholder="Buscar ou selecione uma habilidade (ex: React, Photoshop, SEO...)"
            className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {showSkillsDropdown && (
          <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            {filteredSkillsForSelect.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                {skillSearch.trim() ? 'Nenhuma habilidade encontrada ou já adicionada.' : 'Digite para buscar.'}
              </div>
            ) : (
              <ul className="py-1">
                {filteredSkillsForSelect.slice(0, 80).map((skill) => (
                  <li key={skill}>
                    <button
                      type="button"
                      onClick={() => handleAddSkill(skill)}
                      className="w-full text-left px-4 py-2.5 text-gray-800 hover:bg-99blue/10 hover:text-99blue transition-colors"
                    >
                      {skill}
                    </button>
                  </li>
                ))}
                {filteredSkillsForSelect.length > 80 && (
                  <li className="px-4 py-2 text-gray-500 text-sm">
                    + {filteredSkillsForSelect.length - 80} outras. Continue digitando para filtrar.
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
        <p className="mt-1.5 text-sm text-gray-500">
          Todas as opções disponíveis (Web, Design, Marketing, Escrita, etc.). Busque e clique para adicionar.
        </p>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-4">Minhas habilidades</h3>
        {skills.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma habilidade adicionada ainda</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center px-4 py-2 bg-99blue/10 text-99blue rounded-full"
              >
                {skill.name}
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="ml-2 text-99blue hover:text-99blue-dark"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPortfolioTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="font-medium text-gray-900">Meus projetos</h3>
        <button
          onClick={openAddPortfolioModal}
          className="flex items-center px-4 py-2 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Projeto
        </button>
      </div>

      {portfolioItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">Nenhum projeto no portfólio</h3>
          <p className="text-gray-500 mb-4">Adicione seus melhores trabalhos para mostrar aos clientes</p>
          <button
            onClick={openAddPortfolioModal}
            className="px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
          >
            Adicionar Primeiro Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <div key={item.id} className="bg-white border rounded-lg overflow-hidden group">
              <div className="aspect-video bg-gray-200 relative">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <FileText className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={() => openEditPortfolioModal(item)}
                    className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleRemovePortfolio(item.id)}
                    className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-medium text-gray-900">{item.title}</h4>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                )}
                {item.link && (
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-99blue hover:underline mt-2"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ver projeto
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-99dark text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-base sm:text-xl font-semibold text-center">Editar Perfil</h1>
          <div className="w-10 sm:w-20" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        {/* Profile Completion */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900">Progresso do perfil</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${
              completionPercent >= 90 ? 'bg-green-100 text-green-700' : completionPercent >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>
              {completionPercent}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-99blue rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="text-xs text-gray-500">Preencha os passos para concluir o perfil e ganhar mais destaque.</p>
        </div>

        {/* Tabs: cliente só vê Pessoal; freelancer vê Pessoal, Profissional, Habilidades, Portfólio */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b overflow-x-auto">
            <nav className="flex min-w-max">
              {[
                { id: 'personal', label: isFreelancer ? '1. Pessoal' : 'Dados pessoais', icon: User },
                ...(isFreelancer
                  ? [
                      { id: 'professional', label: '2. Profissional', icon: Briefcase },
                      { id: 'skills', label: '3. Habilidades', icon: Award },
                      { id: 'portfolio', label: '4. Portfólio', icon: FileText },
                    ]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center whitespace-nowrap px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-99blue text-99blue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-1.5 sm:mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'personal' && renderPersonalTab()}
            {activeTab === 'professional' && renderProfessionalTab()}
            {activeTab === 'skills' && renderSkillsTab()}
            {activeTab === 'portfolio' && isFreelancer && renderPortfolioTab()}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto justify-center flex items-center px-8 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      {/* Portfolio Modal - apenas para freelancer */}
      {showPortfolioModal && isFreelancer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingPortfolioItem ? 'Editar Projeto' : 'Adicionar Projeto'}
              </h3>
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do projeto</label>
                <div
                  onClick={handlePortfolioImageClick}
                  className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-99blue transition-colors"
                >
                  {portfolioForm.image ? (
                    <img src={portfolioForm.image} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Clique para adicionar imagem</p>
                      <p className="text-sm text-gray-400">JPG, PNG ou GIF</p>
                    </>
                  )}
                </div>
                <input
                  ref={portfolioFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePortfolioFileChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  placeholder="Nome do projeto"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                  placeholder="Descreva o projeto..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link do projeto</label>
                <input
                  type="url"
                  value={portfolioForm.link}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePortfolio}
                disabled={!portfolioForm.title.trim()}
                className="flex-1 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors disabled:opacity-50"
              >
                {editingPortfolioItem ? 'Salvar alterações' : 'Adicionar projeto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
