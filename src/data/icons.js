/**
 * Icon registry — maps a stored `iconKey` string to a lucide component.
 * Named imports keep this tree-shakeable; only these icons ship.
 */
import {
  Code2, Binary, Network, Sparkles, MessagesSquare, Hash, Smartphone,
  BookOpen, Brain, Database, Cpu, Globe, Layers, Terminal, PenTool,
  Rocket, Target, Trophy, Server, Cloud, GitBranch, Bug,
} from 'lucide-react';

export const ICONS = {
  Code2, Binary, Network, Sparkles, MessagesSquare, Hash, Smartphone,
  BookOpen, Brain, Database, Cpu, Globe, Layers, Terminal, PenTool,
  Rocket, Target, Trophy, Server, Cloud, GitBranch, Bug,
};

/** Keys offered in the "Add Subject" icon picker. */
export const ICON_KEYS = Object.keys(ICONS);

/** Safe lookup — unknown keys degrade to a neutral book icon. */
export function getIcon(key) {
  return ICONS[key] || BookOpen;
}

export const COLOR_KEYS = [
  { key: 'primary', label: 'Violet' },
  { key: 'secondary', label: 'Pink' },
  { key: 'accent', label: 'Orange' },
];
