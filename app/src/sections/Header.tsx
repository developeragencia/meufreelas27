import { useState, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
      {/* Main Header */}
      <div className="bg-99dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <img src="/logo-original.png" alt="MeuFreelas" className="h-8 w-auto mix-blend-lighten" />
              </a>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
              <div className="relative flex w-full">
                <div 
                  className="relative"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <button className="flex items-center px-4 py-2 bg-99blue text-white text-sm font-medium rounded-l hover:bg-sky-400 transition-colors">
                    Freelancers
                    <ChevronDown className="ml-2 w-4 h-4" />
                  </button>
                  {showDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded shadow-lg py-2 animate-fade-in">
                      <a href="/freelancers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Freelancers</a>
                      <a href="/projects" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Projetos</a>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Buscar freelancers"
                  className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border-0 focus:outline-none focus:ring-0"
                />
                <button className="px-4 py-2 bg-white border-l border-gray-200 rounded-r hover:bg-gray-50 transition-colors">
                  <Search className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Right Navigation - Desktop Only */}
            <div className="hidden md:flex items-center space-x-4">
              <a href="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Login
              </a>
              <a href="/register" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Cadastre-se
              </a>
              <a
                href="/project/new"
                className="px-5 py-2 bg-99blue text-white text-sm font-semibold rounded hover:bg-sky-400 transition-colors"
              >
                Publicar projeto
              </a>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center">
              <button className="text-white p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Header - Desktop Only */}
      <div className="hidden md:block bg-99dark/95 border-t border-gray-600/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-end space-x-8 h-10">
            <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
              Como Funciona
            </a>
            <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
              Encontrar Freelancers
            </a>
            <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
              Encontrar Trabalho
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
