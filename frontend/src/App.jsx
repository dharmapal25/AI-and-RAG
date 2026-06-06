import { useEffect, useState } from 'react';
import { Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Bot, UserRound, Copy, Check, Edit3, Plus, PlusIcon, Delete, DeleteIcon, LucideDelete } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import './styles.css';
import Login from './Login';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatTitle, setCurrentChatTitle] = useState('New Chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Load chats when user logs in
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // respond to route params: /chat/new, /chat/:id and /chat/:id/delete
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const routeId = params.id;
    const action = params.action;
    if (!user) return; // wait until authenticated

    // support explicit /chat/new route (no :id param)
    if (location.pathname === '/chat/new' || routeId === 'new') {
      newChat();
      return;
    }

    if (routeId && action === 'delete') {
      // open confirmation modal instead of immediate delete
      setDeleteTargetId(routeId);
      setShowDeleteConfirm(true);
      return;
    }

    if (routeId) {
      loadChat(routeId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, params.action, user]);

  const checkAuthStatus = async () => {
    try {
      const res = await api.get('/auth/profile', { timeout: 8000 });
      if (res.data.user) setUser(res.data.user);
    } catch (err) {
      console.error('Auth check failed:', err?.response?.data || err.message || err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // safety fallback: if auth check hangs for any reason, stop showing the loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const loadChats = async () => {
    try {
      const res = await api.get('/api/chats');
      if (res.data.success) {
        setChats(res.data.chats);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const loadChat = async (chatId) => {
    try {
      const res = await api.get(`/api/chat/${chatId}`);
      if (res.data.success) {
        setCurrentChatId(chatId);
        setMessages(res.data.chat.messages);
        setCurrentChatTitle(res.data.chat.title);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    }
  };

  const newChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setCurrentChatTitle('New Chat');
    setInput('');
    setError('');
  };

  const deleteChat = async (chatId) => {
    try {
      await api.delete(`/api/chat/${chatId}`);
      setChats(chats.filter(c => c._id !== chatId));
      if (currentChatId === chatId) {
        newChat();
      }
      loadChats();
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteChat(deleteTargetId);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      navigate('/chat/new');
    } catch (err) {
      console.error('Confirm delete failed', err);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    // return to a safe route
    navigate('/chat/new');
  };

  const handleChat = async () => {
    if (!input.trim()) return;

    setChatLoading(true);
    setError('');

    try {
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      const userMessage = input;
      setInput('');

      const res = await api.post('/api/chat', { 
        message: userMessage,
        chatId: currentChatId 
      }, { timeout: 40000 }); // 40s timeout for AI response

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        
        // If this is a new chat, update chatId
        if (!currentChatId) {
          setCurrentChatId(res.data.chatId);
          setCurrentChatTitle(userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''));
        }
        
        loadChats();
      } else {
        setError(res.data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error fetching chat response:', error);
      // detect axios timeout
      const isTimeout = error?.code === 'ECONNABORTED' || (error?.message && error.message.toLowerCase().includes('timeout'));
      if (isTimeout) {
        setError('AI response timed out (40s). Please try again.');
      } else {
        const errorMsg = error.response?.data?.message || error.message || 'Error connecting to server';
        setError(errorMsg);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.get('/auth/logout');
      // session cookie cleared on server; no client tokens to clear
      setUser(null);
      setMessages([]);
      setChats([]);
      setInput('');
      setError('');
      setCurrentChatId(null);
      // tokens are kept in memory; nothing to remove from localStorage
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  if (loading) {
    return (
      <div className="appShell">
        <div className="main">
          <div className="loadingContainer">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="appShell">
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebarTop">
          <button className="newChatBtn"
           onClick={() => navigate('/chat/new')}>
            <PlusIcon /> New Chat
          </button>
        </div>

        <div className="chatList">
          <div className="chatsLabel">Chat History</div>
          {chats.length === 0 ? (
            <p className="noChats">No chats yet</p>
          ) : (
            chats.map(chat => (
              <div 
                key={chat._id} 
                className={`chatItem ${currentChatId === chat._id ? 'active' : ''}`}
              >
                <button 
                  className="chatItemBtn"
                  onClick={() => navigate(`/chat/${chat._id}`)}
                >
                  {chat.title}
                </button>
                <button 
                  className="deleteBtn"
                  onClick={() => {
                    setDeleteTargetId(chat._id);
                    setShowDeleteConfirm(true);
                    navigate(`/chat/${chat._id}/delete`);
                  }}
                  title="Delete chat"
                >
                  <LucideDelete />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebarFooter">
          <div className="userProfile">
            {user.profilePicture && (
              <img src={user.profilePicture} alt={user.displayName} />
            )}
            <span>{user.displayName}</span>
          </div>
          <button onClick={handleLogout} className="logoutBtn">Logout</button>
        </div>
      </div>

      <div className="main">
        <div className="chatContainer">
          <div className="chatHeader">
            <button 
              className="menuToggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1>{currentChatTitle}</h1>
          </div>
          
          <div className="messagesBox">
            {messages.length === 0 ? (
              <p className="placeholder">Start a conversation...</p>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isLoading = !isUser && chatLoading && idx === messages.length - 1;
                return (
                  <article key={`${msg.role}-${idx}`} className={`message ${isUser ? 'fromUser' : 'fromAssistant'}`}>
                    <div className={isUser ? 'avatar userAvatar' : 'avatar assistantAvatar'}>
                      {isUser ? <UserRound size={17} /> : <Bot size={18} />}
                    </div>
                    <div className="messageBody">
                      {isLoading ? (
                        <div className="loadingDots" aria-label="Assistant is typing">
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : isUser ? (
                        <p>{msg.content}</p>
                      ) : (
                        <div className="markdownResponse">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {!isUser && !isLoading && (
                        <div className="messageActions" aria-label="Message actions">
                          <button type="button" aria-label="Copy response"><Copy size={15} /></button>
                          <button type="button" aria-label="Mark useful"><Check size={15} /></button>
                          <button type="button" aria-label="Edit response"><Edit3 size={15} /></button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {error && <div className="error">{error}</div>}

          <div className="inputBox">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={chatLoading}
            />
            <button 
              onClick={handleChat} 
              disabled={chatLoading || !input.trim()}
            >
              {chatLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
      {showDeleteConfirm && (
        <div className="modalOverlay">
          <div className="modal">
            <h3>Delete chat?</h3>
            <p>Are you sure you want to permanently delete this chat? This action cannot be undone.</p>
            <div className="modalActions">
              <button className="cancelBtn" onClick={cancelDelete}>Cancel</button>
              <button className="confirmBtn" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
