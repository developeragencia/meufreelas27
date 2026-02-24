import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CreditCard, Building2, Wallet, Receipt, TrendingUp,
  Crown, Bell, Shield, Save, ArrowLeft, Plus, Trash2,
  CheckCircle, AlertCircle, Mail, MapPin, FileCheck
} from 'lucide-react';

interface Card {
  id: string;
  number: string;
  holder: string;
  expiry: string;
  brand: 'visa' | 'mastercard' | 'amex';
  isDefault: boolean;
}

interface BankAccount {
  id: string;
  bank: string;
  agency: string;
  account: string;
  type: 'checking' | 'savings';
  holder: string;
  isDefault: boolean;
}

type AccountTab = 'cards' | 'bank' | 'payments' | 'earnings' | 'subscription' | 'notifications' | 'security' | 'location' | 'verification';
const VALID_TABS: AccountTab[] = ['cards', 'bank', 'payments', 'earnings', 'subscription', 'notifications', 'security', 'location', 'verification'];

export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const tabFromUrl = searchParams.get('tab') as AccountTab | null;
  const [activeTab, setActiveTab] = useState<AccountTab>(VALID_TABS.includes(tabFromUrl as any) ? tabFromUrl! : 'cards');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as any)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Cards
  const [cards, setCards] = useState<Card[]>([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', holder: '', expiry: '', cvv: '' });

  // Bank Accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [newBank, setNewBank] = useState<{ bank: string; agency: string; account: string; type: 'checking' | 'savings'; holder: string }>({ bank: '', agency: '', account: '', type: 'checking', holder: '' });

  // Payment preferences
  const [autoWithdraw, setAutoWithdraw] = useState(false);
  const [withdrawThreshold, setWithdrawThreshold] = useState('100');

  // Notifications
  const [notifications, setNotifications] = useState({
    emailProjects: true,
    emailMessages: true,
    emailPayments: true,
    pushProjects: false,
    pushMessages: true,
    pushPayments: true
  });

  const maskCardNumber = (number: string) => {
    return '**** **** **** ' + number.slice(-4);
  };

  const handleAddCard = () => {
    if (newCard.number && newCard.holder && newCard.expiry) {
      const brand = newCard.number.startsWith('4') ? 'visa' : 
                    newCard.number.startsWith('5') ? 'mastercard' : 'amex';
      const card: Card = {
        id: Date.now().toString(),
        number: newCard.number,
        holder: newCard.holder,
        expiry: newCard.expiry,
        brand,
        isDefault: cards.length === 0
      };
      setCards([...cards, card]);
      setNewCard({ number: '', holder: '', expiry: '', cvv: '' });
      setShowCardForm(false);
      showSuccess('Cartão adicionado com sucesso!');
    }
  };

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    showSuccess('Cartão removido com sucesso!');
  };

  const handleSetDefaultCard = (id: string) => {
    setCards(cards.map(c => ({ ...c, isDefault: c.id === id })));
  };

  const handleAddBank = () => {
    if (newBank.bank && newBank.agency && newBank.account && newBank.holder) {
      const account: BankAccount = {
        id: Date.now().toString(),
        ...newBank,
        isDefault: bankAccounts.length === 0
      };
      setBankAccounts([...bankAccounts, account]);
      setNewBank({ bank: '', agency: '', account: '', type: 'checking', holder: '' });
      setShowBankForm(false);
      showSuccess('Conta bancária adicionada com sucesso!');
    }
  };

  const handleRemoveBank = (id: string) => {
    setBankAccounts(bankAccounts.filter(b => b.id !== id));
    showSuccess('Conta bancária removida com sucesso!');
  };

  const handleSetDefaultBank = (id: string) => {
    setBankAccounts(bankAccounts.map(b => ({ ...b, isDefault: b.id === id })));
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSavePreferences = () => {
    showSuccess('Preferências salvas com sucesso!');
  };

  const renderCardsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Meus cartões</h3>
        <button
          onClick={() => setShowCardForm(!showCardForm)}
          className="flex items-center px-4 py-2 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar cartão
        </button>
      </div>

      {showCardForm && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Novo cartão</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Número do cartão</label>
              <input
                type="text"
                value={newCard.number}
                onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                placeholder="0000 0000 0000 0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome no cartão</label>
              <input
                type="text"
                value={newCard.holder}
                onChange={(e) => setNewCard({ ...newCard, holder: e.target.value })}
                placeholder="NOME COMO ESTÁ NO CARTÃO"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Validade</label>
              <input
                type="text"
                value={newCard.expiry}
                onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                placeholder="MM/AA"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
              <input
                type="text"
                value={newCard.cvv}
                onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                placeholder="123"
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowCardForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddCard}
              className="px-6 py-2 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
            >
              Salvar cartão
            </button>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum cartão cadastrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-8 bg-gray-200 rounded mr-4 flex items-center justify-center">
                  <span className="text-xs font-bold uppercase">{card.brand}</span>
                </div>
                <div>
                  <p className="font-medium">{maskCardNumber(card.number)}</p>
                  <p className="text-sm text-gray-500">{card.holder} • Vence {card.expiry}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {card.isDefault ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Padrão
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefaultCard(card.id)}
                    className="text-sm text-99blue hover:underline"
                  >
                    Tornar padrão
                  </button>
                )}
                <button
                  onClick={() => handleRemoveCard(card.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBankTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Contas bancárias</h3>
        <button
          onClick={() => setShowBankForm(!showBankForm)}
          className="flex items-center px-4 py-2 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar conta
        </button>
      </div>

      {showBankForm && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Nova conta bancária</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
              <select
                value={newBank.bank}
                onChange={(e) => setNewBank({ ...newBank, bank: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              >
                <option value="">Selecione o banco</option>
                <option value="001">Banco do Brasil</option>
                <option value="033">Santander</option>
                <option value="104">Caixa Econômica</option>
                <option value="237">Bradesco</option>
                <option value="341">Itaú</option>
                <option value="260">Nubank</option>
                <option value="290">PagBank</option>
                <option value="380">PicPay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
              <input
                type="text"
                value={newBank.agency}
                onChange={(e) => setNewBank({ ...newBank, agency: e.target.value })}
                placeholder="0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
              <input
                type="text"
                value={newBank.account}
                onChange={(e) => setNewBank({ ...newBank, account: e.target.value })}
                placeholder="00000-0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={newBank.type}
                onChange={(e) => setNewBank({ ...newBank, type: e.target.value as 'checking' | 'savings' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              >
                <option value="checking">Conta Corrente</option>
                <option value="savings">Conta Poupança</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Titular da conta</label>
              <input
                type="text"
                value={newBank.holder}
                onChange={(e) => setNewBank({ ...newBank, holder: e.target.value })}
                placeholder="Nome completo do titular"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowBankForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddBank}
              className="px-6 py-2 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
            >
              Salvar conta
            </button>
          </div>
        </div>
      )}

      {bankAccounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma conta bancária cadastrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bankAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg mr-4 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">Banco {account.bank}</p>
                  <p className="text-sm text-gray-500">
                    Ag: {account.agency} • CC: {account.account} • {account.type === 'checking' ? 'Corrente' : 'Poupança'}
                  </p>
                  <p className="text-sm text-gray-400">{account.holder}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {account.isDefault ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Padrão
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefaultBank(account.id)}
                    className="text-sm text-99blue hover:underline"
                  >
                    Tornar padrão
                  </button>
                )}
                <button
                  onClick={() => handleRemoveBank(account.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Preferências de pagamento</h3>
      
      <div className="bg-gray-50 p-6 rounded-lg space-y-6">
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoWithdraw}
              onChange={(e) => setAutoWithdraw(e.target.checked)}
              className="w-5 h-5 text-99blue border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Saque automático</span>
          </label>
          <p className="text-sm text-gray-500 mt-2 ml-8">
            Transferir automaticamente para sua conta bancária quando atingir o valor mínimo
          </p>
        </div>

        {autoWithdraw && (
          <div className="ml-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor mínimo para saque (R$)
            </label>
            <input
              type="number"
              value={withdrawThreshold}
              onChange={(e) => setWithdrawThreshold(e.target.value)}
              min="50"
              className="w-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSavePreferences}
          className="flex items-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
        >
          <Save className="w-5 h-5 mr-2" />
          Salvar preferências
        </button>
      </div>
    </div>
  );

  const renderEarningsTab = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Meus rendimentos</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-99blue to-99blue-light text-white p-6 rounded-lg">
          <p className="text-white/80 text-sm">Saldo disponível</p>
          <p className="text-3xl font-bold mt-2">R$ 0,00</p>
        </div>
        <div className="bg-white border p-6 rounded-lg">
          <p className="text-gray-500 text-sm">Este mês</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">R$ 0,00</p>
        </div>
        <div className="bg-white border p-6 rounded-lg">
          <p className="text-gray-500 text-sm">Total recebido</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">R$ 0,00</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Histórico de rendimentos</h4>
        <div className="text-center py-12 text-gray-500">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p>Nenhum rendimento registrado ainda</p>
        </div>
      </div>
    </div>
  );

  const renderSubscriptionTab = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Minha assinatura</h3>
      
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
              <Crown className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Plano Gratuito</p>
              <p className="text-sm text-gray-500">Você está no plano gratuito</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors">
            Fazer upgrade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Plano Pro</h4>
          <p className="text-3xl font-bold text-99blue">R$ 49<span className="text-lg text-gray-500">/mês</span></p>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Propostas ilimitadas
            </li>
            <li className="flex items-center text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Destaque no perfil
            </li>
            <li className="flex items-center text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Sem taxa de serviço
            </li>
          </ul>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Plano Premium</h4>
          <p className="text-3xl font-bold text-99blue">R$ 99<span className="text-lg text-gray-500">/mês</span></p>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Tudo do Pro
            </li>
            <li className="flex items-center text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Badge verificado
            </li>
            <li className="flex items-center text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Suporte prioritário
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Preferências de notificação</h3>
      
      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email
          </h4>
          <div className="space-y-3 ml-7">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifications.emailProjects}
                onChange={(e) => setNotifications({ ...notifications, emailProjects: e.target.checked })}
                className="w-4 h-4 text-99blue border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Novos projetos relacionados</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifications.emailMessages}
                onChange={(e) => setNotifications({ ...notifications, emailMessages: e.target.checked })}
                className="w-4 h-4 text-99blue border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Novas mensagens</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifications.emailPayments}
                onChange={(e) => setNotifications({ ...notifications, emailPayments: e.target.checked })}
                className="w-4 h-4 text-99blue border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Atualizações de pagamento</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Push
          </h4>
          <div className="space-y-3 ml-7">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifications.pushProjects}
                onChange={(e) => setNotifications({ ...notifications, pushProjects: e.target.checked })}
                className="w-4 h-4 text-99blue border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Novos projetos</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifications.pushMessages}
                onChange={(e) => setNotifications({ ...notifications, pushMessages: e.target.checked })}
                className="w-4 h-4 text-99blue border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Novas mensagens</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifications.pushPayments}
                onChange={(e) => setNotifications({ ...notifications, pushPayments: e.target.checked })}
                className="w-4 h-4 text-99blue border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">Pagamentos</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSavePreferences}
          className="flex items-center px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
        >
          <Save className="w-5 h-5 mr-2" />
          Salvar preferências
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Segurança da conta</h3>
      
      <div className="bg-white border rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-99blue mr-4" />
            <div>
              <p className="font-medium text-gray-900">Autenticação de dois fatores</p>
              <p className="text-sm text-gray-500">Adicione uma camada extra de segurança</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-99blue text-99blue rounded-lg hover:bg-99blue/5 transition-colors">
            Ativar
          </button>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mr-4" />
              <div>
                <p className="font-medium text-gray-900">Alterar senha</p>
                <p className="text-sm text-gray-500">Última alteração: nunca</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-99blue text-99blue rounded-lg hover:bg-99blue/5 transition-colors">
              Alterar
            </button>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <p className="font-medium text-gray-900">PIN de segurança</p>
                <p className="text-sm text-gray-500">Proteja suas transações</p>
              </div>
            </div>
            <button className="px-4 py-2 border border-99blue text-99blue rounded-lg hover:bg-99blue/5 transition-colors">
              Configurar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocationTab = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Informações de localização</h3>
      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="text-gray-600 mb-4">
          Mantenha seu endereço e localização atualizados para receber propostas e projetos da sua região quando aplicável.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
            <input type="text" defaultValue="Brasil" className="w-full px-4 py-3 border border-gray-300 rounded-lg" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cidade (opcional)</label>
            <input type="text" placeholder="Ex: São Paulo" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado (opcional)</label>
            <input type="text" placeholder="Ex: SP" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-99blue" />
          </div>
        </div>
        <button className="mt-4 px-6 py-3 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors">
          Salvar localização
        </button>
      </div>
    </div>
  );

  const renderVerificationTab = () => (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Verificações de documentos</h3>
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <p className="text-gray-600">
          Envie seus documentos para verificação e ganhe mais confiança na plataforma. Dados são processados de forma segura.
        </p>
        <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
          <div className="flex items-center">
            <FileCheck className="w-8 h-8 text-99blue mr-4" />
            <div>
              <p className="font-medium text-gray-900">Documento de identidade (CPF/RG)</p>
              <p className="text-sm text-gray-500">Status: Não enviado</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors">
            Enviar documento
          </button>
        </div>
        <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-gray-400 mr-4" />
            <div>
              <p className="font-medium text-gray-900">Comprovante de endereço</p>
              <p className="text-sm text-gray-500">Status: Opcional</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Enviar
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'cards', label: 'Cartões', icon: CreditCard },
    { id: 'bank', label: 'Conta Bancária', icon: Building2 },
    { id: 'payments', label: 'Pagamentos', icon: Wallet },
    ...(user?.type === 'freelancer' ? [
      { id: 'earnings', label: 'Rendimentos', icon: TrendingUp },
      { id: 'subscription', label: 'Assinatura', icon: Crown }
    ] : []),
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'location', label: 'Localização', icon: MapPin },
    { id: 'verification', label: 'Verificações de documentos', icon: FileCheck },
  ];

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
          <h1 className="text-xl font-semibold">Minha Conta</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <nav className="flex flex-col">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as AccountTab);
                      setSearchParams({ tab: tab.id });
                    }}
                    className={`flex items-center px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-99blue/10 text-99blue border-r-2 border-99blue'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {activeTab === 'cards' && renderCardsTab()}
              {activeTab === 'bank' && renderBankTab()}
              {activeTab === 'payments' && renderPaymentsTab()}
              {activeTab === 'earnings' && renderEarningsTab()}
              {activeTab === 'subscription' && renderSubscriptionTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'location' && renderLocationTab()}
              {activeTab === 'verification' && renderVerificationTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}