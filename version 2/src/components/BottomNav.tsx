import { Home, Sparkles, Briefcase, Settings } from 'lucide-react';
import type { AppView } from '../App';

interface BottomNavProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
}

const TABS = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'ai', label: 'AI Chat', icon: Sparkles },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: Settings },
] as const;

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
    return (
        <nav className="bottom-nav">
            {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;
                return (
                    <button
                        key={tab.id}
                        className={`bottom-nav-btn ${isActive ? 'active' : ''}`}
                        onClick={() => onNavigate(tab.id)}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
