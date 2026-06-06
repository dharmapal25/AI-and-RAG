import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api, { setAccessToken as setApiAccessToken } from './api';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { Bot, UserRound, Copy, Check, Edit3 } from 'lucide-react';
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Check if user is logged in on mount
  useEffect(() => {
    // If the backend redirected with an accessToken in the URL fragment, use it.
    const hash = window.location.hash;
    if (hash && hash.includes('accessToken=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const token = params.get('accessToken');
      if (token) {
        setApiAccessToken(token);
        // remove token from URL for cleanliness
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    checkAuthStatus();
  }, []);

  // Load chats when user logs in
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const res = await api.get('/auth/profile', { timeout: 8000 });
      if (res.data.user) {
        setUser(res.data.user);
      }
      // backend may return an accessToken; if not, try refresh endpoint
      if (res.data.accessToken) {
        setApiAccessToken(res.data.accessToken);
      } else {
        try {
          const r = await api.post('/auth/refresh-token');
          if (r.data.accessToken) setApiAccessToken(r.data.accessToken);
        } catch (e) {
          // no token available
        }
      }
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
      });

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
      const errorMsg = error.response?.data?.message || error.message || 'Error connecting to server';
      setError(errorMsg);
    } finally {
      setChatLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.get('/auth/logout');
      setApiAccessToken(null);
      setUser(null);
      setMessages([]);
      setChats([]);
      setInput('');
      setError('');
      setCurrentChatId(null);
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
          <button className="newChatBtn" onClick={newChat}>
            ➕ New Chat
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
                  onClick={() => loadChat(chat._id)}
                >
                  {chat.title}
                </button>
                <button 
                  className="deleteBtn"
                  onClick={() => deleteChat(chat._id)}
                  title="Delete chat"
                >
                  🗑️
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
    </div>
  );
};

export default App;
