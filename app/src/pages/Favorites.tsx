import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Heart, Search, Star, MapPin, DollarSign, 
  Briefcase, Trash2, MessageSquare, Filter, X
} from 'lucide-react';

interface FavoriteFreelancer {
  id: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  location: string;
  skills: string[];
  isOnline: boolean;
}

export default function Favorites() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteFreelancer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Load favorites from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem(`favorites_${user?.id}`) || '[]');
    
    // Generate mock favorites if none exist
    if (savedFavorites.length === 0) {
      const mockFavorites: FavoriteFreelancer[] = [
        {
          id: '1',
          name: 'Maria Silva',
          title: 'Designer UI/UX Senior',
          avatar: 'https://ui-avatars.com/api/?name=Maria+Silva&background=random',
          rating: 4.9,
          reviews: 127,
          hourlyRate: 80,
          location: 'São Paulo, SP',
          skills: ['Figma', 'Adobe XD', 'UI Design'],
          isOnline: true
        },
        {
          id: '2',
          name: 'Pedro Santos',
          title: 'Desenvolvedor Full Stack',
          avatar: 'https://ui-avatars.com/api/?name=Pedro+Santos&background=random',
          rating: 4.8,
          reviews: 89,
          hourlyRate: 120,
          location: 'Rio de Janeiro, RJ',
          skills: ['React', 'Node.js', 'Python'],
          isOnline: false
        },
        {
          id: '3',
          name: 'Ana Costa',
          title: 'Redatora e Copywriter',
          avatar: 'https://ui-avatars.com/api/?name=Ana+Costa&background=random',
          rating: 5.0,
          reviews: 56,
          hourlyRate: 60,
          location: 'Curitiba, PR',
          skills: ['Copywriting', 'SEO', 'Marketing'],
          isOnline: true
        }
      ];
      setFavorites(mockFavorites);
    } else {
      // In a real app, you would fetch the freelancer details based on the saved IDs
      setFavorites([]);
    }
  }, [isAuthenticated, user, navigate]);

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    setFavorites(updated);
    localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(updated.map(f => f.id)));
  };

  const filteredFavorites = favorites.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Meus Favoritos</h1>
            <p className="text-gray-500">{favorites.length} freelancers salvos</p>
          </div>
          <Link 
            to="/freelancers"
            className="px-4 py-2 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
          >
            Buscar mais freelancers
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar nos favoritos..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-3 rounded-lg border transition-colors ${
                showFilters ? 'bg-99blue text-white border-99blue' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center space-x-4">
                <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-99blue">
                  <option>Ordenar por: Relevância</option>
                  <option>Melhor avaliação</option>
                  <option>Menor preço</option>
                  <option>Maior preço</option>
                </select>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Favorites List */}
        {filteredFavorites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum favorito ainda'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos' 
                : 'Adicione freelancers aos seus favoritos para encontrá-los facilmente'}
            </p>
            {!searchTerm && (
              <Link 
                to="/freelancers"
                className="px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
              >
                Explorar freelancers
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFavorites.map((freelancer) => (
              <div key={freelancer.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  {/* Avatar */}
                  <div className="relative">
                    <img 
                      src={freelancer.avatar} 
                      alt={freelancer.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    {freelancer.isOnline && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 ml-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link 
                          to={`/user/${freelancer.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-xl font-semibold text-gray-900 hover:text-99blue transition-colors"
                        >
                          {freelancer.name}
                        </Link>
                        <p className="text-gray-600">{freelancer.title}</p>
                        
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                            {freelancer.rating} ({freelancer.reviews})
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {freelancer.location}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            R$ {freelancer.hourlyRate}/hora
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {freelancer.skills.map((skill, index) => (
                            <span 
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          to="/messages"
                          className="p-2 text-gray-400 hover:text-99blue hover:bg-99blue/10 rounded-lg transition-colors"
                          title="Enviar mensagem"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </Link>
                        <Link
                          to="/project/new"
                          className="p-2 text-gray-400 hover:text-99blue hover:bg-99blue/10 rounded-lg transition-colors"
                          title="Convidar para projeto"
                        >
                          <Briefcase className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => removeFavorite(freelancer.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover dos favoritos"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
