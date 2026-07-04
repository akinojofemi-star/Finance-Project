import { Moon, Sun, Stars, Terminal, Coffee, Waves, type LucideIcon } from 'lucide-react';

export type ThemeId = 'dark' | 'light' | 'midnight' | 'terminal' | 'sepia' | 'ocean';

export interface ThemeMeta {
    id: ThemeId;
    label: string;
    description: string;
    icon: LucideIcon;
    swatch: string;
    bodyClass: string;
}

export const THEMES: ThemeMeta[] = [
    {
        id: 'dark',
        label: 'Dark',
        description: 'Default Apple-inspired dark',
        icon: Moon,
        swatch: '#000000',
        bodyClass: '',
    },
    {
        id: 'light',
        label: 'Light',
        description: 'Clean daylight mode',
        icon: Sun,
        swatch: '#f8fafc',
        bodyClass: 'theme-light',
    },
    {
        id: 'midnight',
        label: 'Midnight',
        description: 'Deep navy for late nights',
        icon: Stars,
        swatch: '#0b1220',
        bodyClass: 'theme-midnight',
    },
    {
        id: 'terminal',
        label: 'Terminal',
        description: 'Green-on-black hacker vibe',
        icon: Terminal,
        swatch: '#0a1a0a',
        bodyClass: 'theme-terminal',
    },
    {
        id: 'sepia',
        label: 'Sepia',
        description: 'Warm easy-on-the-eyes cream',
        icon: Coffee,
        swatch: '#f4ecd8',
        bodyClass: 'theme-sepia',
    },
    {
        id: 'ocean',
        label: 'Ocean',
        description: 'Cool teal & deep sea',
        icon: Waves,
        swatch: '#0f2a3a',
        bodyClass: 'theme-ocean',
    },
];

const CLASS_LIST = THEMES.map(t => t.bodyClass).filter(Boolean);

export function applyThemeToBody(id: ThemeId) {
    document.body.classList.remove(...CLASS_LIST);
    const theme = THEMES.find(t => t.id === id);
    if (theme && theme.bodyClass) {
        document.body.classList.add(theme.bodyClass);
    }
}
