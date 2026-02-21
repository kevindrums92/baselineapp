/**
 * Theme Constants
 * Constantes para las opciones de tema
 */

import { Sun, Moon, Smartphone, type LucideIcon } from 'lucide-react';
import type { Theme } from '../context/ThemeContext';

export interface ThemeOption {
  value: Theme;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    icon: Sun,
    titleKey: 'theme.light.title',
    descriptionKey: 'theme.light.description',
  },
  {
    value: 'dark',
    icon: Moon,
    titleKey: 'theme.dark.title',
    descriptionKey: 'theme.dark.description',
  },
  {
    value: 'system',
    icon: Smartphone,
    titleKey: 'theme.system.title',
    descriptionKey: 'theme.system.description',
  },
];

export const STORAGE_KEY = 'app_theme';
