import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  Bot,
  ArrowLeft, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCw,
  Settings,
  ChevronRight,
  Zap,
  Target,
  Shield,
  GitCompare,
  Bell,
  Code,
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAnalytics } from "@/hooks/use-analytics";
import { useQueryClient } from "@tanstack/react-query";
import { SessionTimeline } from "@/components/SessionTimeline";
import { SyntheticUserGenerator } from "@/components/SyntheticUserGenerator";
import { ClickHeatmap } from "@/components/ClickHeatmap";
import { PDFExport } from "@/components/PDFExport";
import { RealtimeIndicator } from "@/components/RealtimeIndicator";
import { useRealtimeAnalytics } from "@/hooks/use-realtime-analytics";
import { SessionFilters, defaultFilters, type SessionFiltersState } from "@/components/SessionFilters";
import { ABComparisonView } from "@/components/ABComparisonView";
import { PrivacyControls } from "@/components/PrivacyControls";
import { ThresholdAlerts } from "@/components/ThresholdAlerts";
import { EmbedSnippet } from "@/components/EmbedSnippet";

const Dashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useAnalytics(selectedTimeRange);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const { isConnected, eventCount, resetEventCount } = useRealtimeAnalytics();
  const [sessionFilters, setSessionFilters] = useState<SessionFiltersState>(defaultFilters);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    if (!data?.sessions) return [];
    
    return data.sessions
      .filter(session => {
        // Score range filter
        if (session.score < sessionFilters.scoreRange[0] || session.score > sessionFilters.scoreRange[1]) {
          return false;
        }
        // Device type filter
        if (sessionFilters.deviceType !== 'all' && session.deviceType !== sessionFilters.deviceType) {
          return false;
        }
        // Signal count filter
        if (session.signalCount < sessionFilters.signalCountMin) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sessionFilters.sortBy) {
          case 'score':
            comparison = a.score - b.score;
            break;
          case 'duration':
            comparison = a.duration - b.duration;
            break;
          case 'signals':
            comparison = a.signalCount - b.signalCount;
            break;
          case 'timestamp':
          default:
            comparison = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            break;
        }
        return sessionFilters.sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [data?.sessions, sessionFilters]);
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    refetch();
  };

  // Generate heatmap data from sessions
  const heatmapData = useMemo(() => {
    if (!data?.sessions) return [];
    
    const clickMap = new Map<string, { x: number; y: number; count: number; selector?: string }>();
    
    data.sessions.forEach(session => {
      session.signals.forEach(signal => {
        if (signal.type === 'rage_click' || signal.type === 'hesitation') {
          const details = signal.details as { x?: number; y?: number };
          const x = details.x || Math.random() * 1920;
          const y = details.y || Math.random() * 1080;
          const key = `${Math.floor(x / 50)}-${Math.floor(y / 50)}`;
          
          const existing = clickMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            clickMap.set(key, { x, y, count: 1, selector: signal.selector });
          }
        }
      });
    });
    
    return Array.from(clickMap.values());
  }, [data?.sessions]);

  const getScoreBadge = (score: number) => {
    if (score <= 20) return { label: "Low", className: "bg-cla-success/20 text-cla-success border-cla-success/30" };
    if (score <= 40) return { label: "Mild", className: "bg-primary/20 text-primary border-primary/30" };
    if (score <= 70) return { label: "Moderate", className: "bg-cla-warning/20 text-cla-warning border-cla-warning/30" };
    return { label: "High", className: "bg-destructive/20 text-destructive border-destructive/30" };
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const summary = data?.summary || { overallScore: 0, totalSessions: 0, totalSignals: 0, hotspotCount: 0, scoreTrend: 0 };
  const scoreBadge = getScoreBadge(summary.overallScore);

  return (
    <div className="min-h-screen bg-background dark tech-grid-bg">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-semibold">CLA Dashboard</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                {["1h", "24h", "7d", "30d"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-2 py-1 text-sm rounded transition-colors ${
                      selectedTimeRange === range 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="gap-2"
                disabled={isFetching}
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <RealtimeIndicator 
                isConnected={isConnected} 
                eventCount={eventCount} 
                onReset={resetEventCount}
              />
              <PDFExport 
                summary={summary}
                hotspots={data?.hotspots || []}
                pages={data?.pages || []}
                timeRange={selectedTimeRange}
              />
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Overview Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className={scoreBadge.className}>
                  {scoreBadge.label}
                </Badge>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold gradient-text">{summary.overallScore}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Overall CL Score</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                {summary.scoreTrend < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-cla-success" />
                    <span className="text-cla-success">{summary.scoreTrend} from yesterday</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3 text-destructive" />
                    <span className="text-destructive">+{summary.scoreTrend} from yesterday</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{summary.totalSessions.toLocaleString()}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Sessions ({selectedTimeRange})</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-muted-foreground">Tracked sessions</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-cla-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-cla-warning" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-3xl font-bold">{data?.hotspots.length || 0}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Active Hotspots</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-cla-warning">{summary.hotspotCount} high severity</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-cla-info/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cla-info" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{summary.totalSignals.toLocaleString()}</div>
              )}
              <p className="text-sm text-muted-foreground mt-1">Signals Detected</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-muted-foreground">Last {selectedTimeRange}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="pages">Page Analysis</TabsTrigger>
            <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="compare" className="gap-1.5">
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="embed" className="gap-1.5">
              <Code className="w-3.5 h-3.5" />
              Embed
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="testing" className="gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Testing
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Score Trend Chart */}
              <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Cognitive Load Trend
                  </CardTitle>
                  <CardDescription>Score and session volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {isLoading ? (
                      <Skeleton className="w-full h-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.scoreHistory || []}>
                          <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            fillOpacity={1}
                            fill="url(#scoreGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Signal Distribution */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Signal Types
                  </CardTitle>
                  <CardDescription>Distribution of detected friction signals</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="w-full h-48" />
                  ) : (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data?.signalDistribution || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {(data?.signalDistribution || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-4">
                        {(data?.signalDistribution || []).map((item) => (
                          <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="font-medium">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <ClickHeatmap 
                clicks={heatmapData}
                width={500}
                height={350}
                title="Friction Heatmap"
              />
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader>
                  <CardTitle>Hotspot Legend</CardTitle>
                  <CardDescription>Areas with highest friction signals</CardDescription>
                </CardHeader>
                <CardContent>
                  {heatmapData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No click data yet. Generate synthetic sessions or interact with the demo.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {heatmapData.slice(0, 5).map((point, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{
                                background: point.count > 5 ? 'hsl(0, 100%, 50%)' : 
                                           point.count > 2 ? 'hsl(45, 100%, 50%)' : 
                                           'hsl(180, 100%, 50%)'
                              }}
                            />
                            <code className="text-xs">{point.selector || `Zone ${idx + 1}`}</code>
                          </div>
                          <Badge variant="outline">{point.count} clicks</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle>Page Performance</CardTitle>
                <CardDescription>Cognitive load scores by page</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (data?.pages || []).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No page data yet. Visit the demo page to generate events.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(data?.pages || []).map((page) => {
                      const badge = getScoreBadge(page.avgScore);
                      return (
                        <div 
                          key={page.page} 
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-bold text-primary">{page.avgScore}</span>
                            </div>
                            <div>
                              <div className="font-medium">{page.page}</div>
                              <div className="text-sm text-muted-foreground">
                                {page.sessionCount.toLocaleString()} sessions · {page.signalCount} signals
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className={badge.className}>
                              {badge.label}
                            </Badge>
                            <div className={`flex items-center gap-1 text-sm ${
                              page.trend > 0 ? "text-destructive" : "text-cla-success"
                            }`}>
                              {page.trend > 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {Math.abs(page.trend)}%
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hotspots Tab */}
          <TabsContent value="hotspots" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : (data?.hotspots || []).length === 0 ? (
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hotspots detected yet. Interact with the demo page to generate signals.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {(data?.hotspots || []).map((hotspot) => (
                  <Card key={hotspot.id} className="bg-card/50 backdrop-blur border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            hotspot.severity === 'high' ? 'bg-destructive/10' :
                            hotspot.severity === 'medium' ? 'bg-cla-warning/10' :
                            'bg-primary/10'
                          }`}>
                            <AlertTriangle className={`w-5 h-5 ${
                              hotspot.severity === 'high' ? 'text-destructive' :
                              hotspot.severity === 'medium' ? 'text-cla-warning' :
                              'text-primary'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium">{hotspot.signalType}</div>
                            <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {hotspot.selector}
                            </code>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            hotspot.severity === 'high' ? 'border-destructive text-destructive' :
                            hotspot.severity === 'medium' ? 'border-cla-warning text-cla-warning' :
                            'border-primary text-primary'
                          }
                        >
                          {hotspot.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{hotspot.description}</p>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm"><strong>Suggestion:</strong> {hotspot.suggestion}</span>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Page: {hotspot.page} · {hotspot.occurrences} occurrences
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            {/* Synthetic User Generator */}
            <SyntheticUserGenerator />

            {/* Session Timeline (if selected) */}
            {selectedSession && data?.sessions && (() => {
              const session = data.sessions.find(s => s.sessionId === selectedSession);
              if (!session) return null;
              
              // Convert session signals to timeline events
              const timelineEvents = session.signals.map((signal, idx) => ({
                id: `${signal.timestamp}-${idx}`,
                type: signal.type,
                timestamp: signal.timestamp,
                data: signal.details as Record<string, unknown>,
                signal,
              }));
              
              return (
                <SessionTimeline
                  sessionId={session.sessionId}
                  events={timelineEvents}
                  signals={session.signals}
                  score={session.score}
                  duration={session.duration}
                />
              );
            })()}

            {/* Sessions Table */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Sessions</span>
                  {selectedSession && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedSession(null)}
                    >
                      Clear Selection
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>Click a session to view its timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <SessionFilters 
                  filters={sessionFilters}
                  onFiltersChange={setSessionFilters}
                  onReset={() => setSessionFilters(defaultFilters)}
                />

                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {(data?.sessions || []).length === 0 
                        ? "No sessions recorded yet. Use the generator above or visit the demo page."
                        : "No sessions match the current filters. Try adjusting your filters."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground">
                      Showing {Math.min(filteredSessions.length, 20)} of {filteredSessions.length} sessions
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Session ID</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Page</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Score</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Signals</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Device</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSessions.slice(0, 20).map((session) => {
                            const badge = getScoreBadge(session.score);
                            const isSelected = selectedSession === session.sessionId;
                            return (
                              <tr 
                                key={session.sessionId} 
                                onClick={() => setSelectedSession(isSelected ? null : session.sessionId)}
                                className={`border-b border-border/50 cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-primary/10 hover:bg-primary/15' 
                                    : 'hover:bg-muted/30'
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <code className="text-xs">{session.sessionId.slice(0, 12)}...</code>
                                </td>
                                <td className="py-3 px-4 text-sm">{session.page}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={badge.className}>
                                    {session.score}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                  {formatDuration(session.duration)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-sm ${session.signalCount > 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {session.signalCount}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground capitalize">
                                  {session.deviceType}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-6">
            <ABComparisonView currentSummary={summary} />
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <ThresholdAlerts />
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed" className="space-y-6">
            <EmbedSnippet />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <PrivacyControls />
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <SyntheticUserGenerator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
