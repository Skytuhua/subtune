import { IconButton } from './ui';
import { SunIcon, MoonIcon } from './icons';

/** App wordmark + theme toggle. Logo is an inline SVG (no emoji). */
export function Header({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-app items-center justify-between px-4 py-3 sm:px-6">
        <a href="." className="flex items-center gap-2.5" aria-label="SubTune home">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect x="2" y="2" width="28" height="28" rx="7" fill="rgb(var(--primary))" />
            <path
              d="M8 20c2 0 2-8 4-8s2 8 4 8 2-8 4-8 2 8 4 8"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span className="text-base font-semibold tracking-tight text-text">SubTune</span>
        </a>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/Skytuhua/subtune"
            target="_blank"
            rel="noreferrer"
            className="rounded px-3 py-1.5 text-sm text-muted transition-colors duration-150 hover:text-text"
          >
            GitHub
          </a>
          <IconButton
            label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </IconButton>
        </div>
      </div>
    </header>
  );
}
