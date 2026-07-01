import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Moon, Sun, Lock } from 'lucide-react';

interface SettingsViewProps {
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
}

export function SettingsView({ theme, onToggleTheme }: SettingsViewProps) {
    const { user } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ text: 'Passwords do not match.', type: 'error' });
            return;
        }

        if (password.length < 6) {
            setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            setMessage({ text: error.message, type: 'error' });
        } else {
            setMessage({ text: 'Password updated successfully.', type: 'success' });
            setPassword('');
            setConfirmPassword('');
        }
    };

    if (!user) {
        return (
            <div style={{ flex: 1, padding: '32px', display: 'flex', justifyContent: 'center' }}>
                Please log in to view settings.
            </div>
        );
    }

    return (
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: 'var(--bg-color)' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '32px' }}>Account Settings</h2>

                {/* Profile Info */}
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '8px', padding: '24px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>PROFILE</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Email Address</span>
                            <span style={{ fontWeight: 500 }}>{user.email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Account Created</span>
                            <span style={{ fontWeight: 500 }}>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '8px', padding: '24px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>APPEARANCE</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 500, marginBottom: '4px' }}>Theme Preference</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Toggle between light and dark mode</div>
                        </div>
                        <button 
                            onClick={onToggleTheme}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', backgroundColor: 'transparent',
                                border: '1px solid var(--border-light)', borderRadius: '4px',
                                color: 'var(--text-primary)', cursor: 'pointer'
                            }}
                        >
                            {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
                        </button>
                    </div>
                </div>

                {/* Security */}
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '8px', padding: '24px', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={16} /> SECURITY
                    </h3>
                    
                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontWeight: 500 }}>Change Password</div>
                        
                        {message && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: message.type === 'success' ? 'rgba(129, 201, 149, 0.1)' : 'rgba(242, 139, 130, 0.1)',
                                color: message.type === 'success' ? 'var(--positive)' : 'var(--negative)',
                                border: `1px solid ${message.type === 'success' ? 'var(--positive)' : 'var(--negative)'}`,
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>New Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '12px',
                                    backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)',
                                    borderRadius: '4px', color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Confirm New Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '12px',
                                    backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)',
                                    borderRadius: '4px', color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px', backgroundColor: 'var(--accent)', color: '#000',
                                border: 'none', borderRadius: '4px', fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                                marginTop: '8px', display: 'flex', justifyContent: 'center'
                            }}
                        >
                            {loading ? <Loader2 size={18} className="spinner" /> : 'UPDATE PASSWORD'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
