"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "system" | "dark";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getTheme(): Theme {
  const t = localStorage.getItem("theme");
  return t === "light" || t === "dark" ? t : "system";
}

function setTheme(theme: Theme) {
  if (theme === "system") {
    localStorage.removeItem("theme");
    document.documentElement.removeAttribute("data-theme");
  } else {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }
  listeners.forEach((l) => l());
}

const icon = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const OPTIONS: { value: Theme; label: string; svg: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    svg: (
      <svg {...icon}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "System",
    svg: (
      <svg {...icon}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    svg: (
      <svg {...icon}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
];

export function ThemeToggle() {
  // Server snapshot is null so nothing is marked active until hydrated.
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);

  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex rounded-full border border-line bg-surface p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={theme === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => setTheme(o.value)}
          className={`grid size-7 place-items-center rounded-full transition-colors ${
            theme === o.value ? "bg-ink text-page" : "text-ink-2 hover:bg-surface-2"
          }`}
        >
          {o.svg}
        </button>
      ))}
    </div>
  );
}
