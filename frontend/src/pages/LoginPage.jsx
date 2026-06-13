// src/pages/LoginPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../style/styles.css';

const API_URL   = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const VIDEO_URL = 'https://ik.imagekit.io/cblndrocc/AI_bot.mp4';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path d="M47.5 24.6c0-1.6-.1-3.2-.4-4.7H24.2v8.9h13.1c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.2-10.6 7.2-17.4z" fill="#4285F4"/>
    <path d="M24.2 48c6.5 0 12-2.2 16-5.9l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.7v6.2C6.7 42.8 14.9 48 24.2 48z" fill="#34A853"/>
    <path d="M10.8 28.5c-.5-1.5-.8-3-.8-4.5s.3-3 .8-4.5V13.3H2.7C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l8.1-6.2z" fill="#FBBC05"/>
    <path d="M24.2 9.6c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C36.2 2.4 30.7 0 24.2 0 14.9 0 6.7 5.2 2.7 13.3l8.1 6.2c1.9-5.7 7.2-9.9 13.4-9.9z" fill="#EA4335"/>
  </svg>
);

const VideoSkeleton = () => (
  <div className="lp-videoSkeleton">
    <div className="lp-shimmerWave" />
    <div className="lp-loadingLabel">Loading preview…</div>
  </div>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const [videoReady,    setVideoReady]    = useState(false);
  const [videoError,    setVideoError]    = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError,   setGoogleError]   = useState(false);

  /* redirect if already logged in */
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

  const handleGoogleLogin = () => {
    if (googleLoading) return;          // double-click guard
    setGoogleLoading(true);
    setGoogleError(false);

    // If navigation hasn't happened in 10s → backend down → show error, re-enable
    const timeout = setTimeout(() => {
      setGoogleLoading(false);
      setGoogleError(true);
    }, 10000);

    window.location.href = `${API_URL}/auth/google`;
    // on successful redirect component unmounts → timeout never fires
    return () => clearTimeout(timeout);
  };

  return (
    <div className="lp-root">

      {/* ── LEFT — Video ── */}
      <div className="lp-videoPanel">
        <div className="lp-glow" />
        {!videoReady && !videoError && <VideoSkeleton />}
        {videoError && (
          <div className="lp-videoError">
            <span>⚡</span>
            <p>Flash GPT</p>
          </div>
        )}
        <video
          className={`lp-video ${videoReady ? 'lp-videoVisible' : 'lp-videoHidden'}`}
          src={VIDEO_URL}
          autoPlay loop muted playsInline preload="auto"
          onCanPlay={()  => setVideoReady(true)}
          onError={()    => { setVideoError(true); setVideoReady(false); }}
        />
      </div>

      {/* ── RIGHT — Login form ── */}
      <div className="lp-formPanel">

        <div className="lp-brand">
          <span className="lp-brandIcon">⚡</span>
          <span className="lp-brandName">Flash GPT</span>
        </div>

        <div className="lp-hero">
          <h1 className="lp-tagline">Your AI,<br />built for builders.</h1>
          <p className="lp-subtitle">Chat smarter. Code faster. Ship better.</p>
        </div>

        <div className="lp-card">
          <button
            className={`lp-googleBtn ${googleLoading ? 'lp-btnLoading' : ''} ${googleError ? 'lp-btnError' : ''}`}
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <>
                <span className="lp-spinner" />
                Redirecting…
              </>
            ) : googleError ? (
              <>
                <GoogleIcon />
                Try again
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          {googleError && (
            <p className="lp-errorMsg">Could not connect. Check your connection and try again.</p>
          )}
        </div>

        <p className="lp-footer">We only support Google login for now</p>
      </div>
    </div>
  );
};

export default LoginPage;