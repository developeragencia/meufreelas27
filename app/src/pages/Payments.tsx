import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiListPayments, apiReleasePayment, hasApi } from '../lib/api';
import BrandLogo from '../components/BrandLogo';
import { 
  DollarSign, 
  CreditCard, 
  Wallet,
  TrendingUp,
  Download,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: 'entrada' | 'saida';
  rawStatus?: string;
  status: 'Concluído' | 'Pendente' | 'Em processamento';
  date: string;
  project?: string;
}

export default function Payments() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'refunds' ? 'reembolsos' : 'resumo';
  const [activeTab, setActiveTab] = useState<'resumo' | 'historico' | 'saque' | 'reembolsos'>(initialTab);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState('R$ 0,00');
  const [pending, setPending] = useState('R$ 0,00');
  const [monthReceived, setMonthReceived] = useState('R$ 0,00');
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const isFreelancer = user?.type === 'freelancer';

  const loadPayments = async () => {
    if (!user?.id || !hasApi()) {
      setTransactions([]);
      setBalance('R$ 0,00');
      setPending('R$ 0,00');
      setMonthReceived('R$ 0,00');
      return;
    }
    const userType = user.type === 'freelancer' ? 'freelancer' : 'client';
    const res = await apiListPayments({ userId: user.id, userType });
    if (!res.ok) {
      setTransactions([]);
      return;
    }
    setTransactions((res.transactions || []) as Transaction[]);
    setBalance(res.summary?.balance || 'R$ 0,00');
    setPending(res.summary?.pending || 'R$ 0,00');
    setMonthReceived(res.summary?.monthReceived || 'R$ 0,00');
  };

  useEffect(() => {
    loadPayments();
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'refunds') {
      setActiveTab('reembolsos');
    }
  }, [searchParams]);

  const handleReleasePayment = async (paymentId: string) => {
    if (!user?.id || user.type !== 'client') return;
    setReleasingId(paymentId);
    const res = await apiReleasePayment({ paymentId, clientId: user.id });
    setReleasingId(null);
    if (res.ok) {
      await loadPayments();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-100 text-green-700';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <CheckCircle className="w-4 h-4" />;
      case 'Pendente':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <BrandLogo to="/" darkBg />
            <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Pagamentos</h1>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {([
            'resumo',
            'historico',
            ...(isFreelancer ? (['saque'] as const) : []),
            'reembolsos',
          ] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchParams(tab === 'reembolsos' ? { tab: 'refunds' } : {});
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-99blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'reembolsos' ? 'Reembolsos' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'resumo' && (
          <>
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">{isFreelancer ? 'Saldo disponível' : 'Total pago'}</p>
                <p className="text-3xl font-semibold text-gray-800">{balance}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">{isFreelancer ? 'Valor pendente' : 'Pagamentos pendentes'}</p>
                <p className="text-3xl font-semibold text-gray-800">{pending}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">{isFreelancer ? 'Total recebido (mês)' : 'Total gasto (mês)'}</p>
                <p className="text-3xl font-semibold text-gray-800">{monthReceived}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFreelancer ? (
                  <button
                    onClick={() => setActiveTab('saque')}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-99blue hover:bg-sky-50 transition-colors"
                  >
                    <div className="p-3 bg-99blue rounded-lg mr-4">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-800">Sacar Dinheiro</p>
                      <p className="text-sm text-gray-500">Transferir para conta bancária</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="p-3 bg-gray-300 rounded-lg mr-4">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-700">Saque indisponível para cliente</p>
                      <p className="text-sm text-gray-500">Clientes fazem pagamentos, freelancers realizam saques.</p>
                    </div>
                  </div>
                )}

                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-99blue hover:bg-sky-50 transition-colors">
                  <div className="p-3 bg-purple-500 rounded-lg mr-4">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">Configurar Pagamento</p>
                    <p className="text-sm text-gray-500">Adicionar ou editar métodos</p>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'historico' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Histórico de Transações</h2>
                <button className="flex items-center text-99blue hover:underline text-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg mr-4 ${
                          transaction.type === 'entrada' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'entrada' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <DollarSign className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{transaction.description}</p>
                          {transaction.project && (
                            <p className="text-sm text-gray-500">Projeto: {transaction.project}</p>
                          )}
                          <p className="text-sm text-gray-400">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'entrada' ? '+' : '-'}{transaction.amount}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1">{transaction.status}</span>
                        </span>
                        {user?.type === 'client' && transaction.rawStatus === 'held' && (
                          <button
                            type="button"
                            onClick={() => handleReleasePayment(transaction.id)}
                            disabled={releasingId === transaction.id}
                            className="block mt-2 ml-auto px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 disabled:opacity-50"
                          >
                            {releasingId === transaction.id ? 'Liberando...' : 'Liberar pagamento'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma transação ainda</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'saque' && isFreelancer && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Solicitar Saque</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Saldo disponível para saque</p>
              <p className="text-2xl font-semibold text-gray-800">{balance}</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              alert('Funcionalidade em desenvolvimento');
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do saque
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta bancária
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent">
                  <option>Selecione uma conta</option>
                  <option>Adicionar nova conta</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors font-medium"
                >
                  Solicitar Saque
                </button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                O saque será processado em até 2 dias úteis.
              </p>
            </form>
          </div>
        )}

        {activeTab === 'reembolsos' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Histórico de Reembolsos</h2>
              <p className="text-sm text-gray-500 mt-1">
                Lista de estornos e reembolsos processados na plataforma.
              </p>
            </div>
            <div className="p-10 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum reembolso encontrado no momento.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
