import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Lock, User, AlertTriangle, Check } from 'lucide-react';
import { THEMES, type ThemeId } from '../themes';

interface SettingsViewProps {
    theme: ThemeId;
    onSelectTheme: (theme: ThemeId) => void;
}

export function SettingsView({ theme, onSelectTheme }: SettingsViewProps) {
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
            await supabase.from('trades').delete().eq('user_id', user.id);
            await supabase.from('portfolios').update({ balance: 100000 }).eq('user_id', user.id);
            alert("Portfolio reset successfully!");
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
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="empty-state">Please log in to view settings.</div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-inner" style={{ maxWidth: '640px' }}>
                <h2 className="page-title">Account Settings</h2>

                {/* Profile */}
                <div className="card-panel">
                    <h3 className="section-heading">
                        <User size={14} /> PROFILE
                    </h3>

                    <form onSubmit={handleUpdateName} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                        {nameMessage && (
                            <div style={{
                                padding: '12px 14px',
                                backgroundColor: nameMessage.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                color: nameMessage.type === 'success' ? 'var(--positive)' : 'var(--negative)',
                                border: `1px solid ${nameMessage.type === 'success' ? 'var(--positive)' : 'var(--negative)'}`,
                                borderRadius: '8px',
                                fontSize: '13px'
                            }}>
                                {nameMessage.text}
                            </div>
                        )}
                        <div className="form-field">
                            <label className="form-label">Display Name</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your name"
                                    style={{ flex: 1, minWidth: '180px' }}
                                />
                                <button type="submit" disabled={nameLoading} className="btn-secondary">
                                    {nameLoading ? <Loader2 size={16} className="spinner" /> : 'Save'}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div>
                        <div className="card-row">
                            <span className="card-row-label">Email Address</span>
                            <span className="card-row-value">{user.email}</span>
                        </div>
                        <div className="card-row">
                            <span className="card-row-label">Account Created</span>
                            <span className="card-row-value">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="card-panel">
                    <h3 className="section-heading">APPEARANCE</h3>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Theme</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Pick a palette. Your choice is saved to this browser.
                    </div>
                    <div className="theme-grid">
                        {THEMES.map(t => {
                            const Icon = t.icon;
                            const isActive = t.id === theme;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => onSelectTheme(t.id)}
                                    className={`theme-tile ${isActive ? 'active' : ''}`}
                                >
                                    <span className="theme-tile-swatch" style={{ backgroundColor: t.swatch }}>
                                        <Icon size={18} className="theme-tile-icon" />
                                        {isActive && <Check size={14} className="theme-tile-check" />}
                                    </span>
                                    <span className="theme-tile-name">{t.label}</span>
                                    <span className="theme-tile-desc">{t.description}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Security */}
                <div className="card-panel">
                    <h3 className="section-heading">
                        <Lock size={14} /> SECURITY
                    </h3>

                    <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontWeight: 600 }}>Change Password</div>

                        {message && (
                            <div style={{
                                padding: '12px 14px',
                                backgroundColor: message.type === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                color: message.type === 'success' ? 'var(--positive)' : 'var(--negative)',
                                border: `1px solid ${message.type === 'success' ? 'var(--positive)' : 'var(--negative)'}`,
                                borderRadius: '8px',
                                fontSize: '13px'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <div className="form-field">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '4px' }}>
                            {loading ? <Loader2 size={16} className="spinner" /> : 'Update Password'}
                        </button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="card-panel" style={{ borderColor: 'var(--negative)' }}>
                    <h3 className="section-heading" style={{ color: 'var(--negative)' }}>
                        <AlertTriangle size={14} /> DANGER ZONE
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Reset Portfolio</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Delete all trade history and reset balance to $100,000</div>
                        </div>
                        <button onClick={handleResetPortfolio} disabled={resetLoading} className="btn-danger">
                            {resetLoading ? <Loader2 size={16} className="spinner" /> : 'Reset Account'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
