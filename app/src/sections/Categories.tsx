import { Monitor, FileText, Code, Search, Palette, Video, ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  hoverColor: string;
}

function CategoryCard({ title, subtitle, icon, bgColor, hoverColor }: CategoryCardProps) {
  return (
    <a
      href="#"
      className={`group relative block overflow-hidden rounded-lg ${bgColor} transition-all duration-300 hover:shadow-card-hover transform hover:-translate-y-1`}
      style={{ minHeight: '160px' }}
    >
      <div className={`absolute inset-0 ${hoverColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        <div className="text-white/80">
          {icon}
        </div>
        <div>
          <p className="text-white/90 text-sm">{title}</p>
          <p className="text-white text-xl font-semibold">{subtitle}</p>
        </div>
      </div>
    </a>
  );
}

export default function Categories() {
  const categories = [
    {
      title: 'Desenhar o seu',
      subtitle: 'website',
      icon: <Monitor className="w-8 h-8" />,
      bgColor: 'bg-sky-400',
      hoverColor: 'bg-sky-500',
    },
    {
      title: 'Escrever o seu',
      subtitle: 'conteúdo',
      icon: <FileText className="w-8 h-8" />,
      bgColor: 'bg-pink-400',
      hoverColor: 'bg-pink-500',
    },
    {
      title: 'Desenvolver o seu',
      subtitle: 'código',
      icon: <Code className="w-8 h-8" />,
      bgColor: 'bg-red-400',
      hoverColor: 'bg-red-500',
    },
    {
      title: 'Melhorar o seu',
      subtitle: 'SEO',
      icon: <Search className="w-8 h-8" />,
      bgColor: 'bg-orange-400',
      hoverColor: 'bg-orange-500',
    },
    {
      title: 'Desenhar o seu',
      subtitle: 'logotipo',
      icon: <Palette className="w-8 h-8" />,
      bgColor: 'bg-green-400',
      hoverColor: 'bg-green-500',
    },
    {
      title: 'Criar o seu',
      subtitle: 'vídeo',
      icon: <Video className="w-8 h-8" />,
      bgColor: 'bg-purple-400',
      hoverColor: 'bg-purple-500',
    },
  ];

  return (
    <section className="bg-99gray py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-light text-center text-gray-800 mb-12">
          Encontre freelancers talentosos para...
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((category, index) => (
            <CategoryCard key={index} {...category} />
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="#"
            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
          >
            Ver todas categorias
            <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
