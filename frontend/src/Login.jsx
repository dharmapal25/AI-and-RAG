import './styles.css';

const Login = ({ API_URL }) => {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
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
