import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, AlertTriangle, TrendingUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  name: string;
  metric: "score" | "rageClicks" | "hesitations" | "backtracking";
  threshold: number;
  condition: "above" | "below";
  enabled: boolean;
  triggeredCount: number;
}

const defaultAlerts: Alert[] = [
  {
    id: "1",
    name: "High Cognitive Load",
    metric: "score",
    threshold: 70,
    condition: "above",
    enabled: true,
    triggeredCount: 3,
  },
  {
    id: "2",
    name: "Rage Click Spike",
    metric: "rageClicks",
    threshold: 5,
    condition: "above",
    enabled: true,
    triggeredCount: 1,
  },
  {
    id: "3",
    name: "Low Engagement",
    metric: "score",
    threshold: 20,
    condition: "below",
    enabled: false,
    triggeredCount: 0,
  },
];

const metricLabels = {
  score: "Cognitive Load Score",
  rageClicks: "Rage Clicks",
  hesitations: "Decision Hesitations",
  backtracking: "Backtracking Events",
};

export function ThresholdAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(defaultAlerts);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: "",
    metric: "score" as Alert["metric"],
    threshold: 70,
    condition: "above" as Alert["condition"],
  });

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
    toast.success("Alert updated");
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    toast.success("Alert deleted");
  };

  const createAlert = () => {
    if (!newAlert.name.trim()) {
      toast.error("Please enter an alert name");
      return;
    }

    const alert: Alert = {
      id: Date.now().toString(),
      ...newAlert,
      enabled: true,
      triggeredCount: 0,
    };

    setAlerts((prev) => [...prev, alert]);
    setNewAlert({ name: "", metric: "score", threshold: 70, condition: "above" });
    setIsCreating(false);
    toast.success("Alert created");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Threshold Alerts
              </CardTitle>
              <CardDescription>
                Get notified when metrics exceed your defined thresholds
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsCreating(!isCreating)}
              variant={isCreating ? "outline" : "default"}
              size="sm"
            >
              {isCreating ? "Cancel" : "New Alert"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreating && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alert Name</Label>
                    <Input
                      placeholder="e.g., High Friction Warning"
                      value={newAlert.name}
                      onChange={(e) =>
                        setNewAlert((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Metric</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={newAlert.metric}
                      onChange={(e) =>
                        setNewAlert((prev) => ({
                          ...prev,
                          metric: e.target.value as Alert["metric"],
                        }))
                      }
                    >
                      <option value="score">Cognitive Load Score</option>
                      <option value="rageClicks">Rage Clicks</option>
                      <option value="hesitations">Decision Hesitations</option>
                      <option value="backtracking">Backtracking Events</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={newAlert.condition}
                      onChange={(e) =>
                        setNewAlert((prev) => ({
                          ...prev,
                          condition: e.target.value as Alert["condition"],
                        }))
                      }
                    >
                      <option value="above">Above threshold</option>
                      <option value="below">Below threshold</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Threshold Value</Label>
                    <Input
                      type="number"
                      value={newAlert.threshold}
                      onChange={(e) =>
                        setNewAlert((prev) => ({
                          ...prev,
                          threshold: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <Button onClick={createAlert} className="w-full">
                  Create Alert
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.enabled
                    ? "border-border bg-card"
                    : "border-border/30 bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      alert.enabled ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    {alert.enabled ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{alert.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {metricLabels[alert.metric]} {alert.condition}{" "}
                      {alert.threshold}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {alert.triggeredCount > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {alert.triggeredCount} triggers
                    </Badge>
                  )}
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={() => toggleAlert(alert.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlert(alert.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No alerts configured</p>
                <p className="text-sm">Create your first alert to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
