import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, ArrowLeft, TrendingUp, Clock, DollarSign,
  Percent, Briefcase, FileText
} from 'lucide-react';

interface CalculatorResult {
  grossValue: number;
  platformFee: number;
  taxValue: number;
  netValue: number;
  hourlyRate: number;
}

export default function Tools() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'calculator' | 'text'>('calculator');
  
  // Calculator state
  const [projectValue, setProjectValue] = useState('');
  const [projectHours, setProjectHours] = useState('');
  const [taxRate, setTaxRate] = useState('6');
  const [result, setResult] = useState<CalculatorResult | null>(null);

  // Text formatter state
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [formatType, setFormatType] = useState<'upper' | 'lower' | 'title' | 'slug'>('upper');

  const handleCalculate = () => {
    const value = parseFloat(projectValue);
    const hours = parseFloat(projectHours);
    const tax = parseFloat(taxRate);

    if (value && hours) {
      const platformFee = value * 0.1; // 10% platform fee
      const taxValue = (value - platformFee) * (tax / 100);
      const netValue = value - platformFee - taxValue;
      const hourlyRate = netValue / hours;

      setResult({
        grossValue: value,
        platformFee,
        taxValue,
        netValue,
        hourlyRate
      });
    }
  };

  const handleFormatText = () => {
    let formatted = inputText;
    switch (formatType) {
      case 'upper':
        formatted = inputText.toUpperCase();
        break;
      case 'lower':
        formatted = inputText.toLowerCase();
        break;
      case 'title':
        formatted = inputText.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case 'slug':
        formatted = inputText
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
        break;
    }
    setOutputText(formatted);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderCalculator = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor do projeto (R$)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={projectValue}
              onChange={(e) => setProjectValue(e.target.value)}
              placeholder="0,00"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horas estimadas
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={projectHours}
              onChange={(e) => setProjectHours(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taxa de imposto (%)
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="6"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Padrão: 6% (MEI)</p>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full py-3 bg-99blue text-white font-medium rounded-lg hover:bg-99blue-light transition-colors flex items-center justify-center"
      >
        <Calculator className="w-5 h-5 mr-2" />
        Calcular
      </button>

      {result && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Resultado
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Valor bruto</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(result.grossValue)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Taxa da plataforma (10%)</p>
              <p className="text-xl font-semibold text-red-600">-{formatCurrency(result.platformFee)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-500">Impostos ({taxRate}%)</p>
              <p className="text-xl font-semibold text-red-600">-{formatCurrency(result.taxValue)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
              <p className="text-sm text-green-700">Valor líquido</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(result.netValue)}</p>
            </div>
          </div>

          <div className="bg-99blue/10 p-4 rounded-lg">
            <p className="text-sm text-99blue">Valor hora líquido</p>
            <p className="text-3xl font-bold text-99blue">{formatCurrency(result.hourlyRate)}</p>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Este cálculo é apenas uma estimativa. Os valores reais podem variar 
          de acordo com sua situação fiscal e outras taxas aplicáveis.
        </p>
      </div>
    </div>
  );

  const renderTextFormatter = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Formato
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: 'upper', label: 'MAIÚSCULAS' },
            { id: 'lower', label: 'minúsculas' },
            { id: 'title', label: 'Título' },
            { id: 'slug', label: 'slug-url' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFormatType(type.id as any)}
              className={`px-4 py-3 rounded-lg border transition-colors ${
                formatType === type.id
                  ? 'bg-99blue text-white border-99blue'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto de entrada
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={6}
          placeholder="Digite ou cole seu texto aqui..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
        />
      </div>

      <button
        onClick={handleFormatText}
        className="w-full py-3 bg-99blue text-white font-medium rounded-lg hover:bg-99blue-light transition-colors flex items-center justify-center"
      >
        <FileText className="w-5 h-5 mr-2" />
        Formatar Texto
      </button>

      {outputText && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resultado
          </label>
          <div className="relative">
            <textarea
              value={outputText}
              readOnly
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={() => navigator.clipboard.writeText(outputText)}
              className="absolute top-2 right-2 px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50"
            >
              Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-99dark text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-xl font-semibold">Ferramentas</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'calculator'
                    ? 'border-99blue text-99blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculadora
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'text'
                    ? 'border-99blue text-99blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Formatador de Texto
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'calculator' && renderCalculator()}
            {activeTab === 'text' && renderTextFormatter()}
          </div>
        </div>
      </div>
    </div>
  );
}
