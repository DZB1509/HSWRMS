import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { CustomCursor } from './CustomCursor';

export type CursorState = 'default' | 'link' | 'view' | 'explore' | 'drag' | 'cta' | 'hidden';
export type CursorMode = 'public' | 'operational';

export const CURSOR_STORAGE_KEY = 'hswrms-cursor-effect';

export interface CursorContextType {
  cursorState: CursorState;
  setCursorState: (state: CursorState) => void;
  customText: string | null;
  setCustomText: (text: string | null) => void;
  isEnabled: boolean;
  cursorEnabled: boolean;
  setCursorEnabled: (enabled: boolean) => void;
  toggleCursor: () => void;
  cursorMode: CursorMode;
}

const CursorContext = createContext<CursorContextType>({
  cursorState: 'default',
  setCursorState: () => {},
  customText: null,
  setCustomText: () => {},
  isEnabled: true,
  cursorEnabled: true,
  setCursorEnabled: () => {},
  toggleCursor: () => {},
  cursorMode: 'public',
});

export const useCursor = () => useContext(CursorContext);

export interface CursorProviderProps {
  children: React.ReactNode;
}

const getInitialCursorSetting = (): boolean => {
  try {
    const val = localStorage.getItem(CURSOR_STORAGE_KEY);
    if (val === 'disabled') return false;
    if (val === 'enabled') return true;
  } catch (e) {
    // safe fallback
  }
  return true; // Default ON
};

export const CursorProvider: React.FC<CursorProviderProps> = ({ children }) => {
  const [cursorState, setCursorState] = useState<CursorState>('default');
  const [customText, setCustomText] = useState<string | null>(null);
  const [cursorEnabled, setCursorEnabledState] = useState<boolean>(getInitialCursorSetting);
  const location = useLocation();

  // Internal operational routes receive restrained operational cursor mode
  const isOperationalRoute =
    location.pathname.startsWith('/receptionist') ||
    location.pathname.startsWith('/therapist') ||
    location.pathname.startsWith('/fb') ||
    location.pathname.startsWith('/manager') ||
    location.pathname.startsWith('/admin');

  const cursorMode: CursorMode = isOperationalRoute ? 'operational' : 'public';

  const setCursorEnabled = useCallback((enabled: boolean) => {
    setCursorEnabledState(enabled);
    try {
      localStorage.setItem(CURSOR_STORAGE_KEY, enabled ? 'enabled' : 'disabled');
    } catch (e) {
      // safe fallback
    }
  }, []);

  const toggleCursor = useCallback(() => {
    setCursorEnabled(!cursorEnabled);
  }, [cursorEnabled, setCursorEnabled]);

  useEffect(() => {
    const fineQuery = window.matchMedia('(pointer: fine) and (hover: hover)');

    const evaluateCursorClasses = () => {
      const finePointer = fineQuery.matches;

      // On desktop with fine pointer, hide native cursor only when Cursor FX is enabled
      if (cursorEnabled && finePointer) {
        document.body.classList.add('hsw-custom-cursor-active');
        if (isOperationalRoute) {
          document.body.classList.add('hsw-cursor-operational');
        } else {
          document.body.classList.remove('hsw-cursor-operational');
        }
      } else {
        document.body.classList.remove('hsw-custom-cursor-active');
        document.body.classList.remove('hsw-cursor-operational');
      }
    };

    evaluateCursorClasses();

    if (fineQuery.addEventListener) {
      fineQuery.addEventListener('change', evaluateCursorClasses);
    }

    return () => {
      if (fineQuery.removeEventListener) {
        fineQuery.removeEventListener('change', evaluateCursorClasses);
      }
      document.body.classList.remove('hsw-custom-cursor-active');
      document.body.classList.remove('hsw-cursor-operational');
    };
  }, [cursorEnabled, isOperationalRoute]);

  // Reset cursor state on route change
  useEffect(() => {
    setCursorState('default');
    setCustomText(null);
  }, [location.pathname]);

  return (
    <CursorContext.Provider
      value={{
        cursorState,
        setCursorState,
        customText,
        setCustomText,
        isEnabled: cursorEnabled,
        cursorEnabled,
        setCursorEnabled,
        toggleCursor,
        cursorMode,
      }}
    >
      {cursorEnabled && <CustomCursor />}
      {children}
    </CursorContext.Provider>
  );
};
