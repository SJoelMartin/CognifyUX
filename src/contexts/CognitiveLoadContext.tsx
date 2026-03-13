import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { CLATracker, CLAConfig, createTracker } from '@/lib/cla-tracker';

interface CognitiveLoadContextValue {
  tracker: CLATracker | null;
  trackRouteChange: (from: string, to: string) => void;
  trackCustomEvent: (name: string, data?: Record<string, unknown>) => void;
  setPrivacyMode: (enabled: boolean) => void;
  getSessionId: () => string | null;
  flush: () => Promise<void>;
}

const CognitiveLoadContext = createContext<CognitiveLoadContextValue | null>(null);

interface CognitiveLoadProviderProps {
  children: React.ReactNode;
  config: Omit<CLAConfig, 'endpoint'> & { endpoint?: string };
  enabled?: boolean;
}

export const CognitiveLoadProvider: React.FC<CognitiveLoadProviderProps> = ({
  children,
  config,
  enabled = true,
}) => {
  const trackerRef = useRef<CLATracker | null>(null);
  const location = useLocation();
  const prevPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    if (!enabled) return;

    const endpoint = config.endpoint || 'http://localhost:3001/ingest-events';
    
    // Initialize tracker
    trackerRef.current = createTracker({
      ...config,
      endpoint,
    });
    trackerRef.current.init();

    return () => {
      // Cleanup on unmount
      if (trackerRef.current) {
        trackerRef.current.destroy();
        trackerRef.current = null;
      }
    };
  }, [enabled, config]);

  // Track route changes in React Router
  useEffect(() => {
    if (trackerRef.current && prevPathRef.current !== location.pathname) {
      trackerRef.current.trackRouteChange(prevPathRef.current, location.pathname);
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const trackRouteChange = useCallback((from: string, to: string) => {
    trackerRef.current?.trackRouteChange(from, to);
  }, []);

  const trackCustomEvent = useCallback((name: string, data?: Record<string, unknown>) => {
    trackerRef.current?.trackCustomEvent(name, data);
  }, []);

  const setPrivacyMode = useCallback((enabled: boolean) => {
    trackerRef.current?.setPrivacyMode(enabled);
  }, []);

  const getSessionId = useCallback(() => {
    return trackerRef.current?.getSessionId() || null;
  }, []);

  const flush = useCallback(async () => {
    await trackerRef.current?.flush();
  }, []);

  const value: CognitiveLoadContextValue = {
    tracker: trackerRef.current,
    trackRouteChange,
    trackCustomEvent,
    setPrivacyMode,
    getSessionId,
    flush,
  };

  return (
    <CognitiveLoadContext.Provider value={value}>
      {children}
    </CognitiveLoadContext.Provider>
  );
};

export const useCognitiveLoad = (): CognitiveLoadContextValue => {
  const context = useContext(CognitiveLoadContext);
  
  if (!context) {
    // Return no-op functions if used outside provider
    return {
      tracker: null,
      trackRouteChange: () => {},
      trackCustomEvent: () => {},
      setPrivacyMode: () => {},
      getSessionId: () => null,
      flush: async () => {},
    };
  }
  
  return context;
};
