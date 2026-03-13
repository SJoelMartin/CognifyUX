import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Play, 
  UserX, 
  Zap, 
  User,
  Settings2,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  behavior: {
    hesitationChance: number;
    rageClickChance: number;
    backtrackChance: number;
    scrollAnomalyChance: number;
    eventInterval: [number, number]; // min, max ms
    sessionDuration: [number, number]; // min, max ms
  };
}

const userProfiles: UserProfile[] = [
  {
    id: 'confused',
    name: 'Confused User',
    description: 'Hesitates frequently, backtracks often, slow interactions',
    icon: UserX,
    behavior: {
      hesitationChance: 0.7,
      rageClickChance: 0.2,
      backtrackChance: 0.5,
      scrollAnomalyChance: 0.4,
      eventInterval: [800, 2500],
      sessionDuration: [30000, 90000],
    },
  },
  {
    id: 'frustrated',
    name: 'Frustrated User',
    description: 'Rage clicks, rapid scrolling, high event density',
    icon: Zap,
    behavior: {
      hesitationChance: 0.3,
      rageClickChance: 0.8,
      backtrackChance: 0.3,
      scrollAnomalyChance: 0.6,
      eventInterval: [100, 400],
      sessionDuration: [20000, 60000],
    },
  },
  {
    id: 'expert',
    name: 'Expert User',
    description: 'Efficient navigation, minimal friction, quick decisions',
    icon: User,
    behavior: {
      hesitationChance: 0.1,
      rageClickChance: 0.05,
      backtrackChance: 0.1,
      scrollAnomalyChance: 0.1,
      eventInterval: [300, 800],
      sessionDuration: [15000, 45000],
    },
  },
];

const generateSessionId = () => {
  return 'syn-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const randomBetween = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const selectors = [
  'button.cta-primary',
  'a.nav-link',
  '#signup-form',
  '.card.pricing',
  'input[type="email"]',
  'button.submit',
  '.feature-item',
  'nav.main-menu',
  '.hero-section',
  '#pricing-toggle',
];

const pages = ['/demo', '/', '/dashboard'];

export const SyntheticUserGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [generatedSessions, setGeneratedSessions] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  const generateSyntheticSession = useCallback(async (profile: UserProfile) => {
    const sessionId = generateSessionId();
    const sessionStart = Date.now();
    const sessionDuration = randomBetween(...profile.behavior.sessionDuration);
    const events: Array<{
      session_id: string;
      page_url: string;
      event_type: string;
      event_data: Json;
      client_timestamp: number;
      device_type: string;
      viewport_width: number;
      viewport_height: number;
      user_agent: string;
    }> = [];

    let currentTime = sessionStart;
    let currentPage = pages[0];
    let lastSelector: string | null = null;
    let scrollY = 0;
    let lastScrollDirection: 'up' | 'down' | null = null;
    let scrollDirectionChanges = 0;

    // Initial page view
    events.push({
      session_id: sessionId,
      page_url: currentPage,
      event_type: 'page_view',
      event_data: { url: currentPage, referrer: '' },
      client_timestamp: currentTime,
      device_type: 'desktop',
      viewport_width: 1920,
      viewport_height: 1080,
      user_agent: `SyntheticUser/${profile.id}`,
    });

    while (currentTime - sessionStart < sessionDuration) {
      const interval = randomBetween(...profile.behavior.eventInterval);
      currentTime += interval;

      // Determine event type based on profile behavior
      const rand = Math.random();
      let eventType: string;
      const eventData: Record<string, string | number | boolean> = {};
      const selector = selectors[Math.floor(Math.random() * selectors.length)];

      if (rand < 0.05 && pages.length > 1) {
        // Route change
        eventType = 'route_change';
        const newPage = pages.filter(p => p !== currentPage)[
          Math.floor(Math.random() * (pages.length - 1))
        ];
        eventData.from = currentPage;
        eventData.to = newPage;
        
        // Backtracking behavior
        if (Math.random() < profile.behavior.backtrackChance && events.length > 5) {
          const prevRouteChange = events.find(e => e.event_type === 'route_change');
          const prevData = prevRouteChange?.event_data as Record<string, string | number | boolean> | null;
          if (prevData?.from) {
            eventData.to = prevData.from as string;
          }
        }
        currentPage = eventData.to as string;
      } else if (rand < 0.25) {
        // Click with potential hesitation
        if (Math.random() < profile.behavior.hesitationChance) {
          // Add hover_start before click
          events.push({
            session_id: sessionId,
            page_url: currentPage,
            event_type: 'hover_start',
            event_data: { selector, x: randomBetween(100, 1800), y: randomBetween(100, 900) },
            client_timestamp: currentTime,
            device_type: 'desktop',
            viewport_width: 1920,
            viewport_height: 1080,
            user_agent: `SyntheticUser/${profile.id}`,
          });
          currentTime += randomBetween(600, 3000); // Hesitation delay
        }
        
        eventType = 'click';
        eventData.selector = selector;
        eventData.x = randomBetween(100, 1800);
        eventData.y = randomBetween(100, 900);
        
        // Rage click behavior
        if (Math.random() < profile.behavior.rageClickChance && lastSelector === selector) {
          // Add rapid clicks
          for (let i = 0; i < randomBetween(3, 6); i++) {
            events.push({
              session_id: sessionId,
              page_url: currentPage,
              event_type: 'click',
              event_data: { 
                selector, 
                x: randomBetween(100, 1800), 
                y: randomBetween(100, 900) 
              },
              client_timestamp: currentTime + i * randomBetween(100, 300),
              device_type: 'desktop',
              viewport_width: 1920,
              viewport_height: 1080,
              user_agent: `SyntheticUser/${profile.id}`,
            });
          }
          currentTime += 1500;
        }
        lastSelector = selector;
      } else if (rand < 0.5) {
        // Scroll with potential anomaly
        eventType = 'scroll';
        const newDirection = Math.random() > 0.5 ? 'down' : 'up';
        
        if (Math.random() < profile.behavior.scrollAnomalyChance) {
          // Simulate scroll anomaly (rapid direction changes)
          for (let i = 0; i < randomBetween(4, 8); i++) {
            const dir = i % 2 === 0 ? 'down' : 'up';
            scrollY = dir === 'down' 
              ? Math.min(scrollY + randomBetween(100, 300), 3000)
              : Math.max(scrollY - randomBetween(100, 300), 0);
            events.push({
              session_id: sessionId,
              page_url: currentPage,
              event_type: 'scroll',
              event_data: { 
                y: scrollY, 
                depth: Math.min(scrollY / 30, 100),
                direction: dir
              },
              client_timestamp: currentTime + i * randomBetween(50, 150),
              device_type: 'desktop',
              viewport_width: 1920,
              viewport_height: 1080,
              user_agent: `SyntheticUser/${profile.id}`,
            });
          }
          currentTime += 1000;
          continue;
        }
        
        if (lastScrollDirection && newDirection !== lastScrollDirection) {
          scrollDirectionChanges++;
        }
        lastScrollDirection = newDirection;
        scrollY = newDirection === 'down' 
          ? Math.min(scrollY + randomBetween(100, 400), 3000)
          : Math.max(scrollY - randomBetween(100, 400), 0);
        eventData.y = scrollY;
        eventData.depth = Math.min(scrollY / 30, 100);
      } else if (rand < 0.6) {
        // Focus on input
        eventType = 'focus_in';
        eventData.selector = 'input[type="email"]';
      } else {
        // Hover
        eventType = 'hover_start';
        eventData.selector = selector;
        eventData.x = randomBetween(100, 1800);
        eventData.y = randomBetween(100, 900);
      }

      events.push({
        session_id: sessionId,
        page_url: currentPage,
        event_type: eventType,
        event_data: eventData as Json,
        client_timestamp: currentTime,
        device_type: 'desktop',
        viewport_width: 1920,
        viewport_height: 1080,
        user_agent: `SyntheticUser/${profile.id}`,
      });
    }

    // Insert events in batches
    const batchSize = 50;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { error } = await supabase.from('cla_events').insert(batch);
      if (error) {
        console.error('Error inserting synthetic events:', error);
        throw error;
      }
    }

    return events.length;
  }, []);

  const handleGenerate = async (profile: UserProfile, count: number) => {
    setIsGenerating(true);
    setSelectedProfile(profile);
    setProgress(0);
    setGeneratedSessions(0);
    setTotalEvents(0);

    try {
      for (let i = 0; i < count; i++) {
        const eventCount = await generateSyntheticSession(profile);
        setGeneratedSessions(i + 1);
        setTotalEvents(prev => prev + eventCount);
        setProgress(((i + 1) / count) * 100);
        
        // Small delay between sessions
        await new Promise(r => setTimeout(r, 100));
      }
      
      toast.success(`Generated ${count} ${profile.name} sessions`);
    } catch (error) {
      toast.error('Failed to generate synthetic sessions');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Synthetic User Generator
        </CardTitle>
        <CardDescription>
          Generate test sessions with different user behavior profiles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Profiles */}
        <div className="grid gap-4">
          {userProfiles.map((profile) => {
            const Icon = profile.icon;
            return (
              <div 
                key={profile.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    profile.id === 'confused' ? 'bg-cla-warning/20' :
                    profile.id === 'frustrated' ? 'bg-destructive/20' :
                    'bg-cla-success/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      profile.id === 'confused' ? 'text-cla-warning' :
                      profile.id === 'frustrated' ? 'text-destructive' :
                      'text-cla-success'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-sm text-muted-foreground">{profile.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate(profile, 1)}
                    disabled={isGenerating}
                  >
                    1 session
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerate(profile, 5)}
                    disabled={isGenerating}
                  >
                    5 sessions
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleGenerate(profile, 10)}
                    disabled={isGenerating}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    10 sessions
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        {isGenerating && selectedProfile && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 animate-spin text-primary" />
                Generating {selectedProfile.name} sessions...
              </span>
              <span className="text-muted-foreground">
                {generatedSessions} sessions · {totalEvents} events
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Completion */}
        {!isGenerating && totalEvents > 0 && (
          <div className="p-4 rounded-lg bg-cla-success/10 border border-cla-success/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-cla-success" />
            <div>
              <div className="font-medium text-cla-success">Generation Complete</div>
              <div className="text-sm text-muted-foreground">
                Created {generatedSessions} sessions with {totalEvents} total events
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/20">
          <strong>Tip:</strong> Generate sessions with different profiles to test how the 
          analytics engine detects various friction patterns. Check the dashboard after 
          generating to see updated scores and hotspots.
        </div>
      </CardContent>
    </Card>
  );
};
