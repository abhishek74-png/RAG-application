import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CreditCard, HardDrive, FileText, Settings, X, Check, CheckCircle2, Trash2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'payment' | 'storage' | 'subscription' | 'document' | 'system';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export const NotificationCenter = ({ isDark = false }: { isDark?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial notifications and subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setNotifications(data as Notification[]);
      } else {
        // Fallback mock data if table doesn't exist yet
        setNotifications([
          { id: '1', title: 'Payment Successful', message: 'Your Pro Plan subscription renewed.', type: 'payment', is_read: false, created_at: new Date().toISOString() },
          { id: '2', title: 'Document Processed', message: 'annual-report.pdf has been embedded.', type: 'document', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', title: 'Storage Warning', message: 'You have used 80% of your storage limit.', type: 'storage', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
        ]);
      }
    };

    fetchNotifications();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    // Real API call
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id).eq('is_read', false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'storage': return <HardDrive className="w-4 h-4 text-warning" />;
      case 'subscription': return <Settings className="w-4 h-4 text-link" />;
      case 'document': return <FileText className="w-4 h-4 text-indigo-500" />;
      default: return <Info className="w-4 h-4 text-mute" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-sm transition-colors ${isDark ? 'text-[#888888] hover:bg-[#222222] hover:text-white' : 'text-mute hover:bg-canvas-soft hover:text-ink'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse border border-canvas"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-md shadow-level-3 border overflow-hidden z-50 ${isDark ? 'bg-[#111111] border-[#222222]' : 'bg-canvas border-hairline'}`}
          >
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-[#222222] bg-[#0A0A0A]' : 'border-hairline bg-canvas-soft'}`}>
              <div className="flex items-center gap-2">
                <h3 className={`text-[14px] font-semibold ${isDark ? 'text-white' : 'text-ink'}`}>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-link text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${isDark ? 'text-[#888888] hover:text-white' : 'text-mute hover:text-ink'}`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className={`max-h-[400px] overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#111111]' : 'bg-canvas'}`}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <Bell className={`w-8 h-8 mb-3 opacity-20 ${isDark ? 'text-white' : 'text-ink'}`} />
                  <p className={`text-[13px] ${isDark ? 'text-[#888888]' : 'text-mute'}`}>You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 flex gap-3 relative cursor-pointer group transition-colors ${
                        notif.is_read 
                          ? (isDark ? 'bg-[#111111] hover:bg-[#1A1A1A]' : 'bg-canvas hover:bg-canvas-soft/50') 
                          : (isDark ? 'bg-[#1A1A1A] hover:bg-[#222222]' : 'bg-link/5 hover:bg-link/10')
                      } ${isDark ? 'border-[#222222]' : 'border-hairline'}`}
                    >
                      {!notif.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-link"></div>
                      )}
                      
                      <div className="shrink-0 mt-1">
                        {getIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-[13px] font-medium truncate ${isDark ? 'text-white' : 'text-ink'}`}>
                          {notif.title}
                        </p>
                        <p className={`text-[12px] line-clamp-2 mt-0.5 leading-snug ${isDark ? 'text-[#888888]' : 'text-body'}`}>
                          {notif.message}
                        </p>
                        <p className={`text-[11px] mt-1.5 ${isDark ? 'text-[#555555]' : 'text-mute'}`}>
                          {formatTime(notif.created_at)}
                        </p>
                      </div>

                      <div className="absolute right-3 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.is_read && (
                          <button 
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className={`p-1 rounded-sm ${isDark ? 'text-[#888888] hover:bg-[#333333] hover:text-white' : 'text-mute hover:bg-canvas-soft hover:text-ink'}`}
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={(e) => handleDelete(notif.id, e)}
                          className={`p-1 rounded-sm ${isDark ? 'text-[#888888] hover:bg-error-soft/10 hover:text-error' : 'text-mute hover:bg-error-soft hover:text-error'}`}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className={`p-2 border-t text-center ${isDark ? 'border-[#222222] bg-[#0A0A0A]' : 'border-hairline bg-canvas-soft'}`}>
                <button className={`text-[12px] font-medium hover:underline ${isDark ? 'text-[#888888] hover:text-white' : 'text-mute hover:text-ink'}`}>
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
