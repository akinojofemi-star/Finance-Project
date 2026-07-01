import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Terminal } from 'lucide-react';

interface LoginModalProps {
  onGuestAccess: () => void;
}

export function LoginModal({ onGuestAccess }: LoginModalProps) {
  const [view, setView] = useState<'options' | 'login' | 'signup'>('options');
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
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        const { error } = await supabase.auth.signUp({ email, password });
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
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        margin: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          <Terminal size={32} color="var(--accent)" />
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px', fontWeight: 600 }}>
            SYNAPSE FINANCE
          </h2>
        </div>

        {view === 'options' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={() => setView('signup')}
              style={{
                padding: '16px',
                backgroundColor: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.transform = 'scale(1.02)'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.transform = 'scale(1)'}
            >
              CREATE ACCOUNT
            </button>
            <button
              onClick={() => setView('login')}
              style={{
                padding: '16px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)';
                (e.target as HTMLButtonElement).style.color = 'var(--accent)';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--border-light)';
                (e.target as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
            >
              LOG IN
            </button>
            <button
              onClick={onGuestAccess}
              style={{
                padding: '16px',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid transparent',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.color = 'var(--text-primary)'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)'}
            >
              Continue as Guest &rarr;
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>
                {view === 'login' ? 'TERMINAL LOGIN' : 'REQUEST ACCOUNT'}
              </h3>
            </div>
            
            {error && (
              <div style={{
                backgroundColor: error.includes('successful') ? 'rgba(129, 201, 149, 0.1)' : 'rgba(242, 139, 130, 0.1)',
                color: error.includes('successful') ? 'var(--positive)' : 'var(--negative)',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px',
                border: `1px solid ${error.includes('successful') ? 'var(--positive)' : 'var(--negative)'}`
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
              </div>
              
              {view === 'signup' && (
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>
                    CONFIRM PASSWORD
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--bg-color)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#749be4'; }}
                onMouseOut={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = 'var(--accent)'; }}
              >
                {loading ? 'PROCESSING...' : (view === 'login' ? 'AUTHENTICATE' : 'INITIALIZE')}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setError(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.color = 'var(--text-primary)'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)'}
              >
                {view === 'login' ? 'Need terminal access? Request an account' : 'Already have credentials? Authenticate here'}
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
                  marginTop: '8px'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.color = 'var(--text-primary)'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)'}
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
