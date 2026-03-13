/**
 * Cognitive Load Analyzer - Lightweight Tracking Script
 * 
 * Captures user interaction events for cognitive load analysis.
 * Designed to be <8KB gzipped, async, non-blocking.
 */

// Types
export interface CLAEvent {
  type: string;
  t: number; // timestamp relative to page load
  x?: number;
  y?: number;
  selector?: string;
  velocity?: number;
  depth?: number;
  direction?: 'up' | 'down';
  success?: boolean;
  from?: string;
  to?: string;
}

export interface CLAPayload {
  session_id: string;
  page: string;
  ts: number;
  events: CLAEvent[];
  meta: {
    ua: string;
    device: 'mobile' | 'tablet' | 'desktop';
    viewport: { width: number; height: number };
  };
}

export interface CLAConfig {
  endpoint: string;
  batchInterval?: number; // ms, default 2000
  sampleRate?: number; // 0-1, default 1
  redactSelectors?: string[]; // selectors to redact (default: input, textarea, [contenteditable])
  allowSelectors?: string[]; // override redaction for these
  privacyMode?: boolean;
  debug?: boolean;
}

// Utility functions
const generateSessionId = (): string => {
  return `anon-${crypto.randomUUID?.() || Math.random().toString(36).substring(2)}`;
};

const getDevice = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getBrowserName = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
};

const getSelector = (element: Element | null): string => {
  if (!element) return '';
  
  // ID takes priority
  if (element.id) return `#${element.id}`;
  
  // Class-based selector
  const classes = Array.from(element.classList).slice(0, 2).join('.');
  if (classes) {
    const tagName = element.tagName.toLowerCase();
    return `${tagName}.${classes}`;
  }
  
  // Tag name with nth-child
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element);
    return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
  }
  
  return element.tagName.toLowerCase();
};

const shouldRedact = (element: Element, config: CLAConfig): boolean => {
  const defaultRedact = ['input', 'textarea', '[contenteditable="true"]'];
  const redactSelectors = config.redactSelectors || defaultRedact;
  const allowSelectors = config.allowSelectors || [];
  
  // Check if explicitly allowed
  for (const selector of allowSelectors) {
    if (element.matches(selector)) return false;
  }
  
  // Check if should redact
  for (const selector of redactSelectors) {
    if (element.matches(selector)) return true;
  }
  
  return false;
};

// Main Tracker Class
export class CLATracker {
  private config: CLAConfig;
  private sessionId: string;
  private events: CLAEvent[] = [];
  private startTime: number;
  private batchTimer: number | null = null;
  private lastMousePos: { x: number; y: number; t: number } | null = null;
  private hoverStartTime: Map<string, number> = new Map();
  private isInitialized = false;
  private currentPage: string;

  constructor(config: CLAConfig) {
    this.config = {
      batchInterval: 2000,
      sampleRate: 1,
      privacyMode: false,
      debug: false,
      ...config,
    };
    
    this.sessionId = this.getOrCreateSessionId();
    this.startTime = performance.now();
    this.currentPage = window.location.pathname;
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('cla_session_id');
    if (stored) return stored;
    
    const newId = generateSessionId();
    sessionStorage.setItem('cla_session_id', newId);
    return newId;
  }

  private getRelativeTime(): number {
    return Math.round(performance.now() - this.startTime);
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[CLA]', ...args);
    }
  }

  private addEvent(event: CLAEvent): void {
    if (this.config.privacyMode) return;
    if (Math.random() > (this.config.sampleRate || 1)) return;
    
    this.events.push(event);
    this.log('Event added:', event);
  }

  private async sendBatch(): Promise<void> {
    if (this.events.length === 0) return;
    
    const payload: CLAPayload = {
      session_id: this.sessionId,
      page: this.currentPage,
      ts: Date.now(),
      events: [...this.events],
      meta: {
        ua: getBrowserName(),
        device: getDevice(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    };

    this.events = [];
    this.log('Sending batch:', payload);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      
      if (!response.ok) {
        console.error('[CLA] Failed to send batch:', response.status);
      }
    } catch (error) {
      console.error('[CLA] Error sending batch:', error);
    }
  }

  private handleClick = (e: MouseEvent): void => {
    const target = e.target as Element;
    const selector = getSelector(target);
    
    if (shouldRedact(target, this.config)) {
      this.addEvent({
        type: 'click',
        t: this.getRelativeTime(),
        selector: '[REDACTED]',
      });
    } else {
      this.addEvent({
        type: 'click',
        t: this.getRelativeTime(),
        x: e.clientX,
        y: e.clientY,
        selector,
      });
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const now = this.getRelativeTime();
    const pos = { x: e.clientX, y: e.clientY, t: now };
    
    // Calculate velocity if we have a previous position
    let velocity = 0;
    if (this.lastMousePos) {
      const dx = pos.x - this.lastMousePos.x;
      const dy = pos.y - this.lastMousePos.y;
      const dt = pos.t - this.lastMousePos.t;
      velocity = dt > 0 ? Math.round(Math.sqrt(dx * dx + dy * dy) / dt * 100) : 0;
    }
    
    // Sample mouse moves (every 100ms or significant movement)
    if (!this.lastMousePos || now - this.lastMousePos.t > 100) {
      this.addEvent({
        type: 'mousemove',
        t: now,
        x: pos.x,
        y: pos.y,
        velocity,
      });
      this.lastMousePos = pos;
    }
  };

  private handleMouseEnter = (e: MouseEvent): void => {
    const target = e.target as Element;
    if (!target || target === document.body) return;
    
    const selector = getSelector(target);
    this.hoverStartTime.set(selector, this.getRelativeTime());
    
    this.addEvent({
      type: 'hover_start',
      t: this.getRelativeTime(),
      selector: shouldRedact(target, this.config) ? '[REDACTED]' : selector,
    });
  };

  private handleMouseLeave = (e: MouseEvent): void => {
    const target = e.target as Element;
    if (!target || target === document.body) return;
    
    const selector = getSelector(target);
    const startTime = this.hoverStartTime.get(selector);
    
    if (startTime !== undefined) {
      this.addEvent({
        type: 'hover_end',
        t: this.getRelativeTime(),
        selector: shouldRedact(target, this.config) ? '[REDACTED]' : selector,
      });
      this.hoverStartTime.delete(selector);
    }
  };

  private handleScroll = (): void => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const depth = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    
    this.addEvent({
      type: 'scroll',
      t: this.getRelativeTime(),
      y: scrollTop,
      depth: Math.min(100, Math.max(0, depth)),
    });
  };

  private handleFocusIn = (e: FocusEvent): void => {
    const target = e.target as Element;
    const selector = getSelector(target);
    
    this.addEvent({
      type: 'focus_in',
      t: this.getRelativeTime(),
      selector: shouldRedact(target, this.config) ? '[REDACTED]' : selector,
    });
  };

  private handleFocusOut = (e: FocusEvent): void => {
    const target = e.target as Element;
    const selector = getSelector(target);
    
    this.addEvent({
      type: 'focus_out',
      t: this.getRelativeTime(),
      selector: shouldRedact(target, this.config) ? '[REDACTED]' : selector,
    });
  };

  private handleSubmit = (e: Event): void => {
    const target = e.target as HTMLFormElement;
    const selector = getSelector(target);
    
    this.addEvent({
      type: 'form_submit',
      t: this.getRelativeTime(),
      selector,
      success: true, // We'll update this if there's an error
    });
  };

  private handleError = (e: ErrorEvent): void => {
    this.addEvent({
      type: 'error_event',
      t: this.getRelativeTime(),
    });
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.sendBatch();
    }
  };

  private handleBeforeUnload = (): void => {
    this.sendBatch();
  };

  private handlePopState = (): void => {
    const newPage = window.location.pathname;
    
    this.addEvent({
      type: 'route_change',
      t: this.getRelativeTime(),
      from: this.currentPage,
      to: newPage,
    });
    
    this.currentPage = newPage;
    
    // Track page view
    this.addEvent({
      type: 'page_view',
      t: this.getRelativeTime(),
    });
  };

  public init(): void {
    if (this.isInitialized) return;
    
    this.log('Initializing tracker...');
    
    // Track initial page view
    this.addEvent({
      type: 'page_view',
      t: this.getRelativeTime(),
    });
    
    // Add event listeners
    document.addEventListener('click', this.handleClick, { passive: true });
    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    document.addEventListener('mouseover', this.handleMouseEnter, { passive: true });
    document.addEventListener('mouseout', this.handleMouseLeave, { passive: true });
    document.addEventListener('scroll', this.handleScroll, { passive: true });
    document.addEventListener('focusin', this.handleFocusIn, { passive: true });
    document.addEventListener('focusout', this.handleFocusOut, { passive: true });
    document.addEventListener('submit', this.handleSubmit);
    window.addEventListener('error', this.handleError);
    window.addEventListener('popstate', this.handlePopState);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Start batch timer
    this.batchTimer = window.setInterval(() => {
      this.sendBatch();
    }, this.config.batchInterval);
    
    this.isInitialized = true;
    this.log('Tracker initialized');
  }

  public destroy(): void {
    if (!this.isInitialized) return;
    
    // Remove event listeners first
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseover', this.handleMouseEnter);
    document.removeEventListener('mouseout', this.handleMouseLeave);
    document.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);
    document.removeEventListener('submit', this.handleSubmit);
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('popstate', this.handlePopState);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    
    // Clear batch timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Send remaining events after removing listeners to prevent new events
    this.sendBatch();
    
    this.isInitialized = false;
    this.log('Tracker destroyed');
  }

  public trackRouteChange(from: string, to: string): void {
    this.addEvent({
      type: 'route_change',
      t: this.getRelativeTime(),
      from,
      to,
    });
    
    this.currentPage = to;
    
    this.addEvent({
      type: 'page_view',
      t: this.getRelativeTime(),
    });
  }

  public trackCustomEvent(name: string, data?: Record<string, unknown>): void {
    this.addEvent({
      type: `custom:${name}`,
      t: this.getRelativeTime(),
      ...data,
    });
  }

  public setPrivacyMode(enabled: boolean): void {
    this.config.privacyMode = enabled;
    this.log('Privacy mode:', enabled);
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public flush(): Promise<void> {
    return this.sendBatch();
  }
}

// Factory function for easy initialization
export const createTracker = (config: CLAConfig): CLATracker => {
  return new CLATracker(config);
};
