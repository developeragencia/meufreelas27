import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Briefcase,
  Check,
  CheckCheck,
  EllipsisVertical,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Shield,
  Smile,
  Video,
} from 'lucide-react';
import { moderateContent, type ModerationResult } from '../utils/contentModerator';
import { getBanMessage, getPenaltyMessage, getUserSanctionStatus } from '../utils/sanctions';
import {
  apiGetMessages,
  apiListConversations,
  apiSendMessage,
  hasApi,
  type ApiChatMessage,
  type ApiConversation,
} from '../lib/api';

function formatMessageTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Messages() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [lastModerationResult, setLastModerationResult] = useState<ModerationResult | null>(null);
  const [userSanctionStatus, setUserSanctionStatus] = useState<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user?.id) return;
    setUserSanctionStatus(getUserSanctionStatus(user.id));
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    async function loadConversations() {
      if (!user?.id) return;
      if (!hasApi()) {
        if (mounted) setError('API de mensagens não configurada.');
        return;
      }
      if (mounted) {
        setError('');
        setIsLoadingConversations(true);
      }
      const res = await apiListConversations(user.id);
      if (!mounted) return;
      setIsLoadingConversations(false);
      if (!res.ok) {
        setError(res.error || 'Não foi possível carregar as conversas.');
        return;
      }
      setConversations(res.conversations || []);
    }
    loadConversations();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  async function loadMessages(conversationId: string) {
    if (!user?.id) return;
    setError('');
    setIsLoadingMessages(true);
    const res = await apiGetMessages(user.id, conversationId);
    setIsLoadingMessages(false);
    if (!res.ok) {
      setError(res.error || 'Não foi possível carregar as mensagens.');
      return;
    }
    setMessages(res.messages || []);
  }

  async function handleConversationSelect(conv: ApiConversation) {
    setSelectedConversation(conv);
    setShowMobileChat(true);
    await loadMessages(conv.id);
  }

  function handleBackToList() {
    setShowMobileChat(false);
    setSelectedConversation(null);
    setMessages([]);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    if (userSanctionStatus?.isBanned) {
      setModerationWarning(getBanMessage(user.id));
      setShowModerationModal(true);
      return;
    }
    if (userSanctionStatus?.currentSanction === 'penalty') {
      setModerationWarning(getPenaltyMessage(userSanctionStatus.banExpiresAt));
      setShowModerationModal(true);
      return;
    }

    const moderationResult = moderateContent(newMessage);
    setLastModerationResult(moderationResult);
    const contentToSend = moderationResult.hasViolation ? moderationResult.sanitizedContent : newMessage;
    if (moderationResult.hasViolation) {
      setModerationWarning(moderationResult.warningMessage || 'Conteúdo inadequado detectado.');
      setShowModerationModal(true);
    }

    const res = await apiSendMessage(user.id, selectedConversation.id, contentToSend);
    if (!res.ok || !res.message) {
      setError(res.error || 'Não foi possível enviar a mensagem.');
      return;
    }

    setMessages((prev) => [...prev, res.message as ApiChatMessage]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: contentToSend, lastMessageTime: new Date().toISOString() }
          : c
      )
    );
    setNewMessage('');
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emojis = ['😀', '😂', '🥰', '😎', '👍', '👏', '💪', '🔥', '💯', '✅', '📎', '💼', '💰', '📅', '⏰'];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col overflow-x-hidden">
      <header className="bg-99dark text-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link to="/projects" className="text-gray-300 hover:text-white">
                Projetos
              </Link>
              <Link to="/freelancers" className="text-gray-300 hover:text-white">
                Freelancers
              </Link>
              <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <header className="bg-99dark text-white md:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          {showMobileChat && selectedConversation ? (
            <button onClick={handleBackToList} className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <Link to="/" className="text-xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
          )}

          {showMobileChat && selectedConversation ? (
            <div className="flex items-center flex-1 ml-3">
              <div className="relative">
                <div className="w-8 h-8 bg-99blue rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {selectedConversation.participantAvatar ? (
                    <img src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedConversation.participantName.charAt(0)
                  )}
                </div>
              </div>
              <div className="ml-2">
                <h4 className="font-medium text-sm truncate max-w-[120px]">{selectedConversation.participantName}</h4>
                <p className="text-xs text-gray-400">Conversa</p>
              </div>
            </div>
          ) : (
            <h1 className="text-lg font-semibold">Mensagens</h1>
          )}

          <button className="p-2">
            <EllipsisVertical className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 hidden md:block">Mensagens</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar conversas..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-99blue focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-gray-500 text-sm">Carregando conversas...</div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationSelect(conv)}
                  className={`w-full p-4 flex items-start hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                    selectedConversation?.id === conv.id ? 'bg-sky-50' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-99blue rounded-full flex items-center justify-center text-white font-semibold">
                      {conv.participantAvatar ? (
                        <img src={conv.participantAvatar} alt={conv.participantName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        conv.participantName.charAt(0)
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800 truncate">{conv.participantName}</h4>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatMessageTime(conv.lastMessageTime)}</span>
                    </div>
                    {conv.projectTitle && <p className="text-xs text-99blue truncate">{conv.projectTitle}</p>}
                    <p className="text-sm text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-99blue text-white text-xs rounded-full flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhuma conversa encontrada</p>
              </div>
            )}
          </div>
        </div>

        <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white md:bg-gray-50`}>
          {selectedConversation ? (
            <>
              <div className="hidden md:flex p-4 bg-white border-b border-gray-200 items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-99blue rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConversation.participantAvatar ? (
                      <img src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      selectedConversation.participantName.charAt(0)
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-800">{selectedConversation.participantName}</h4>
                    <p className="text-xs text-gray-500">{selectedConversation.participantTitle || 'Usuário'}</p>
                  </div>
                </div>

                {selectedConversation.projectTitle && (
                  <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
                    <Briefcase className="w-4 h-4 text-gray-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Projeto</p>
                      <p className="text-sm font-medium text-gray-800">{selectedConversation.projectTitle}</p>
                    </div>
                    {selectedConversation.projectValue && (
                      <div className="ml-4 pl-4 border-l border-gray-300">
                        <p className="text-xs text-gray-500">Valor</p>
                        <p className="text-sm font-medium text-99blue">{selectedConversation.projectValue}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="p-8 text-center text-gray-500 text-sm">Carregando mensagens...</div>
                ) : messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div key={message.id}>
                      {index === 0 && (
                        <div className="flex items-center justify-center my-4">
                          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Mensagens</span>
                        </div>
                      )}
                      <div className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        {message.senderId !== user?.id && message.senderAvatar && (
                          <img src={message.senderAvatar} alt={message.senderName} className="w-8 h-8 rounded-full mr-2 flex-shrink-0" />
                        )}
                        <div
                          className={`max-w-[75%] md:max-w-md px-4 py-2.5 rounded-2xl ${
                            message.senderId === user?.id
                              ? 'bg-99blue text-white rounded-br-md'
                              : 'bg-white md:bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-end mt-1 text-xs ${message.senderId === user?.id ? 'text-white/70' : 'text-gray-500'}`}>
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {message.senderId === user?.id && (
                              <span className="ml-1">{message.read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhuma mensagem ainda</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 md:p-4 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button type="button" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 grid grid-cols-5 gap-2 z-10">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewMessage((prev) => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-xl hover:bg-gray-100 rounded p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-full text-sm focus:ring-2 focus:ring-99blue focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-99blue text-white rounded-full hover:bg-99blue-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-99blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-99blue" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Suas Mensagens</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Selecione uma conversa para visualizar as mensagens.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow">{error}</div>}

      {showModerationModal && moderationWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  userSanctionStatus?.isBanned ? 'bg-red-100' : userSanctionStatus?.currentSanction === 'penalty' ? 'bg-orange-100' : 'bg-yellow-100'
                }`}
              >
                {userSanctionStatus?.isBanned ? (
                  <Ban className="w-8 h-8 text-red-600" />
                ) : userSanctionStatus?.currentSanction === 'penalty' ? (
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                ) : (
                  <Shield className="w-8 h-8 text-yellow-600" />
                )}
              </div>

              <h2 className="text-xl font-semibold mb-2">
                {userSanctionStatus?.isBanned ? 'Conta Banida' : userSanctionStatus?.currentSanction === 'penalty' ? 'Conta Penalizada' : 'Aviso de Moderação'}
              </h2>

              <div className="text-gray-600 whitespace-pre-line mb-6">{moderationWarning}</div>

              {lastModerationResult?.hasViolation && !userSanctionStatus?.isBanned && !userSanctionStatus?.currentSanction && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm text-yellow-800">
                    <strong>Conteúdo sanitizado:</strong> Seu conteúdo foi modificado para remover informações proibidas.
                  </p>
                </div>
              )}

              <button onClick={() => setShowModerationModal(false)} className="px-6 py-2 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors">
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
