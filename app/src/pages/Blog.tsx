import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Blog() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-8 h-8 text-99blue" />
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">Em breve: artigos e novidades do MeuFreelas.</p>
          <Link to="/ajuda" className="text-99blue hover:underline">← Voltar à Central de ajuda</Link>
        </div>
      </div>
    </div>
  );
}
