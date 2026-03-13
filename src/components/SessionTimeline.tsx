import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  MousePointer,
  Move,
  Eye,
  FormInput,
  Navigation,
  AlertTriangle,
  Scroll,
  Zap,
  Clock
} from "lucide-react";
import type { Signal } from "@/lib/analytics-engine";

interface TimelineEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
  signal?: Signal;
}

interface SessionTimelineProps {
  sessionId: string;
  events: TimelineEvent[];
  signals: Signal[];
  score: number;
  duration: number;
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  page_view: Eye,
  click: MousePointer,
  mousemove: Move,
  hover_start: Eye,
  hover_end: Eye,
  scroll: Scroll,
  route_change: Navigation,
  form_submit: FormInput,
  error_event: AlertTriangle,
  focus_in: FormInput,
  focus_out: FormInput,
};

const signalColors: Record<string, string> = {
  hesitation: "bg-cla-warning",
  rage_click: "bg-destructive",
  backtracking: "bg-cla-info",
  scroll_anomaly: "bg-cla-warning",
  rapid_fire: "bg-destructive",
  error_attempt: "bg-destructive",
};

export const SessionTimeline = ({ 
  sessionId, 
  events, 
  signals, 
  score, 
  duration 
}: SessionTimelineProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const startTime = sortedEvents[0]?.timestamp || 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: string) => {
    const Icon = eventIcons[type] || Zap;
    return <Icon className="w-4 h-4" />;
  };

  const getSignalAtTime = (timestamp: number): Signal | undefined => {
    return signals.find(s => Math.abs(s.timestamp - timestamp) < 100);
  };

  const getEventLabel = (event: TimelineEvent) => {
    switch (event.type) {
      case 'click':
        return `Click on ${event.data.selector || 'element'}`;
      case 'page_view':
        return `Viewed page`;
      case 'scroll':
        return `Scrolled to ${Math.round((event.data.depth as number) || 0)}%`;
      case 'route_change':
        return `Navigated ${event.data.from || ''} → ${event.data.to || ''}`;
      case 'hover_start':
        return `Hover on ${event.data.selector || 'element'}`;
      case 'form_submit':
        return `Form submission ${event.data.success ? '✓' : '✗'}`;
      case 'focus_in':
        return `Focus on input`;
      default:
        return event.type.replace(/_/g, ' ');
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && currentIndex < sortedEvents.length - 1) {
      playTimeline();
    }
  };

  const playTimeline = () => {
    let idx = currentIndex;
    const play = () => {
      if (idx >= sortedEvents.length - 1) {
        setIsPlaying(false);
        return;
      }
      idx++;
      setCurrentIndex(idx);
      const nextDelay = sortedEvents[idx + 1] 
        ? (sortedEvents[idx + 1].timestamp - sortedEvents[idx].timestamp) / playbackSpeed
        : 0;
      if (nextDelay > 0 && nextDelay < 5000) {
        setTimeout(play, nextDelay);
      } else if (nextDelay > 0) {
        setTimeout(play, 100);
      }
    };
    setTimeout(play, 100);
  };

  const skipToStart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const skipToEnd = () => {
    setCurrentIndex(sortedEvents.length - 1);
    setIsPlaying(false);
  };

  const getScoreBadge = (score: number) => {
    if (score <= 20) return { label: "Low", className: "bg-cla-success/20 text-cla-success border-cla-success/30" };
    if (score <= 40) return { label: "Mild", className: "bg-primary/20 text-primary border-primary/30" };
    if (score <= 70) return { label: "Moderate", className: "bg-cla-warning/20 text-cla-warning border-cla-warning/30" };
    return { label: "High", className: "bg-destructive/20 text-destructive border-destructive/30" };
  };

  const scoreBadge = getScoreBadge(score);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Session Timeline
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <code className="text-xs">{sessionId.slice(0, 16)}...</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={scoreBadge.className}>
              Score: {score}
            </Badge>
            <Badge variant="outline" className="border-muted-foreground/30">
              {formatTime(duration * 1000)}
            </Badge>
            <Badge variant="outline" className="border-cla-warning/30 text-cla-warning">
              {signals.length} signals
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Playback Controls */}
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/30">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={skipToStart}
            className="h-8 w-8"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePlayPause}
            className="h-8 w-8"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={skipToEnd}
            className="h-8 w-8"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 mx-4">
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-primary transition-all duration-100"
                style={{ width: `${(currentIndex / Math.max(sortedEvents.length - 1, 1)) * 100}%` }}
              />
              {/* Signal markers */}
              {signals.map((signal, i) => {
                const eventIdx = sortedEvents.findIndex(e => Math.abs(e.timestamp - signal.timestamp) < 100);
                if (eventIdx === -1) return null;
                const position = (eventIdx / Math.max(sortedEvents.length - 1, 1)) * 100;
                return (
                  <div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full -top-0 ${signalColors[signal.type] || 'bg-cla-warning'}`}
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    title={signal.type}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {[0.5, 1, 2, 4].map((speed) => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setPlaybackSpeed(speed)}
                className="h-7 px-2 text-xs"
              >
                {speed}x
              </Button>
            ))}
          </div>
          
          <span className="text-sm text-muted-foreground min-w-[80px] text-right">
            {currentIndex + 1} / {sortedEvents.length}
          </span>
        </div>

        {/* Event Timeline */}
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {sortedEvents.map((event, index) => {
              const signal = getSignalAtTime(event.timestamp);
              const isActive = index === currentIndex;
              const isPast = index < currentIndex;
              
              return (
                <div
                  key={event.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-primary/20 border border-primary/30' 
                      : isPast 
                        ? 'bg-muted/20 opacity-60' 
                        : 'hover:bg-muted/30'
                  }`}
                >
                  <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
                    {formatTime(event.timestamp - startTime)}
                  </span>
                  
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    signal ? signalColors[signal.type] || 'bg-cla-warning' : 'bg-muted'
                  }`}>
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {getEventLabel(event)}
                    </div>
                    {signal && (
                      <div className="text-xs text-destructive">
                        ⚠ {signal.type.replace(/_/g, ' ')} detected
                      </div>
                    )}
                  </div>
                  
                  {event.data.selector && (
                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded hidden sm:block max-w-[150px] truncate">
                      {String(event.data.selector)}
                    </code>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
