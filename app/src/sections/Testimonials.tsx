import { useState } from 'react';
import { Quote } from 'lucide-react';

interface TestimonialProps {
  quote: string;
  author: string;
}

function Testimonial({ quote, author }: TestimonialProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-card h-full">
      <Quote className="w-6 h-6 text-99blue mb-4" />
      <p className="text-gray-600 text-sm leading-relaxed mb-4">" {quote} "</p>
      <p className="text-gray-800 font-medium text-sm">- {author}</p>
    </div>
  );
}

export default function Testimonials() {
  const [currentPage, setCurrentPage] = useState(0);

  const testimonials = [
    {
      quote: 'Muito bom site para quem busca profissionais de diversos segmentos e especialização. Depois que você faz um projeto com esse site, você se pergunta: como eu trabalhava sem esse site? Valeu muito a pena!',
      author: 'Rafael Leite',
    },
    {
      quote: 'Dentre as plataformas de freelas, o MeuFreelas foi o que tem a maior base de respostas entre propostas de freelas. O nível da base de dados de profissionais disponíveis é muito acima do esperado. Sobre a plataforma, é necessário apenas alguns ajustes de respostas nas informações. Mas a plataforma é limpa e objetiva. Parabéns ao MeuFreelas.',
      author: 'Lincoln Tamashiro',
    },
    {
      quote: 'O MeuFreelas foi um achado. Já conhecia o site há certo tempo mas não acreditava em sua eficiência. Como tenho muitas demandas passei a ser um usuário permanente. Todas as propostas foram bem elaboradas, os profissionais mostram ser plenamente competentes.',
      author: 'Jorge Medeiros',
    },
    {
      quote: 'Pela primeira vez que utilizei o site, tive uma excelente experiência e com certeza recomendo o MeuFreelas pela rapidez no suporte ao usuário, segurança no processo o qual é feito dentro do site e plataforma incrível de trabalho. Site hiper recomendado.',
      author: 'Vanessa Custodio',
    },
  ];

  const itemsPerPage = 2;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  return (
    <section className="bg-99gray py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-light text-center text-gray-800 mb-12">
          O que nossos clientes estão dizendo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {testimonials
            .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
            .map((testimonial, index) => (
              <Testimonial key={index} {...testimonial} />
            ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${
                currentPage === index
                  ? 'bg-99blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
