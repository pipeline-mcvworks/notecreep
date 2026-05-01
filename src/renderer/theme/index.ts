export type ThemeScheme = 'light' | 'dark';
export type ThemePreference = ThemeScheme | null;

const THEME_STORAGE_KEY = 'renderer.theme.preference';
const THEME_ATTRIBUTE = 'data-theme';
const THEME_CHANGE_EVENT = 'themechange';
const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

export interface ThemeChangeDetail {
  scheme: ThemeScheme;
  preference: ThemePreference;
  systemScheme: ThemeScheme;
}

export interface ThemeControllerOptions {
  shortcut?: boolean;
}

const canUseDOM = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const getMediaQuery = () => {
  if (!canUseDOM() || typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia(DARK_MODE_QUERY);
};

export const getSystemTheme = (): ThemeScheme => {
  const query = getMediaQuery();
  return query?.matches ? 'dark' : 'light';
};

export const getThemePreference = (): ThemePreference => {
  if (!canUseDOM()) {
    return null;
  }

  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
};

export const getActiveTheme = (): ThemeScheme => {
  if (!canUseDOM()) {
    return 'light';
  }

  const current = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  if (current === 'light' || current === 'dark') {
    return current;
  }

  return getThemePreference() ?? getSystemTheme();
};

const emitThemeChange = (scheme: ThemeScheme, preference: ThemePreference) => {
  if (!canUseDOM()) {
    return;
  }

  const event = new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, {
    detail: {
      scheme,
      preference,
      systemScheme: getSystemTheme(),
    },
  });

  window.dispatchEvent(event);
};

export const applyTheme = (preference: ThemePreference = getThemePreference()): ThemeScheme => {
  const scheme = preference ?? getSystemTheme();

  if (!canUseDOM()) {
    return scheme;
  }

  document.documentElement.setAttribute(THEME_ATTRIBUTE, scheme);
  document.documentElement.style.colorScheme = scheme;
  emitThemeChange(scheme, preference);

  return scheme;
};

export const setThemePreference = (preference: ThemePreference): ThemeScheme => {
  if (canUseDOM()) {
    if (preference) {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } else {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    }
  }

  return applyTheme(preference);
};

export const toggleTheme = (): ThemeScheme => {
  const nextTheme: ThemeScheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
  return setThemePreference(nextTheme);
};

export const resetThemeToSystem = (): ThemeScheme => setThemePreference(null);

export const installThemeController = (options: ThemeControllerOptions = {}) => {
  if (!canUseDOM()) {
    return () => undefined;
  }

  const { shortcut = true } = options;
  applyTheme(getThemePreference());

  const onKeyDown = (event: KeyboardEvent) => {
    if (!shortcut) {
      return;
    }

    const isThemeShortcut = event.ctrlKey && event.shiftKey && !event.altKey && event.key.toLowerCase() === 't';
    if (!isThemeShortcut) {
      return;
    }

    event.preventDefault();
    toggleTheme();
  };

  const query = getMediaQuery();
  const onSystemThemeChange = () => {
    if (getThemePreference() === null) {
      applyTheme(null);
    }
  };

  window.addEventListener('keydown', onKeyDown);

  if (query) {
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onSystemThemeChange);
    } else {
      query.addListener(onSystemThemeChange);
    }
  }

  return () => {
    window.removeEventListener('keydown', onKeyDown);

    if (!query) {
      return;
    }

    if (typeof query.removeEventListener === 'function') {
      query.removeEventListener('change', onSystemThemeChange);
    } else {
      query.removeListener(onSystemThemeChange);
    }
  };
};
