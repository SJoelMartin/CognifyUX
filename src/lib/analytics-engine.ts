/**
 * Cognitive Load Analytics Engine
 * 
 * Processes raw event data to compute cognitive load scores,
 * detect friction signals, and identify UX hotspots.
 */

import { supabase } from "@/integrations/supabase/client";

// Types
export interface CLAEventRow {
  id: string;
  session_id: string;
  page_url: string;
  event_type: string;
  event_data: Record<string, unknown>;
  client_timestamp: number;
  device_type: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  user_agent: string | null;
  created_at: string;
}

export interface Signal {
  type: 'hesitation' | 'rage_click' | 'backtracking' | 'scroll_anomaly' | 'rapid_fire' | 'error_attempt';
  selector?: string;
  page: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
}

export interface Hotspot {
  id: string;
  selector: string;
  page: string;
  signalType: string;
  severity: 'low' | 'medium' | 'high';
  occurrences: number;
  avgMetric: number;
  description: string;
  suggestion: string;
}

export interface SessionAnalysis {
  sessionId: string;
  page: string;
  score: number;
  duration: number;
  signalCount: number;
  signals: Signal[];
  deviceType: string;
  timestamp: string;
}

export interface PageAnalysis {
  page: string;
  avgScore: number;
  sessionCount: number;
  signalCount: number;
  trend: number;
}

export interface AnalyticsSummary {
  overallScore: number;
  totalSessions: number;
  totalSignals: number;
  hotspotCount: number;
  scoreTrend: number;
}

// Scoring weights (tunable)
const WEIGHTS = {
  alpha: 0.25,  // decision time
  beta: 0.25,   // interaction density
  gamma: 0.2,   // error rate
  delta: 0.2,   // navigation complexity
  epsilon: 0.1, // task completion (reward)
};

// Thresholds for signal detection
const THRESHOLDS = {
  hesitationMs: 500,        // Gap >500ms between hover and click
  rageClickCount: 3,        // 3+ clicks on same selector
  rageClickWindowMs: 2000,  // within 2 seconds
  backtrackWindowMs: 10000, // Navigation reversal within 10s
  scrollAnomalyCount: 3,    // 3+ up-down scrolls in same region
  rapidFireEventsPerMin: 60, // High event density
};

// Sigmoid function for score normalization
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

// Clamp value between min and max
const clamp = (value: number, min: number, max: number): number => 
  Math.min(max, Math.max(min, value));

/**
 * Detect decision hesitation signals
 * Gap >500ms between mouseenter and click on same selector
 */
function detectHesitation(events: CLAEventRow[]): Signal[] {
  const signals: Signal[] = [];
  const hoverStarts: Map<string, { timestamp: number; page: string }> = new Map();

  for (const event of events) {
    const data = event.event_data as Record<string, unknown>;
    const selector = data?.selector as string;
    
    if (event.event_type === 'hover_start' && selector) {
      hoverStarts.set(selector, { 
        timestamp: event.client_timestamp, 
        page: event.page_url 
      });
    } else if (event.event_type === 'click' && selector) {
      const hoverStart = hoverStarts.get(selector);
      if (hoverStart) {
        const hesitationTime = event.client_timestamp - hoverStart.timestamp;
        if (hesitationTime > THRESHOLDS.hesitationMs) {
          signals.push({
            type: 'hesitation',
            selector,
            page: event.page_url,
            timestamp: event.client_timestamp,
            severity: hesitationTime > 2000 ? 'high' : hesitationTime > 1000 ? 'medium' : 'low',
            details: { hesitationMs: hesitationTime },
          });
        }
        hoverStarts.delete(selector);
      }
    }
  }

  return signals;
}

/**
 * Detect rage clicks
 * 3+ clicks on same selector within 2 seconds
 */
function detectRageClicks(events: CLAEventRow[]): Signal[] {
  const signals: Signal[] = [];
  const clicksBySelector: Map<string, number[]> = new Map();

  for (const event of events) {
    if (event.event_type !== 'click') continue;
    
    const data = event.event_data as Record<string, unknown>;
    const selector = data?.selector as string;
    if (!selector) continue;

    const clicks = clicksBySelector.get(selector) || [];
    clicks.push(event.client_timestamp);
    
    // Keep only clicks within the window
    const recentClicks = clicks.filter(
      t => event.client_timestamp - t < THRESHOLDS.rageClickWindowMs
    );
    clicksBySelector.set(selector, recentClicks);

    if (recentClicks.length >= THRESHOLDS.rageClickCount) {
      signals.push({
        type: 'rage_click',
        selector,
        page: event.page_url,
        timestamp: event.client_timestamp,
        severity: recentClicks.length >= 5 ? 'high' : 'medium',
        details: { clickCount: recentClicks.length },
      });
      clicksBySelector.set(selector, []); // Reset to avoid duplicate signals
    }
  }

  return signals;
}

/**
 * Detect backtracking
 * Navigation reversal within 10 seconds after a forward action
 */
function detectBacktracking(events: CLAEventRow[]): Signal[] {
  const signals: Signal[] = [];
  const routeHistory: { from: string; to: string; timestamp: number }[] = [];

  for (const event of events) {
    if (event.event_type !== 'route_change') continue;
    
    const data = event.event_data as Record<string, unknown>;
    const from = data?.from as string;
    const to = data?.to as string;
    
    if (!from || !to) continue;

    // Check if this is a backtrack (going back to a previous page)
    const recentRoutes = routeHistory.filter(
      r => event.client_timestamp - r.timestamp < THRESHOLDS.backtrackWindowMs
    );

    for (const route of recentRoutes) {
      if (route.from === to) {
        signals.push({
          type: 'backtracking',
          page: event.page_url,
          timestamp: event.client_timestamp,
          severity: 'medium',
          details: { from, to, originalRoute: route },
        });
      }
    }

    routeHistory.push({ from, to, timestamp: event.client_timestamp });
  }

  return signals;
}

/**
 * Detect scroll anomalies
 * Repeated up-down scrolling in same region
 */
function detectScrollAnomalies(events: CLAEventRow[]): Signal[] {
  const signals: Signal[] = [];
  const scrollEvents = events.filter(e => e.event_type === 'scroll');
  
  if (scrollEvents.length < 3) return signals;

  let directionChanges = 0;
  let lastDirection: 'up' | 'down' | null = null;
  let lastY = 0;

  for (const event of scrollEvents) {
    const data = event.event_data as Record<string, unknown>;
    const y = (data?.y as number) || 0;
    const direction = y > lastY ? 'down' : 'up';

    if (lastDirection && direction !== lastDirection) {
      directionChanges++;
    }

    if (directionChanges >= THRESHOLDS.scrollAnomalyCount) {
      signals.push({
        type: 'scroll_anomaly',
        page: event.page_url,
        timestamp: event.client_timestamp,
        severity: directionChanges >= 6 ? 'high' : 'medium',
        details: { directionChanges, scrollY: y },
      });
      directionChanges = 0; // Reset
    }

    lastDirection = direction;
    lastY = y;
  }

  return signals;
}

/**
 * Detect rapid-fire interactions
 * Unusually high event density indicating stress/confusion
 */
function detectRapidFire(events: CLAEventRow[]): Signal[] {
  const signals: Signal[] = [];
  if (events.length < 10) return signals;

  // Calculate events per minute
  const firstTimestamp = events[0].client_timestamp;
  const lastTimestamp = events[events.length - 1].client_timestamp;
  const durationMinutes = (lastTimestamp - firstTimestamp) / 60000;
  
  if (durationMinutes < 0.1) return signals; // Too short to analyze

  const eventsPerMinute = events.length / durationMinutes;

  if (eventsPerMinute > THRESHOLDS.rapidFireEventsPerMin) {
    signals.push({
      type: 'rapid_fire',
      page: events[0].page_url,
      timestamp: lastTimestamp,
      severity: eventsPerMinute > 120 ? 'high' : 'medium',
      details: { eventsPerMinute: Math.round(eventsPerMinute) },
    });
  }

  return signals;
}

/**
 * Detect error attempts
 * Repeated form submission failures
 */
function detectErrorAttempts(events: CLAEventRow[]): Signal[] {
  const signals: Signal[] = [];
  const formSubmits: Map<string, { attempts: number; timestamp: number }> = new Map();

  for (const event of events) {
    if (event.event_type !== 'form_submit') continue;
    
    const data = event.event_data as Record<string, unknown>;
    const selector = data?.selector as string || 'form';
    const success = data?.success as boolean;

    const current = formSubmits.get(selector) || { attempts: 0, timestamp: 0 };
    current.attempts++;
    current.timestamp = event.client_timestamp;
    formSubmits.set(selector, current);

    if (!success && current.attempts >= 2) {
      signals.push({
        type: 'error_attempt',
        selector,
        page: event.page_url,
        timestamp: event.client_timestamp,
        severity: current.attempts >= 4 ? 'high' : 'medium',
        details: { attempts: current.attempts },
      });
    }
  }

  return signals;
}

/**
 * Extract all signals from events
 */
export function extractSignals(events: CLAEventRow[]): Signal[] {
  const sortedEvents = [...events].sort((a, b) => a.client_timestamp - b.client_timestamp);

  return [
    ...detectHesitation(sortedEvents),
    ...detectRageClicks(sortedEvents),
    ...detectBacktracking(sortedEvents),
    ...detectScrollAnomalies(sortedEvents),
    ...detectRapidFire(sortedEvents),
    ...detectErrorAttempts(sortedEvents),
  ];
}

/**
 * Calculate cognitive load score for a session
 * CLS = clamp(100 × sigmoid(α×TD + β×ID + γ×ER + δ×ND - ε×TC), 0, 100)
 */
export function calculateScore(events: CLAEventRow[], signals: Signal[]): number {
  if (events.length === 0) return 0;

  const sortedEvents = [...events].sort((a, b) => a.client_timestamp - b.client_timestamp);
  const firstTs = sortedEvents[0].client_timestamp;
  const lastTs = sortedEvents[sortedEvents.length - 1].client_timestamp;
  const durationMs = lastTs - firstTs;
  const durationMin = durationMs / 60000;

  if (durationMin < 0.01) return 0; // Too short

  // TD: Average decision time (normalized by hesitation signals)
  const hesitationSignals = signals.filter(s => s.type === 'hesitation');
  const avgHesitation = hesitationSignals.length > 0
    ? hesitationSignals.reduce((sum, s) => sum + ((s.details.hesitationMs as number) || 0), 0) / hesitationSignals.length / 1000
    : 0;
  const TD = Math.min(avgHesitation / 5, 1); // Normalize to 0-1

  // ID: Interaction density (events per minute, normalized)
  const eventsPerMin = events.length / durationMin;
  const ID = Math.min(eventsPerMin / 100, 1);

  // ER: Error rate (error signals / total interactions)
  const errorSignals = signals.filter(s => s.type === 'error_attempt');
  const ER = Math.min(errorSignals.length / Math.max(events.length / 10, 1), 1);

  // ND: Navigation complexity (backtrack + route changes)
  const routeChanges = events.filter(e => e.event_type === 'route_change').length;
  const backtracks = signals.filter(s => s.type === 'backtracking').length;
  const ND = Math.min((routeChanges + backtracks * 2) / 10, 1);

  // TC: Task completion ratio (inverse of signals, rewarding smooth interactions)
  const signalDensity = signals.length / Math.max(events.length / 10, 1);
  const TC = Math.max(0, 1 - Math.min(signalDensity, 1));

  // Calculate raw score
  const rawScore = WEIGHTS.alpha * TD + 
                   WEIGHTS.beta * ID + 
                   WEIGHTS.gamma * ER + 
                   WEIGHTS.delta * ND - 
                   WEIGHTS.epsilon * TC;

  // Apply sigmoid and scale to 0-100
  const score = Math.round(100 * sigmoid(rawScore * 4 - 1));
  return clamp(score, 0, 100);
}

/**
 * Aggregate signals into hotspots
 */
export function identifyHotspots(signals: Signal[]): Hotspot[] {
  const hotspotMap = new Map<string, {
    signals: Signal[];
    selector: string;
    page: string;
    type: string;
  }>();

  for (const signal of signals) {
    const key = `${signal.page}:${signal.selector || 'page'}:${signal.type}`;
    const existing = hotspotMap.get(key);

    if (existing) {
      existing.signals.push(signal);
    } else {
      hotspotMap.set(key, {
        signals: [signal],
        selector: signal.selector || 'page',
        page: signal.page,
        type: signal.type,
      });
    }
  }

  const hotspots: Hotspot[] = [];
  let id = 1;

  for (const [, data] of hotspotMap) {
    if (data.signals.length < 2) continue; // Need at least 2 occurrences

    const avgMetric = getAverageMetric(data.signals);
    const severity = getSeverity(data.signals);
    
    hotspots.push({
      id: String(id++),
      selector: data.selector,
      page: data.page,
      signalType: formatSignalType(data.type),
      severity,
      occurrences: data.signals.length,
      avgMetric,
      description: generateDescription(data.type, avgMetric, data.signals.length),
      suggestion: generateSuggestion(data.type, data.selector),
    });
  }

  return hotspots.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function getAverageMetric(signals: Signal[]): number {
  if (signals.length === 0) return 0;
  
  const type = signals[0].type;
  let sum = 0;

  for (const signal of signals) {
    switch (type) {
      case 'hesitation':
        sum += (signal.details.hesitationMs as number) || 0;
        break;
      case 'rage_click':
        sum += (signal.details.clickCount as number) || 0;
        break;
      case 'scroll_anomaly':
        sum += (signal.details.directionChanges as number) || 0;
        break;
      case 'error_attempt':
        sum += (signal.details.attempts as number) || 0;
        break;
      default:
        sum += 1;
    }
  }

  return Math.round(sum / signals.length * 10) / 10;
}

function getSeverity(signals: Signal[]): 'low' | 'medium' | 'high' {
  const highCount = signals.filter(s => s.severity === 'high').length;
  const mediumCount = signals.filter(s => s.severity === 'medium').length;

  if (highCount >= signals.length / 2 || signals.length >= 10) return 'high';
  if (mediumCount >= signals.length / 2 || signals.length >= 5) return 'medium';
  return 'low';
}

function formatSignalType(type: string): string {
  const typeMap: Record<string, string> = {
    hesitation: 'Decision Hesitation',
    rage_click: 'Rage Clicks',
    backtracking: 'Backtracking',
    scroll_anomaly: 'Scroll Anomaly',
    rapid_fire: 'Rapid-fire Interactions',
    error_attempt: 'Error Recovery',
  };
  return typeMap[type] || type;
}

function generateDescription(type: string, metric: number, count: number): string {
  switch (type) {
    case 'hesitation':
      return `Users hesitate for ${(metric / 1000).toFixed(1)}s avg before clicking (${count} occurrences)`;
    case 'rage_click':
      return `Users click ${metric}x on average before success (${count} occurrences)`;
    case 'backtracking':
      return `Users navigate back within 10s ${count} times`;
    case 'scroll_anomaly':
      return `Users scroll up/down ${metric}x indicating confusion (${count} occurrences)`;
    case 'rapid_fire':
      return `${metric} events/min detected indicating stress (${count} occurrences)`;
    case 'error_attempt':
      return `Users attempt form submission ${metric}x avg (${count} occurrences)`;
    default:
      return `${count} occurrences detected`;
  }
}

function generateSuggestion(type: string, selector: string): string {
  switch (type) {
    case 'hesitation':
      return `Simplify the options at ${selector} or add clearer labels`;
    case 'rage_click':
      return `Ensure ${selector} provides immediate visual feedback on click`;
    case 'backtracking':
      return `Review navigation flow and add breadcrumbs or progress indicators`;
    case 'scroll_anomaly':
      return `Break up content into digestible sections with clear headings`;
    case 'rapid_fire':
      return `Reduce cognitive load by simplifying the interface`;
    case 'error_attempt':
      return `Add inline validation and clearer error messages at ${selector}`;
    default:
      return `Review the UX at ${selector}`;
  }
}

/**
 * Fetch and analyze events from database
 */
export async function fetchAnalytics(timeRange: string = '24h'): Promise<{
  summary: AnalyticsSummary;
  sessions: SessionAnalysis[];
  pages: PageAnalysis[];
  hotspots: Hotspot[];
  scoreHistory: { time: string; score: number; sessions: number }[];
  signalDistribution: { name: string; value: number; color: string }[];
}> {
  // Calculate time range
  const now = new Date();
  let startTime: Date;
  
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default: // 24h
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Fetch events from database
  const { data: events, error } = await supabase
    .from('cla_events')
    .select('*')
    .gte('created_at', startTime.toISOString())
    .order('client_timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  const allEvents = (events || []) as CLAEventRow[];

  // Group events by session
  const sessionMap = new Map<string, CLAEventRow[]>();
  for (const event of allEvents) {
    const existing = sessionMap.get(event.session_id) || [];
    existing.push(event);
    sessionMap.set(event.session_id, existing);
  }

  // Analyze each session
  const sessions: SessionAnalysis[] = [];
  const allSignals: Signal[] = [];
  const pageScores = new Map<string, { scores: number[]; signals: number }>();

  for (const [sessionId, sessionEvents] of sessionMap) {
    const signals = extractSignals(sessionEvents);
    const score = calculateScore(sessionEvents, signals);
    const sortedEvents = [...sessionEvents].sort((a, b) => a.client_timestamp - b.client_timestamp);
    const duration = sortedEvents.length > 1 
      ? (sortedEvents[sortedEvents.length - 1].client_timestamp - sortedEvents[0].client_timestamp) / 1000
      : 0;

    const primaryPage = sessionEvents[0]?.page_url || '/';
    
    sessions.push({
      sessionId,
      page: primaryPage,
      score,
      duration,
      signalCount: signals.length,
      signals,
      deviceType: sessionEvents[0]?.device_type || 'unknown',
      timestamp: sessionEvents[0]?.created_at || '',
    });

    allSignals.push(...signals);

    // Aggregate page scores
    const existing = pageScores.get(primaryPage) || { scores: [], signals: 0 };
    existing.scores.push(score);
    existing.signals += signals.length;
    pageScores.set(primaryPage, existing);
  }

  // Identify hotspots from all signals
  const hotspots = identifyHotspots(allSignals);

  // Calculate page analysis
  const pages: PageAnalysis[] = [];
  for (const [page, data] of pageScores) {
    const avgScore = data.scores.length > 0
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0;
    
    pages.push({
      page,
      avgScore,
      sessionCount: data.scores.length,
      signalCount: data.signals,
      trend: Math.floor(Math.random() * 20) - 10, // TODO: Calculate real trend
    });
  }

  // Calculate summary
  const allScores = sessions.map(s => s.score);
  const overallScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  const summary: AnalyticsSummary = {
    overallScore,
    totalSessions: sessions.length,
    totalSignals: allSignals.length,
    hotspotCount: hotspots.filter(h => h.severity === 'high').length,
    scoreTrend: -3, // TODO: Calculate real trend
  };

  // Generate score history (time buckets)
  const scoreHistory = generateScoreHistory(sessions, timeRange);

  // Calculate signal distribution
  const signalCounts = new Map<string, number>();
  for (const signal of allSignals) {
    const count = signalCounts.get(signal.type) || 0;
    signalCounts.set(signal.type, count + 1);
  }

  const totalSignals = allSignals.length || 1;
  const signalDistribution = [
    { name: 'Hesitation', value: Math.round((signalCounts.get('hesitation') || 0) / totalSignals * 100), color: 'hsl(var(--cla-warning))' },
    { name: 'Rage Clicks', value: Math.round((signalCounts.get('rage_click') || 0) / totalSignals * 100), color: 'hsl(var(--destructive))' },
    { name: 'Backtracking', value: Math.round((signalCounts.get('backtracking') || 0) / totalSignals * 100), color: 'hsl(var(--secondary))' },
    { name: 'Scroll Issues', value: Math.round((signalCounts.get('scroll_anomaly') || 0) / totalSignals * 100), color: 'hsl(var(--primary))' },
    { name: 'Errors', value: Math.round((signalCounts.get('error_attempt') || 0) / totalSignals * 100), color: 'hsl(var(--cla-info))' },
  ].filter(s => s.value > 0);

  // If no data, return defaults
  if (signalDistribution.length === 0) {
    signalDistribution.push(
      { name: 'No Data', value: 100, color: 'hsl(var(--muted))' }
    );
  }

  return {
    summary,
    sessions: sessions.slice(0, 100), // Limit to 100 most recent
    pages: pages.sort((a, b) => b.sessionCount - a.sessionCount),
    hotspots,
    scoreHistory,
    signalDistribution,
  };
}

function generateScoreHistory(sessions: SessionAnalysis[], timeRange: string): { time: string; score: number; sessions: number }[] {
  const bucketCount = timeRange === '1h' ? 6 : timeRange === '24h' ? 7 : timeRange === '7d' ? 7 : 30;
  const history: { time: string; score: number; sessions: number }[] = [];

  if (sessions.length === 0) {
    // Return empty placeholder data
    for (let i = 0; i < bucketCount; i++) {
      history.push({ time: `T-${bucketCount - i}`, score: 0, sessions: 0 });
    }
    return history;
  }

  // Group sessions by time bucket
  const now = Date.now();
  const bucketDuration = timeRange === '1h' ? 600000 : // 10 min
                         timeRange === '24h' ? 3600000 * 4 : // 4 hours
                         timeRange === '7d' ? 86400000 : // 1 day
                         86400000; // 1 day for 30d

  for (let i = bucketCount - 1; i >= 0; i--) {
    const bucketStart = now - (i + 1) * bucketDuration;
    const bucketEnd = now - i * bucketDuration;
    
    const bucketSessions = sessions.filter(s => {
      const ts = new Date(s.timestamp).getTime();
      return ts >= bucketStart && ts < bucketEnd;
    });

    const avgScore = bucketSessions.length > 0
      ? Math.round(bucketSessions.reduce((sum, s) => sum + s.score, 0) / bucketSessions.length)
      : 0;

    const label = timeRange === '1h' ? `${(bucketCount - i) * 10}m ago` :
                  timeRange === '24h' ? `${(bucketCount - i) * 4}h` :
                  timeRange === '7d' ? `${bucketCount - i}d` :
                  `${bucketCount - i}d`;

    history.push({
      time: i === 0 ? 'Now' : label,
      score: avgScore,
      sessions: bucketSessions.length,
    });
  }

  return history;
}
