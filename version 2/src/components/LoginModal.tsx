import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Terminal } from 'lucide-react';

export function LoginModal() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Auto-login or show success message for signup
        setError('Signup successful! You can now log in.');
        setIsLogin(true);
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
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <Terminal size={32} color="var(--accent)" />
          <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px', fontWeight: 600 }}>
            {isLogin ? 'TERMINAL LOGIN' : 'CREATE ACCOUNT'}
          </h2>
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
            {loading ? 'PROCESSING...' : (isLogin ? 'AUTHENTICATE' : 'INITIALIZE')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
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
            {isLogin ? 'Need terminal access? Request an account' : 'Already have credentials? Authenticate here'}
          </button>
        </div>
      </div>
    </div>
  );
}
