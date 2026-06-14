import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { fetchChats, toggleChatBookmark } from '../services/chatService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme]         = useState(() => localStorage.getItem('theme') || 'dark');
  const [chats, setChats]         = useState([]);
  const [bookmarked, setBookmarked] = useState({});

  // theme DOM sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  // auth 
  useEffect(() => {
    const fallback = setTimeout(() => setAuthLoading(false), 10000);
    (async () => {
      try {
        const res = await api.get('/auth/profile', { timeout: 8000 });
        if (res.data?.user) setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
        clearTimeout(fallback);
      }
    })();
    return () => clearTimeout(fallback);
  }, []);

  const loadChats = useCallback(async () => {
    try {
      const data = await fetchChats();
      if (data.success) {
        setChats(data.chats);
        const map = {};
        data.chats.forEach(c => { map[c._id] = !!c.bookmark; });
        setBookmarked(map);
      }
    } catch (err) { console.error('loadChats:', err); }
  }, []);

  useEffect(() => { if (user) loadChats(); }, [user, loadChats]);

  const logout = async () => {
    try { await api.get('/auth/logout'); } catch { /* ignore */ }
    setUser(null); setChats([]); setBookmarked({});
  };

  const removeChat = (chatId) =>
    setChats(prev => prev.filter(c => c._id !== chatId));

  const toggleBookmark = async (chatId, ev) => {
    ev?.stopPropagation?.();
    setBookmarked(b => ({ ...b, [chatId]: !b[chatId] })); // optimistic
    try {
      const data = await toggleChatBookmark(chatId);
      if (typeof data?.chat?.bookmark === 'boolean') {
        setBookmarked(b => ({ ...b, [chatId]: data.chat.bookmark }));
        setChats(prev => prev.map(c => c._id === chatId ? data.chat : c));
      }
    } catch {
      setBookmarked(b => ({ ...b, [chatId]: !b[chatId] })); // rollback
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser, authLoading,
      theme, toggleTheme,
      chats, loadChats, removeChat,
      bookmarked, toggleBookmark,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);