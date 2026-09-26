import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CustomCursor } from './CustomCursor';

export type CursorState = 'default' | 'link' | 'view' | 'explore' | 'drag' | 'cta' | 'hidden';
export type CursorMode = 'public' | 'operational';

interface CursorContextType {
  cursorState: CursorState;
  setCursorState: (state: CursorState) => void;
  customText: string | null;
  setCustomText: (text: string | null) => void;
  isEnabled: boolean;
  cursorMode: CursorMode;
}

const CursorContext = createContext<CursorContextType>({
  cursorState: 'default',
  setCursorState: () => {},
  customText: null,
  setCustomText: () => {},
  isEnabled: false,
  cursorMode: 'public',
});

export const useCursor = () => useContext(CursorContext);

export interface CursorProviderProps {
  children: React.ReactNode;
}

export const CursorProvider: React.FC<CursorProviderProps> = ({ children }) => {
  const [cursorState, setCursorState] = useState<CursorState>('default');
  const [customText, setCustomText] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const location = useLocation();

  // Internal operational routes receive restrained operational cursor mode
  const isOperationalRoute =
    location.pathname.startsWith('/receptionist') ||
    location.pathname.startsWith('/therapist') ||
    location.pathname.startsWith('/fb') ||
    location.pathname.startsWith('/manager') ||
    location.pathname.startsWith('/admin');

  const cursorMode: CursorMode = isOperationalRoute ? 'operational' : 'public';

  useEffect(() => {
    const fineQuery = window.matchMedia('(pointer: fine) and (hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluateCursor = () => {
      const finePointer = fineQuery.matches;
      const reducedMotion = motionQuery.matches;

      // Enable cursor on desktop fine pointer devices without reduced motion
      if (finePointer && !reducedMotion) {
        setIsEnabled(true);
        document.body.classList.add('hsw-custom-cursor-active');
        if (isOperationalRoute) {
          document.body.classList.add('hsw-cursor-operational');
        } else {
          document.body.classList.remove('hsw-cursor-operational');
        }
      } else {
        setIsEnabled(false);
        document.body.classList.remove('hsw-custom-cursor-active');
        document.body.classList.remove('hsw-cursor-operational');
      }
    };

    evaluateCursor();

    if (fineQuery.addEventListener) {
      fineQuery.addEventListener('change', evaluateCursor);
      motionQuery.addEventListener('change', evaluateCursor);
    }

    return () => {
      if (fineQuery.removeEventListener) {
        fineQuery.removeEventListener('change', evaluateCursor);
        motionQuery.removeEventListener('change', evaluateCursor);
      }
      document.body.classList.remove('hsw-custom-cursor-active');
      document.body.classList.remove('hsw-cursor-operational');
    };
  }, [isOperationalRoute]);

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
        isEnabled,
        cursorMode,
      }}
    >
      {isEnabled && <CustomCursor />}
      {children}
    </CursorContext.Provider>
  );
};
