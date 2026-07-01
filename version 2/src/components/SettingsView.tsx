import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Moon, Sun, Lock, User, AlertTriangle } from 'lucide-react';

interface SettingsViewProps {
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
}

export function SettingsView({ theme, onToggleTheme }: SettingsViewProps) {
    const { user } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
    const [loading, setLoading] = useState(false);
    const [nameLoading, setNameLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const [nameMessage, setNameMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setNameMessage(null);
        setNameLoading(true);
        
        const { error } = await supabase.auth.updateUser({
            data: { full_name: displayName }
        });
        
        setNameLoading(false);
        if (error) {
            setNameMessage({ text: error.message, type: 'error' });
        } else {
            setNameMessage({ text: 'Profile updated successfully.', type: 'success' });
        }
    };

    const handleResetPortfolio = async () => {
        if (!user) return;
        const confirmReset = window.confirm("Are you sure you want to reset your portfolio? This will delete ALL your trade history and reset your balance to $100,000. This action cannot be undone.");
        if (!confirmReset) return;

        setResetLoading(true);
        try {
            // Delete all trades for the user
            await supabase.from('trades').delete().eq('user_id', user.id);
            // Reset portfolio balance
            await supabase.from('portfolios').update({ balance: 100000 }).eq('user_id', user.id);
            alert("Portfolio reset successfully!");
            // Reload page to reflect changes
            window.location.reload();
        } catch (error) {
            console.error("Error resetting portfolio", error);
            alert("Failed to reset portfolio.");
            setResetLoading(false);
        }
    };

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
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} /> PROFILE
                    </h3>
                    
                    <form onSubmit={handleUpdateName} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        {nameMessage && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: nameMessage.type === 'success' ? 'rgba(129, 201, 149, 0.1)' : 'rgba(242, 139, 130, 0.1)',
                                color: nameMessage.type === 'success' ? 'var(--positive)' : 'var(--negative)',
                                border: `1px solid ${nameMessage.type === 'success' ? 'var(--positive)' : 'var(--negative)'}`,
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}>
                                {nameMessage.text}
                            </div>
                        )}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Display Name</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input 
                                    type="text" 
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your name"
                                    style={{
                                        flex: 1, padding: '12px',
                                        backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-light)',
                                        borderRadius: '4px', color: 'var(--text-primary)'
                                    }}
                                />
                                <button 
                                    type="submit"
                                    disabled={nameLoading}
                                    style={{
                                        padding: '0 24px', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)',
                                        border: '1px solid var(--border-light)', borderRadius: '4px', fontWeight: 500,
                                        cursor: nameLoading ? 'not-allowed' : 'pointer', opacity: nameLoading ? 0.7 : 1,
                                    }}
                                >
                                    {nameLoading ? <Loader2 size={16} className="spinner" /> : 'Save'}
                                </button>
                            </div>
                        </div>
                    </form>

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

                {/* Danger Zone */}
                <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '8px', padding: '24px', border: '1px solid var(--negative)', marginTop: '24px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--negative)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={16} /> DANGER ZONE
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 500, marginBottom: '4px' }}>Reset Portfolio</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Delete all trade history and reset balance to $100,000</div>
                        </div>
                        <button 
                            onClick={handleResetPortfolio}
                            disabled={resetLoading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', backgroundColor: 'rgba(242, 139, 130, 0.1)',
                                border: '1px solid var(--negative)', borderRadius: '4px',
                                color: 'var(--negative)', cursor: resetLoading ? 'not-allowed' : 'pointer',
                                fontWeight: 500, opacity: resetLoading ? 0.7 : 1
                            }}
                        >
                            {resetLoading ? <Loader2 size={16} className="spinner" /> : 'Reset Account'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
