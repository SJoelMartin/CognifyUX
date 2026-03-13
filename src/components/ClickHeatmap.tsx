import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MousePointer2 } from "lucide-react";

interface ClickData {
  x: number;
  y: number;
  count: number;
  selector?: string;
}

interface ClickHeatmapProps {
  clicks: ClickData[];
  width?: number;
  height?: number;
  title?: string;
}

export function ClickHeatmap({ 
  clicks, 
  width = 400, 
  height = 300,
  title = "Click Heatmap"
}: ClickHeatmapProps) {
  // Normalize clicks to viewport dimensions and calculate intensity
  const heatmapData = useMemo(() => {
    if (clicks.length === 0) return [];
    
    const maxCount = Math.max(...clicks.map(c => c.count), 1);
    
    return clicks.map(click => ({
      ...click,
      normalizedX: (click.x / 1920) * width, // Assume 1920 viewport
      normalizedY: (click.y / 1080) * height, // Assume 1080 viewport
      intensity: click.count / maxCount,
    }));
  }, [clicks, width, height]);

  const getHeatColor = (intensity: number) => {
    // Gradient from cyan (low) -> yellow (medium) -> red (high)
    if (intensity < 0.33) {
      return `hsla(180, 100%, 50%, ${0.3 + intensity * 0.4})`; // Cyan
    } else if (intensity < 0.66) {
      return `hsla(45, 100%, 50%, ${0.4 + intensity * 0.4})`; // Yellow
    }
    return `hsla(0, 100%, 50%, ${0.5 + intensity * 0.5})`; // Red
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointer2 className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>Visual representation of click density</CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="relative bg-muted/20 rounded-lg border border-border/50 overflow-hidden"
          style={{ width, height }}
        >
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          
          {/* Page outline */}
          <div className="absolute inset-4 border-2 border-dashed border-primary/20 rounded-lg">
            <div className="absolute top-2 left-2 text-xs text-muted-foreground font-mono">
              Page Preview
            </div>
          </div>

          {/* Heatmap points */}
          {heatmapData.map((point, idx) => (
            <div
              key={idx}
              className="absolute rounded-full blur-sm transition-all"
              style={{
                left: point.normalizedX - 20,
                top: point.normalizedY - 20,
                width: 40 + point.intensity * 30,
                height: 40 + point.intensity * 30,
                background: `radial-gradient(circle, ${getHeatColor(point.intensity)} 0%, transparent 70%)`,
              }}
              title={point.selector ? `${point.selector}: ${point.count} clicks` : `${point.count} clicks`}
            />
          ))}

          {/* Click markers */}
          {heatmapData.map((point, idx) => (
            <div
              key={`marker-${idx}`}
              className="absolute w-2 h-2 rounded-full bg-foreground/80 border border-background"
              style={{
                left: point.normalizedX - 4,
                top: point.normalizedY - 4,
              }}
            />
          ))}

          {/* Legend */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="w-16 h-2 rounded-full bg-gradient-to-r from-cyan-500 via-yellow-500 to-red-500" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10">
              {clicks.length} zones
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Total clicks: {clicks.reduce((sum, c) => sum + c.count, 0)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
