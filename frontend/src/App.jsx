import axios from 'axios';
import { useEffect, useState } from 'react';
import './styles.css';
import Login from './Login';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await axiosInstance.get('/auth/profile');
      if (res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.log('Not logged in');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!input.trim()) return;

    setChatLoading(true);
    setError('');

    try {
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      setInput('');

      const res = await axiosInstance.post('/api/chat', { message: input });

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        setResponse(res.data.response);
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
      await axiosInstance.get('/auth/logout');
      setUser(null);
      setMessages([]);
      setInput('');
      setError('');
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
    return <Login API_URL={API_URL} />;
  }

  return (
    <div className="appShell">
      <div className="main">
        <div className="chatContainer">
          <div className="chatHeader">
            <h1>Chat with AI</h1>
            <div className="userInfo">
              {user.profilePicture && (
                <img src={user.profilePicture} alt={user.displayName} className="userAvatar" />
              )}
              <span>{user.displayName}</span>
              <button onClick={handleLogout} className="logoutBtn">Logout</button>
            </div>
          </div>

          <div className="messagesBox">
            {messages.length === 0 ? (
              <p className="placeholder">Start a conversation...</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <p>{msg.content}</p>
                </div>
              ))
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