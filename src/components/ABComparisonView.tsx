import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight, 
  TrendingDown, 
  TrendingUp,
  Minus,
  CheckCircle,
  XCircle,
  GitCompare,
  Calendar,
  Percent
} from "lucide-react";
import type { AnalyticsSummary } from "@/lib/analytics-engine";

interface ComparisonPeriod {
  label: string;
  startDate: string;
  endDate: string;
  summary: AnalyticsSummary;
}

interface ABComparisonViewProps {
  currentSummary: AnalyticsSummary;
  onFetchComparison?: (startDate: string, endDate: string) => Promise<AnalyticsSummary | null>;
}

export const ABComparisonView = ({ currentSummary, onFetchComparison }: ABComparisonViewProps) => {
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonPeriod | null>(null);
  const [beforeDate, setBeforeDate] = useState("");
  const [afterDate, setAfterDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock historical data for demo
  const generateMockComparison = (): ComparisonPeriod => {
    // Simulate "before" period with worse metrics
    const worseFactor = 1.2 + Math.random() * 0.3;
    return {
      label: "Before",
      startDate: beforeDate || "Previous period",
      endDate: afterDate || "Current period",
      summary: {
        overallScore: Math.min(100, Math.round(currentSummary.overallScore * worseFactor)),
        totalSessions: Math.round(currentSummary.totalSessions * 0.8),
        totalSignals: Math.round(currentSummary.totalSignals * worseFactor),
        hotspotCount: Math.round(currentSummary.hotspotCount * worseFactor),
        scoreTrend: 5,
      }
    };
  };

  const handleCompare = async () => {
    setIsLoading(true);
    
    // Use callback if provided, otherwise use mock data
    if (onFetchComparison && beforeDate && afterDate) {
      const data = await onFetchComparison(beforeDate, afterDate);
      if (data) {
        setComparisonData({
          label: "Before",
          startDate: beforeDate,
          endDate: afterDate,
          summary: data,
        });
      }
    } else {
      // Demo mode with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setComparisonData(generateMockComparison());
    }
    
    setIsComparing(true);
    setIsLoading(false);
  };

  const calculateImprovement = (before: number, after: number, lowerIsBetter = true) => {
    if (before === 0) return 0;
    const change = ((before - after) / before) * 100;
    return lowerIsBetter ? change : -change;
  };

  const formatImprovement = (value: number, lowerIsBetter = true) => {
    const improved = lowerIsBetter ? value > 0 : value < 0;
    const absValue = Math.abs(value).toFixed(1);
    return { improved, text: `${improved ? '↓' : '↑'} ${absValue}%` };
  };

  const MetricComparison = ({ 
    label, 
    before, 
    after, 
    lowerIsBetter = true,
    format = (v: number) => v.toString()
  }: { 
    label: string; 
    before: number; 
    after: number; 
    lowerIsBetter?: boolean;
    format?: (v: number) => string;
  }) => {
    const improvement = calculateImprovement(before, after, lowerIsBetter);
    const { improved, text } = formatImprovement(improvement, lowerIsBetter);
    
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono opacity-60">{format(before)}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-mono font-medium">{format(after)}</span>
          <Badge 
            variant="outline" 
            className={improved 
              ? "border-cla-success/50 text-cla-success bg-cla-success/10" 
              : "border-destructive/50 text-destructive bg-destructive/10"
            }
          >
            {improved ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
            {text}
          </Badge>
        </div>
      </div>
    );
  };

  if (!isComparing) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            A/B Comparison
          </CardTitle>
          <CardDescription>
            Compare metrics before and after UI changes to measure improvements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Before Period (optional)
              </Label>
              <Input 
                type="date" 
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
                className="bg-muted/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                After Period (optional)
              </Label>
              <Input 
                type="date"
                value={afterDate}
                onChange={(e) => setAfterDate(e.target.value)}
                className="bg-muted/30"
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Leave dates empty to use demo data comparing current metrics against a simulated "before" period.
          </p>

          <Button 
            onClick={handleCompare} 
            disabled={isLoading}
            className="w-full gap-2"
          >
            <Percent className="w-4 h-4" />
            {isLoading ? "Analyzing..." : "Compare Periods"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const before = comparisonData?.summary;
  const after = currentSummary;

  if (!before) return null;

  const scoreImproved = before.overallScore > after.overallScore;
  const overallImprovement = calculateImprovement(before.overallScore, after.overallScore);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              Comparison Results
            </CardTitle>
            <CardDescription>
              {comparisonData.startDate} → {comparisonData.endDate}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsComparing(false)}>
            New Comparison
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Result */}
        <div className={`p-4 rounded-lg border ${
          scoreImproved 
            ? 'bg-cla-success/5 border-cla-success/30' 
            : 'bg-destructive/5 border-destructive/30'
        }`}>
          <div className="flex items-center gap-3">
            {scoreImproved 
              ? <CheckCircle className="w-6 h-6 text-cla-success" />
              : <XCircle className="w-6 h-6 text-destructive" />
            }
            <div>
              <div className="font-semibold">
                {scoreImproved 
                  ? "Cognitive Load Reduced! 🎉" 
                  : "Cognitive Load Increased"
                }
              </div>
              <div className={`text-sm ${scoreImproved ? 'text-cla-success' : 'text-destructive'}`}>
                Score changed from {before.overallScore} → {after.overallScore} 
                ({overallImprovement > 0 ? '-' : '+'}{Math.abs(overallImprovement).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Metric Comparisons */}
        <div className="space-y-2">
          <MetricComparison
            label="Cognitive Load Score"
            before={before.overallScore}
            after={after.overallScore}
            lowerIsBetter={true}
          />
          <MetricComparison
            label="Total Signals"
            before={before.totalSignals}
            after={after.totalSignals}
            lowerIsBetter={true}
          />
          <MetricComparison
            label="Hotspot Count"
            before={before.hotspotCount}
            after={after.hotspotCount}
            lowerIsBetter={true}
          />
          <MetricComparison
            label="Sessions Tracked"
            before={before.totalSessions}
            after={after.totalSessions}
            lowerIsBetter={false}
          />
        </div>

        {/* Interpretation */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="text-sm font-medium mb-2">Interpretation</div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {scoreImproved && (
              <li className="flex items-center gap-2">
                <Minus className="w-3 h-3" />
                Lower score indicates reduced cognitive friction
              </li>
            )}
            {before.totalSignals > after.totalSignals && (
              <li className="flex items-center gap-2">
                <Minus className="w-3 h-3" />
                Fewer signals means less user confusion
              </li>
            )}
            {before.hotspotCount > after.hotspotCount && (
              <li className="flex items-center gap-2">
                <Minus className="w-3 h-3" />
                Reduced hotspots show targeted improvements worked
              </li>
            )}
            {!scoreImproved && (
              <li className="flex items-center gap-2 text-cla-warning">
                <Minus className="w-3 h-3" />
                Review recent changes that may have increased friction
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
