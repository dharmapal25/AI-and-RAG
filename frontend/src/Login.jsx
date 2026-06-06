import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranchPlus } from 'lucide-react';
import api from './api';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If session cookie is present and valid, /auth/profile will return user
        const res = await api.get('/auth/profile');
        if (mounted && res.data?.user) {
          navigate('/chat/new', { replace: true });
        }
      } catch (err) {
        // not authenticated — stay on login
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div className="loginContainer">
      <div className="loginBox">
        <div className="loginHeader">
          <h1>Welcome to AI Chat</h1>
          <p>Sign in to get started</p>
        </div>

        <button 
          className="googleLoginBtn"
          onClick={handleGoogleLogin}
        >
          <GitBranchPlus/>
          Sign in with Google
        </button>

        <p className="loginFooter">
          We only support Google login for now
        </p>
      </div>
    </div>
  );
};

export default Login;
