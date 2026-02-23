import { Link } from 'react-router-dom';
import { Type } from 'lucide-react';

export default function FormatoTextos() {
  const tags = [
    { open: '{b}', close: '{/b}', name: 'negrito', example: 'texto em negrito' },
    { open: '{i}', close: '{/i}', name: 'itálico', example: 'texto em itálico' },
    { open: '{u}', close: '{/u}', name: 'sublinhado', example: 'texto sublinhado' },
    { open: '{q}', close: '{/q}', name: 'bloco de citação', example: 'citação' },
    { open: '{pre}', close: '{/pre}', name: 'bloco de código (fonte mono-espaçada)', example: 'código em bloco' },
    { open: '{code}', close: '{/code}', name: 'fragmento de código (código em linha com fonte mono-espaçada)', example: 'código em linha' },
  ];

  const where = [
    'Publicar/Editar Projeto (descrição do projeto)',
    'Enviar/Melhorar Proposta (detalhes da proposta)',
    'Editar Perfil (campos "Sobre mim" e "Experiência profissional")',
    'Chat (mensagens de conversas)',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/ajuda" className="text-99blue hover:underline text-sm">← Central de ajuda</Link>
        </div>
        <div className="flex items-center gap-2 mb-6">
          <Type className="w-8 h-8 text-99blue" />
          <h1 className="text-2xl font-bold text-gray-900">Formatação de Textos</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <p className="text-gray-600">
            Você pode formatar textos usando as tags abaixo. Use a tag de abertura e a tag de fechamento
            para aplicar o efeito ao trecho desejado.
          </p>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags disponíveis</h2>
            <ul className="space-y-2">
              {tags.map((t) => (
                <li key={t.open} className="flex flex-wrap items-baseline gap-2 text-gray-700">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">{t.open}</code>
                  <span>e</span>
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">{t.close}</code>
                  <span>:</span>
                  <span>{t.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-gray-600">
            Textos contendo URLs serão devidamente formatados sem a necessidade de incluí-las dentro de blocos.
          </p>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Onde usar</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {where.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Exemplo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Entrada:</p>
                <code className="bg-gray-100 p-2 block rounded">Exemplo de {'{b}'}texto em negrito{'{/b}'}.</code>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Saída:</p>
                <p className="bg-gray-50 p-2 rounded">Exemplo de <strong>texto em negrito</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
