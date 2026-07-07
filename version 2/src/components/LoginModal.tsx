import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Terminal } from 'lucide-react';

interface LoginModalProps {
  onGuestAccess: () => void;
}

export function LoginModal({ onGuestAccess }: LoginModalProps) {
  const [view, setView] = useState<'options' | 'login' | 'signup'>('options');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!fullName.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } }
        });
        if (error) throw error;
        setError('Registration successful! Please check your email to verify your account before logging in.');
        setView('login');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(6px)',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: 'clamp(24px, 5vw, 36px)',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        margin: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
          <Terminal size={28} color="var(--accent)" />
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700, letterSpacing: '-0.5px' }}>
            SYNAPSE FINANCE
          </h2>
        </div>

        {view === 'options' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setView('signup')}
              className="btn-primary"
              style={{ padding: '14px', fontSize: '15px', width: '100%' }}
            >
              Create Account
            </button>
            <button
              onClick={() => setView('login')}
              className="btn-secondary"
              style={{ padding: '14px', fontSize: '15px', width: '100%' }}
            >
              Log In
            </button>
            <button
              onClick={onGuestAccess}
              style={{
                padding: '14px',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: '4px',
                fontFamily: 'inherit'
              }}
            >
              Continue as Guest &rarr;
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '16px' }}>
                {view === 'login' ? 'Welcome back' : 'Create your account'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '6px 0 0 0' }}>
                {view === 'login' ? 'Log in to pick up where you left off.' : 'Free to join — track markets and practice trading.'}
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: error.includes('successful') ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                color: error.includes('successful') ? 'var(--positive)' : 'var(--negative)',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
                border: `1px solid ${error.includes('successful') ? 'var(--positive)' : 'var(--negative)'}`
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {view === 'signup' && (
                <div className="form-field">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="What should we call you?"
                    autoComplete="name"
                    required
                  />
                </div>
              )}
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {view === 'signup' && (
                <div className="form-field">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ marginTop: '8px', padding: '14px', fontSize: '15px', width: '100%' }}
              >
                {loading ? 'One moment...' : (view === 'login' ? 'Log In' : 'Create Account')}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'underline',
                  fontFamily: 'inherit'
                }}
              >
                {view === 'login' ? "New here? Create a free account" : 'Already have an account? Log in'}
              </button>

              <button
                type="button"
                onClick={() => { setView('options'); setError(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
              >
                &larr; Back to Options
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
