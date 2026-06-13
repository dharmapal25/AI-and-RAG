import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../style/styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/auth/profile');
        if (mounted && res.data?.user) navigate('/chat/new', { replace: true });
      } catch { /* not logged in */ }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div className="loginContainer">
      <div className="loginBox">
        <div className="loginHeader">
          <h1>Welcome to Flash GPT</h1>
          <p>Sign in to get started</p>
        </div>
        <button className="googleLoginBtn" onClick={() => (window.location.href = `${API_URL}/auth/google`)}>
          <img src="https://ik.imagekit.io/cblndrocc/search.png" alt="Google Login" width="20" height="20" />
          Sign in with Google
        </button>
        <p className="loginFooter">Google login only for now</p>
      </div>
    </div>
  );
};

export default LoginPage;