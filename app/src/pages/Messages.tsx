import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Star,
  Video,
  Archive,
  Trash2,
  Flag,
  Eye,
  Edit,
  X
} from 'lucide-react';
import { moderateContent, type ModerationResult } from '../utils/contentModerator';
import { getBanMessage, getPenaltyMessage, getUserSanctionStatus } from '../utils/sanctions';
import {
  apiGetMessages,
  apiListConversations,
  apiListProposals,
  apiSendMessage,
  apiUpdateProposalStatus,
  hasApi,
  type ApiChatMessage,
  type ApiConversation,
  type ApiProposal,
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
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false); // New state for chat menu
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [proposalActionLoading, setProposalActionLoading] = useState<'Aceita' | 'Recusada' | null>(null);
  const [proposalInConversation, setProposalInConversation] = useState<ApiProposal | null>(null);
  const [error, setError] = useState('');

  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [lastModerationResult, setLastModerationResult] = useState<ModerationResult | null>(null);
  const [userSanctionStatus, setUserSanctionStatus] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'unread' | 'starred' | 'archived' | 'dispute'>('inbox');
  const [starredConversations, setStarredConversations] = useState<string[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<string[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user?.id) return;
    setUserSanctionStatus(getUserSanctionStatus(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const starredRaw = localStorage.getItem(`meufreelas_starred_conversations_${user.id}`);
    const archivedRaw = localStorage.getItem(`meufreelas_archived_conversations_${user.id}`);
    try {
      setStarredConversations(Array.isArray(JSON.parse(starredRaw || '[]')) ? JSON.parse(starredRaw || '[]') : []);
    } catch {
      setStarredConversations([]);
    }
    try {
      setArchivedConversations(
        Array.isArray(JSON.parse(archivedRaw || '[]')) ? JSON.parse(archivedRaw || '[]') : []
      );
    } catch {
      setArchivedConversations([]);
    }
  }, [user?.id]);

  useEffect(() => {
    const conversationId = new URLSearchParams(location.search).get('conversation');
    if (!conversationId) return;
    const found = conversations.find((c) => c.id === conversationId);
    if (!found) return;
    setSelectedConversation(found);
    setShowMobileChat(true);
    loadConversationProposal(found);
    loadMessages(found.id);
  }, [location.search, conversations]);

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

  async function loadConversationProposal(conv: ApiConversation) {
    if (!user?.id || !conv.projectId || !hasApi()) {
      setProposalInConversation(null);
      return;
    }
    setIsLoadingProposal(true);
    const res = await apiListProposals({ projectId: conv.projectId, clientId: user.id });
    setIsLoadingProposal(false);
    if (!res.ok) {
      setProposalInConversation(null);
      return;
    }
    const match = (res.proposals || []).find((p) => p.freelancerId === conv.participantId) || null;
    setProposalInConversation(match);
  }

  async function handleConversationSelect(conv: ApiConversation) {
    setSelectedConversation(conv);
    setShowMobileChat(true);
    await loadConversationProposal(conv);
    await loadMessages(conv.id);
  }

  function handleBackToList() {
    setShowMobileChat(false);
    setSelectedConversation(null);
    setMessages([]);
    setProposalInConversation(null);
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

  async function handleProposalAction(status: 'Aceita' | 'Recusada') {
    if (!proposalInConversation?.id || !user?.id) return;
    setProposalActionLoading(status);
    const res = await apiUpdateProposalStatus({
      proposalId: proposalInConversation.id,
      clientId: user.id,
      status,
    });
    setProposalActionLoading(null);
    if (!res.ok) {
      setError(res.error || `Não foi possível ${status === 'Aceita' ? 'aceitar' : 'recusar'} a proposta.`);
      return;
    }
    setProposalInConversation((prev) => (prev ? { ...prev, status } : prev));
    if (selectedConversation?.id) {
      const infoMessage =
        status === 'Aceita'
          ? 'Sua proposta foi aceita pelo cliente. Vamos iniciar o projeto!'
          : 'Sua proposta foi recusada pelo cliente.';
      const sent = await apiSendMessage(user.id, selectedConversation.id, infoMessage);
      if (sent.ok && sent.message) {
        setMessages((prev) => [...prev, sent.message as ApiChatMessage]);
      }
    }
  }

  function toggleStarConversation(id: string) {
    if (!user?.id) return;
    setStarredConversations((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(
        `meufreelas_starred_conversations_${user.id}`,
        JSON.stringify(next)
      );
      return next;
    });
  }

  function toggleArchiveConversation(id: string) {
    if (!user?.id) return;
    setArchivedConversations((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(
        `meufreelas_archived_conversations_${user.id}`,
        JSON.stringify(next)
      );
      return next;
    });
    if (selectedConversation?.id === id) {
      handleBackToList();
    }
  }

  const folderFilteredConversations = conversations.filter((conv) => {
    if (selectedFolder === 'unread') return conv.unreadCount > 0 && !archivedConversations.includes(conv.id);
    if (selectedFolder === 'starred')
      return starredConversations.includes(conv.id) && !archivedConversations.includes(conv.id);
    if (selectedFolder === 'archived') return archivedConversations.includes(conv.id);
    if (selectedFolder === 'dispute') return false;
    return !archivedConversations.includes(conv.id);
  });

  const filteredConversations = folderFilteredConversations.filter(
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

          <div className="relative">
            <button 
              onClick={() => setShowChatMenu(!showChatMenu)}
              className="p-2"
            >
              <EllipsisVertical className="w-6 h-6" />
            </button>
            
            {showChatMenu && (
              <div className="absolute top-12 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 text-gray-800">
                {selectedConversation && user?.type === 'freelancer' && selectedConversation.projectId && (
                  <button 
                    onClick={() => {
                      navigate(`/project/${selectedConversation.projectId}/proposal`);
                      setShowChatMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Melhorar proposta
                  </button>
                )}
                
                {selectedConversation ? (
                  <>
                    <button 
                      onClick={() => {
                        toggleArchiveConversation(selectedConversation.id);
                        setShowChatMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Arquivar conversa
                    </button>
                    <button 
                      onClick={() => {
                        alert('Usuário denunciado com sucesso.');
                        setShowChatMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Denunciar usuário
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setSelectedFolder('archived');
                      setShowChatMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Ver Arquivadas
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex w-60 bg-99dark text-white flex-col">
          <div className="px-4 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold tracking-wide">Caixa de entrada</h2>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
            <button
              type="button"
              onClick={() => setSelectedFolder('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                selectedFolder === 'inbox' ? 'bg-white text-99dark' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>Caixa de entrada</span>
              <span className="text-xs bg-black/30 rounded-full px-2 py-0.5">
                {conversations.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFolder('unread')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                selectedFolder === 'unread' ? 'bg-white text-99dark' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>Não lidas</span>
              <span className="text-xs bg-black/30 rounded-full px-2 py-0.5">
                {conversations.filter((c) => c.unreadCount > 0 && !archivedConversations.includes(c.id)).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFolder('starred')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                selectedFolder === 'starred' ? 'bg-white text-99dark' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>Destacadas</span>
              <span className="text-xs bg-black/30 rounded-full px-2 py-0.5">
                {starredConversations.filter((id) => !archivedConversations.includes(id)).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFolder('archived')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                selectedFolder === 'archived' ? 'bg-white text-99dark' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>Arquivadas</span>
              <span className="text-xs bg-black/30 rounded-full px-2 py-0.5">
                {archivedConversations.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFolder('dispute')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                selectedFolder === 'dispute' ? 'bg-white text-99dark' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span>Disputa</span>
              <span className="text-xs bg-black/30 rounded-full px-2 py-0.5">0</span>
            </button>
          </nav>
          <div className="px-4 py-4 border-t border-white/10 text-xs text-white/70">
            <p className="mb-1">Etiquetas</p>
            <button
              type="button"
              className="text-xs text-99blue-light hover:underline"
            >
              + Adicionar etiqueta...
            </button>
          </div>
        </div>
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
              filteredConversations.map((conv) => {
                const isStarred = starredConversations.includes(conv.id);
                return (
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
                  <div className="ml-3 flex-1 min-w-0 flex items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800 truncate">{conv.participantName}</h4>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatMessageTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      {conv.projectTitle && <p className="text-xs text-99blue truncate">{conv.projectTitle}</p>}
                      <p className="text-sm text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                    <div className="flex flex-col items-end ml-2 gap-1">
                      {conv.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-99blue text-white text-xs rounded-full flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarConversation(conv.id);
                          }}
                          className={`p-1 rounded-full ${
                            isStarred ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleArchiveConversation(conv.id);
                          }}
                          className="p-1 rounded-full text-gray-300 hover:text-gray-500"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
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

                <div className="flex items-center space-x-1 relative">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Video className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowChatMenu(!showChatMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {showChatMenu && (
                    <div className="absolute top-12 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                      {user?.type === 'freelancer' && selectedConversation.projectId && (
                        <button 
                          onClick={() => navigate(`/project/${selectedConversation.projectId}/proposal`)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Melhorar proposta
                        </button>
                      )}
                      <button 
                        onClick={() => toggleArchiveConversation(selectedConversation.id)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Arquivar conversa
                      </button>
                      <button 
                        onClick={() => {
                          alert('Usuário denunciado com sucesso.');
                          setShowChatMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Denunciar usuário
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {/* Warning Banner */}
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-start gap-3">
                  <div className="bg-white p-1 rounded-full shadow-sm flex-shrink-0 border border-gray-100 flex items-center justify-center w-10 h-10">
                    <img src="/favicon.png" alt="MeuFreelas" className="w-5 h-5 object-contain" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-600 text-sm mb-1">Atenção:</h4>
                    <p className="text-sm text-red-700 leading-relaxed">
                      Negocie sempre via chat seguro do MeuFreelas. Informações de contato só poderão ser passadas após o pagamento ser feito dentro do MeuFreelas.
                    </p>
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      * O descumprimento desta regra poderá acarretar em penalizações e banimentos.
                    </p>
                  </div>
                  <button className="text-red-400 hover:text-red-600 ml-auto">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedConversation?.projectTitle && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Projeto da conversa</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedConversation.projectTitle}</p>
                      </div>
                      {selectedConversation.projectValue && (
                        <span className="text-sm font-semibold text-99blue">{selectedConversation.projectValue}</span>
                      )}
                    </div>
                    {user?.type === 'client' && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        {isLoadingProposal ? (
                          <p className="text-sm text-gray-500">Carregando proposta...</p>
                        ) : proposalInConversation ? (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-700">
                              <p>
                                <span className="font-medium">Oferta:</span> {proposalInConversation.value} |{' '}
                                <span className="font-medium">Prazo:</span> {proposalInConversation.deliveryDays}
                              </p>
                              <p className="mt-1">
                                <span className="font-medium">Status:</span>{' '}
                                <span
                                  className={
                                    proposalInConversation.status === 'Aceita'
                                      ? 'text-green-600 font-medium'
                                      : proposalInConversation.status === 'Recusada'
                                      ? 'text-red-600 font-medium'
                                      : 'text-amber-600 font-medium'
                                  }
                                >
                                  {proposalInConversation.status}
                                </span>
                              </p>
                            </div>
                            {proposalInConversation.status === 'Pendente' && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleProposalAction('Aceita')}
                                  disabled={proposalActionLoading !== null}
                                  className="px-4 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-60"
                                >
                                  {proposalActionLoading === 'Aceita' ? 'Aceitando...' : 'Aceitar proposta'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleProposalAction('Recusada')}
                                  disabled={proposalActionLoading !== null}
                                  className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                                >
                                  {proposalActionLoading === 'Recusada' ? 'Recusando...' : 'Recusar proposta'}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhuma proposta encontrada para este projeto nesta conversa.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
