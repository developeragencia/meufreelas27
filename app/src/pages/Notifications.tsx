import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClearNotifications, apiDeleteNotification, apiListNotifications, apiMarkAllNotificationsRead, apiMarkNotificationRead, hasApi } from '../lib/api';
import { 
  ArrowLeft, Bell, Check, CheckCheck, Trash2, Briefcase, 
  MessageSquare, DollarSign, Star, Info, X,
  ChevronRight
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'project' | 'message' | 'payment' | 'review' | 'system';
  title: string;
  description: string;
  date: string;
  isRead: boolean;
  link?: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [noApi, setNoApi] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const load = async () => {
      if (!user?.id) return;
      if (!hasApi()) {
        setNoApi(true);
        setNotifications([]);
        return;
      }
      setNoApi(false);
      const res = await apiListNotifications(user.id);
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      setNotifications((res.notifications || []) as Notification[]);
    };

    load();
  }, [isAuthenticated, user, navigate]);

  const markAsRead = async (id: string) => {
    if (!user?.id) return;
    const res = await apiMarkNotificationRead(user.id, id);
    if (!res.ok) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    const res = await apiMarkAllNotificationsRead(user.id);
    if (!res.ok) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (id: string) => {
    if (!user?.id) return;
    const res = await apiDeleteNotification(user.id, id);
    if (!res.ok) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = async () => {
    if (confirm('Tem certeza que deseja limpar todas as notificações?')) {
      if (!user?.id) return;
      const res = await apiClearNotifications(user.id);
      if (!res.ok) return;
      setNotifications([]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'project': return Briefcase;
      case 'message': return MessageSquare;
      case 'payment': return DollarSign;
      case 'review': return Star;
      case 'system': return Info;
      default: return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-600';
      case 'message': return 'bg-green-100 text-green-600';
      case 'payment': return 'bg-purple-100 text-purple-600';
      case 'review': return 'bg-yellow-100 text-yellow-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      default: return 'bg-99blue/10 text-99blue';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-99dark text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link to="/" className="text-2xl font-bold">
                meu<span className="font-light">freelas</span>
              </Link>
            </div>
            <Link to={user?.type === 'freelancer' ? '/freelancer/dashboard' : '/dashboard'} className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Notificações</h1>
            {unreadCount > 0 && (
              <span className="ml-3 px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                {unreadCount} não lidas
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-99blue text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread' ? 'bg-99blue text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Não lidas
            </button>
          </div>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center text-sm text-99blue hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Marcar todas como lidas
            </button>
            <button
              onClick={clearAll}
              className="flex items-center text-sm text-red-500 hover:underline"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar todas
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {noApi ? 'API não configurada' : filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              </h3>
              <p className="text-gray-500">
                {noApi
                  ? 'Configure a API (VITE_API_URL) para receber notificações.'
                  : filter === 'unread'
                    ? 'Você já leu todas as suas notificações!'
                    : 'Você não tem notificações no momento.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const Icon = getIcon(notification.type);
                return (
                  <div 
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${getIconColor(notification.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">{notification.description}</p>
                            <p className="text-xs text-gray-400 mt-2">{formatDate(notification.date)}</p>
                          </div>
                          <div className="flex items-center space-x-1 ml-4">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-99blue hover:bg-99blue/10 rounded-lg"
                                title="Marcar como lida"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              title="Excluir"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {notification.link && (
                          <Link
                            to={notification.link}
                            onClick={() => markAsRead(notification.id)}
                            className="inline-flex items-center mt-2 text-sm text-99blue hover:underline"
                          >
                            Ver detalhes
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
