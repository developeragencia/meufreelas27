import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, Send, MoreVertical, Phone, Video, Paperclip, Smile,
  Check, CheckCheck, MessageSquare, ArrowLeft,
  Briefcase, EllipsisVertical, AlertTriangle, Shield, Ban
} from 'lucide-react';
import { moderateContent, type ModerationResult } from '../utils/contentModerator';
import { getUserSanctionStatus, getBanMessage, getPenaltyMessage } from '../utils/sanctions';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  read: boolean;
  type?: 'text' | 'file' | 'proposal';
  fileName?: string;
  fileSize?: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantTitle?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online?: boolean;
  projectTitle?: string;
  projectValue?: string;
}

// Mock conversations data
const mockConversations: Conversation[] = [
  {
    id: '1',
    participantId: 'freelancer1',
    participantName: 'Daniel Neves',
    participantTitle: 'Brand Designer | Especialista em Logotipos',
    participantAvatar: 'https://ui-avatars.com/api/?name=Daniel+Neves&background=003366&color=fff&size=100',
    lastMessage: 'Perfeito! Vou começar a trabalhar no projeto hoje mesmo.',
    lastMessageTime: '10:30',
    unreadCount: 2,
    online: true,
    projectTitle: 'Criação de Identidade Visual',
    projectValue: 'R$ 1.500,00'
  },
  {
    id: '2',
    participantId: 'client1',
    participantName: 'Lucas Henrique',
    participantTitle: 'Contratante',
    participantAvatar: 'https://ui-avatars.com/api/?name=Lucas+Henrique&background=10b981&color=fff&size=100',
    lastMessage: 'Ótimo trabalho! Vou aprovar o pagamento agora.',
    lastMessageTime: 'Ontem',
    unreadCount: 0,
    online: false,
    projectTitle: 'Rebranding para banda de rock',
    projectValue: 'R$ 2.000,00'
  },
  {
    id: '3',
    participantId: 'freelancer2',
    participantName: 'Rafael Jenei',
    participantTitle: 'Publicitário Criativo',
    participantAvatar: 'https://ui-avatars.com/api/?name=Rafael+Jenei&background=f59e0b&color=fff&size=100',
    lastMessage: 'Você pode me enviar mais detalhes sobre o projeto?',
    lastMessageTime: 'Seg',
    unreadCount: 1,
    online: true,
    projectTitle: 'Campanha Publicitária',
    projectValue: 'R$ 3.500,00'
  },
  {
    id: '4',
    participantId: 'client2',
    participantName: 'Maria Silva',
    participantTitle: 'Contratante',
    lastMessage: 'Obrigada pela proposta! Vou analisar e retorno.',
    lastMessageTime: '15/02',
    unreadCount: 0,
    online: false,
    projectTitle: 'Design de Embalagens',
    projectValue: 'R$ 800,00'
  },
  {
    id: '5',
    participantId: 'freelancer3',
    participantName: 'Bruno Quintino',
    participantTitle: 'Especialista em Logo/Identidade Visual',
    participantAvatar: 'https://ui-avatars.com/api/?name=Bruno+Quintino&background=8b5cf6&color=fff&size=100',
    lastMessage: 'Enviei o arquivo final no formato solicitado.',
    lastMessageTime: '10/02',
    unreadCount: 0,
    online: false,
    projectTitle: 'Logotipo para startup',
    projectValue: 'R$ 600,00'
  }
];

// Mock messages for each conversation
const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'm1',
      senderId: 'freelancer1',
      senderName: 'Daniel Neves',
      senderAvatar: 'https://ui-avatars.com/api/?name=Daniel+Neves&background=003366&color=fff&size=100',
      content: 'Olá! Vi seu projeto e tenho grande interesse em trabalhar com você.',
      timestamp: '09:15',
      read: true
    },
    {
      id: 'm2',
      senderId: 'user',
      senderName: 'Você',
      content: 'Oi Daniel! Obrigado pelo interesse. Você tem portfólio de identidade visual?',
      timestamp: '09:20',
      read: true
    },
    {
      id: 'm3',
      senderId: 'freelancer1',
      senderName: 'Daniel Neves',
      senderAvatar: 'https://ui-avatars.com/api/?name=Daniel+Neves&background=003366&color=fff&size=100',
      content: 'Sim! Tenho mais de 300 projetos concluídos. Posso te enviar alguns exemplos específicos da sua área.',
      timestamp: '09:25',
      read: true
    },
    {
      id: 'm4',
      senderId: 'user',
      senderName: 'Você',
      content: 'Perfeito! Qual seria o prazo de entrega?',
      timestamp: '09:45',
      read: true
    },
    {
      id: 'm5',
      senderId: 'freelancer1',
      senderName: 'Daniel Neves',
      senderAvatar: 'https://ui-avatars.com/api/?name=Daniel+Neves&background=003366&color=fff&size=100',
      content: 'Para um projeto de identidade visual completa, preciso de 7 a 10 dias úteis. Isso inclui logotipo, paleta de cores, tipografia e manual da marca.',
      timestamp: '10:00',
      read: true
    },
    {
      id: 'm6',
      senderId: 'user',
      senderName: 'Você',
      content: 'Excelente! Vou aprovar sua proposta.',
      timestamp: '10:15',
      read: true
    },
    {
      id: 'm7',
      senderId: 'freelancer1',
      senderName: 'Daniel Neves',
      senderAvatar: 'https://ui-avatars.com/api/?name=Daniel+Neves&background=003366&color=fff&size=100',
      content: 'Perfeito! Vou começar a trabalhar no projeto hoje mesmo.',
      timestamp: '10:30',
      read: false
    },
    {
      id: 'm8',
      senderId: 'freelancer1',
      senderName: 'Daniel Neves',
      senderAvatar: 'https://ui-avatars.com/api/?name=Daniel+Neves&background=003366&color=fff&size=100',
      content: 'Vou te enviar um briefing para preenchermos juntos.',
      timestamp: '10:31',
      read: false
    }
  ],
  '2': [
    {
      id: 'm1',
      senderId: 'user',
      senderName: 'Você',
      content: 'Oi Lucas! Finalizei o rebranding da banda. O que achou?',
      timestamp: 'Ontem 14:20',
      read: true
    },
    {
      id: 'm2',
      senderId: 'client1',
      senderName: 'Lucas Henrique',
      senderAvatar: 'https://ui-avatars.com/api/?name=Lucas+Henrique&background=10b981&color=fff&size=100',
      content: 'Ficou incrível! Exatamente o que a gente queria.',
      timestamp: 'Ontem 15:45',
      read: true
    },
    {
      id: 'm3',
      senderId: 'user',
      senderName: 'Você',
      content: 'Que bom que gostou! Vou preparar os arquivos finais.',
      timestamp: 'Ontem 16:00',
      read: true
    },
    {
      id: 'm4',
      senderId: 'client1',
      senderName: 'Lucas Henrique',
      senderAvatar: 'https://ui-avatars.com/api/?name=Lucas+Henrique&background=10b981&color=fff&size=100',
      content: 'Ótimo trabalho! Vou aprovar o pagamento agora.',
      timestamp: 'Ontem 16:30',
      read: true
    }
  ],
  '3': [
    {
      id: 'm1',
      senderId: 'freelancer2',
      senderName: 'Rafael Jenei',
      senderAvatar: 'https://ui-avatars.com/api/?name=Rafael+Jenei&background=f59e0b&color=fff&size=100',
      content: 'Bom dia! Recebi sua proposta para a campanha publicitária.',
      timestamp: 'Seg 08:00',
      read: true
    },
    {
      id: 'm2',
      senderId: 'user',
      senderName: 'Você',
      content: 'Bom dia Rafael! Tem interesse no projeto?',
      timestamp: 'Seg 09:15',
      read: true
    },
    {
      id: 'm3',
      senderId: 'freelancer2',
      senderName: 'Rafael Jenei',
      senderAvatar: 'https://ui-avatars.com/api/?name=Rafael+Jenei&background=f59e0b&color=fff&size=100',
      content: 'Tenho sim! Você pode me enviar mais detalhes sobre o projeto?',
      timestamp: 'Seg 10:30',
      read: false
    }
  ]
};

export default function Messages() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Content moderation states
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [lastModerationResult, setLastModerationResult] = useState<ModerationResult | null>(null);
  const [userSanctionStatus, setUserSanctionStatus] = useState<any>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load user sanction status
  useEffect(() => {
    if (user?.id) {
      const status = getUserSanctionStatus(user.id);
      setUserSanctionStatus(status);
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      const convMessages = mockMessages[selectedConversation.id] || [];
      setMessages(convMessages);
      
      // Mark as read
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [selectedConversation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    // Check if user is banned
    if (userSanctionStatus?.isBanned) {
      setModerationWarning(getBanMessage(user.id));
      setShowModerationModal(true);
      return;
    }
    
    // Check if user has penalty
    if (userSanctionStatus?.currentSanction === 'penalty') {
      setModerationWarning(getPenaltyMessage(userSanctionStatus.banExpiresAt));
      setShowModerationModal(true);
      return;
    }

    // Moderate content
    const moderationResult = moderateContent(newMessage);
    setLastModerationResult(moderationResult);
    
    if (moderationResult.hasViolation) {
      // Show warning but allow sending (content will be sanitized)
      setModerationWarning(moderationResult.warningMessage || 'Conteúdo inadequado detectado.');
      setShowModerationModal(true);
      
      // Use sanitized content
      const sanitizedMessage = moderationResult.sanitizedContent;
      
      const message: Message = {
        id: Date.now().toString(),
        senderId: user.id,
        senderName: user.name,
        content: sanitizedMessage,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };

      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      
      // Update last message in conversation
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id 
          ? { ...c, lastMessage: sanitizedMessage, lastMessageTime: 'Agora' } 
          : c
      ));
      
      setNewMessage('');
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    
    // Update last message in conversation
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id 
        ? { ...c, lastMessage: newMessage, lastMessageTime: 'Agora' } 
        : c
    ));
    
    setNewMessage('');
  };

  const handleConversationSelect = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedConversation(null);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emojis = ['😀', '😂', '🥰', '😎', '👍', '👏', '💪', '🔥', '💯', '✅', '📎', '💼', '💰', '📅', '⏰'];

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Desktop Header */}
      <header className="bg-99dark text-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold">
              meu<span className="font-light">freelas</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link to="/projects" className="text-gray-300 hover:text-white">Projetos</Link>
              <Link to="/freelancers" className="text-gray-300 hover:text-white">Freelancers</Link>
              <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
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
                {selectedConversation.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-99dark rounded-full"></span>
                )}
              </div>
              <div className="ml-2">
                <h4 className="font-medium text-sm truncate max-w-[120px]">{selectedConversation.participantName}</h4>
                <p className="text-xs text-gray-400">{selectedConversation.online ? 'Online' : 'Offline'}</p>
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List - Hidden on mobile when chat is open */}
        <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col`}>
          {/* Search */}
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

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
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
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800 truncate">{conv.participantName}</h4>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.lastMessageTime}</span>
                    </div>
                    {conv.projectTitle && (
                      <p className="text-xs text-99blue truncate">{conv.projectTitle}</p>
                    )}
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

        {/* Chat Area - Full screen on mobile when open */}
        <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white md:bg-gray-50`}>
          {selectedConversation ? (
            <>
              {/* Desktop Chat Header */}
              <div className="hidden md:flex p-4 bg-white border-b border-gray-200 items-center justify-between">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-10 h-10 bg-99blue rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConversation.participantAvatar ? (
                        <img src={selectedConversation.participantAvatar} alt={selectedConversation.participantName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        selectedConversation.participantName.charAt(0)
                      )}
                    </div>
                    {selectedConversation.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-800">{selectedConversation.participantName}</h4>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.participantTitle}
                    </p>
                  </div>
                </div>
                
                {/* Project Info */}
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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((message, index) => (
                    <div key={message.id}>
                      {/* Date separator (mock) */}
                      {index === 0 && (
                        <div className="flex items-center justify-center my-4">
                          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Hoje</span>
                        </div>
                      )}
                      
                      <div
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.senderId !== user?.id && message.senderAvatar && (
                          <img 
                            src={message.senderAvatar} 
                            alt={message.senderName}
                            className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                          />
                        )}
                        <div
                          className={`max-w-[75%] md:max-w-md px-4 py-2.5 rounded-2xl ${
                            message.senderId === user?.id
                              ? 'bg-99blue text-white rounded-br-md'
                              : 'bg-white md:bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div
                            className={`flex items-center justify-end mt-1 text-xs ${
                              message.senderId === user?.id ? 'text-white/70' : 'text-gray-500'
                            }`}
                          >
                            <span>{message.timestamp}</span>
                            {message.senderId === user?.id && (
                              <span className="ml-1">
                                {message.read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                              </span>
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
                      <p className="text-sm text-gray-400 mt-1">Envie uma mensagem para iniciar a conversa</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 md:p-4 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button 
                    type="button" 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 grid grid-cols-5 gap-2 z-10">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => addEmoji(emoji)}
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
                <p className="text-gray-500 max-w-xs mx-auto">
                  Selecione uma conversa para visualizar as mensagens ou inicie uma nova conversa com um freelancer
                </p>
                <Link
                  to="/freelancers"
                  className="inline-block mt-4 px-6 py-2.5 bg-99blue text-white rounded-lg hover:bg-99blue-light transition-colors"
                >
                  Buscar Freelancers
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Moderation Modal */}
      {showModerationModal && moderationWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                userSanctionStatus?.isBanned ? 'bg-red-100' : 
                userSanctionStatus?.currentSanction === 'penalty' ? 'bg-orange-100' : 
                'bg-yellow-100'
              }`}>
                {userSanctionStatus?.isBanned ? (
                  <Ban className="w-8 h-8 text-red-600" />
                ) : userSanctionStatus?.currentSanction === 'penalty' ? (
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                ) : (
                  <Shield className="w-8 h-8 text-yellow-600" />
                )}
              </div>
              
              <h2 className="text-xl font-semibold mb-2">
                {userSanctionStatus?.isBanned ? 'Conta Banida' : 
                 userSanctionStatus?.currentSanction === 'penalty' ? 'Conta Penalizada' : 
                 'Aviso de Moderação'}
              </h2>
              
              <div className="text-gray-600 whitespace-pre-line mb-6">
                {moderationWarning}
              </div>
              
              {lastModerationResult?.hasViolation && !userSanctionStatus?.isBanned && !userSanctionStatus?.currentSanction && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm text-yellow-800">
                    <strong>Conteúdo sanitizado:</strong> Seu conteúdo foi modificado para remover informações proibidas.
                  </p>
                </div>
              )}
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowModerationModal(false)}
                  className="px-6 py-2 bg-99blue text-white rounded-lg hover:bg-sky-400 transition-colors"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
