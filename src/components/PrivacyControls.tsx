import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Trash2, 
  Download,
  Clock,
  Lock,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";
import { toast } from "sonner";

interface PrivacySettings {
  redactInputs: boolean;
  redactTextareas: boolean;
  redactContentEditable: boolean;
  retentionDays: number;
  allowList: string[];
  denyList: string[];
  auditLogging: boolean;
}

const defaultSettings: PrivacySettings = {
  redactInputs: true,
  redactTextareas: true,
  redactContentEditable: true,
  retentionDays: 30,
  allowList: [],
  denyList: ['[data-sensitive]', '[type="password"]', '[type="email"]', '.credit-card'],
  auditLogging: true,
};

export const PrivacyControls = () => {
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);
  const [allowListInput, setAllowListInput] = useState("");
  const [denyListInput, setDenyListInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K, 
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success(`Privacy setting updated: ${key}`);
  };

  const addToList = (type: 'allow' | 'deny') => {
    const input = type === 'allow' ? allowListInput : denyListInput;
    if (!input.trim()) return;
    
    const key = type === 'allow' ? 'allowList' : 'denyList';
    const current = settings[key];
    
    if (!current.includes(input.trim())) {
      updateSetting(key, [...current, input.trim()]);
    }
    
    if (type === 'allow') {
      setAllowListInput("");
    } else {
      setDenyListInput("");
    }
  };

  const removeFromList = (type: 'allow' | 'deny', selector: string) => {
    const key = type === 'allow' ? 'allowList' : 'denyList';
    updateSetting(key, settings[key].filter(s => s !== selector));
  };

  const handleDataExport = () => {
    // Simulate GDPR data export
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Preparing data export...',
        success: 'Data export ready for download',
        error: 'Export failed',
      }
    );
  };

  const handleDataDeletion = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Processing deletion request...',
        success: 'Data scheduled for deletion within 72 hours',
        error: 'Deletion request failed',
      }
    );
  };

  const complianceChecks = [
    { 
      label: "Input value capture disabled", 
      passed: !settings.redactInputs ? false : true,
      critical: true 
    },
    { 
      label: "Default retention ≤ 30 days", 
      passed: settings.retentionDays <= 30,
      critical: true 
    },
    { 
      label: "Sensitive selectors in deny list", 
      passed: settings.denyList.length > 0,
      critical: true 
    },
    { 
      label: "Audit logging enabled", 
      passed: settings.auditLogging,
      critical: false 
    },
    { 
      label: "No PII in allow list", 
      passed: !settings.allowList.some(s => 
        s.toLowerCase().includes('email') || 
        s.toLowerCase().includes('password') ||
        s.toLowerCase().includes('phone')
      ),
      critical: true 
    },
  ];

  const allCriticalPassed = complianceChecks
    .filter(c => c.critical)
    .every(c => c.passed);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy & Compliance
            </CardTitle>
            <CardDescription>
              Configure data collection, retention, and GDPR/CCPA compliance
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={allCriticalPassed 
              ? "border-cla-success/50 text-cla-success" 
              : "border-cla-warning/50 text-cla-warning"
            }
          >
            {allCriticalPassed ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Compliant
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Review Required
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Status */}
        <div className="grid gap-2">
          <div className="text-sm font-medium mb-2">Compliance Checklist</div>
          {complianceChecks.map((check, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-2 rounded-lg ${
                check.passed ? 'bg-cla-success/5' : 'bg-cla-warning/10'
              }`}
            >
              <div className="flex items-center gap-2">
                {check.passed 
                  ? <CheckCircle className="w-4 h-4 text-cla-success" />
                  : <AlertTriangle className="w-4 h-4 text-cla-warning" />
                }
                <span className="text-sm">{check.label}</span>
                {check.critical && (
                  <Badge variant="outline" className="text-xs h-5">Required</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Redaction Settings */}
        <div className="space-y-4">
          <div className="text-sm font-medium">Automatic Redaction</div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="redact-inputs">Redact input fields</Label>
            </div>
            <Switch
              id="redact-inputs"
              checked={settings.redactInputs}
              onCheckedChange={(v) => updateSetting('redactInputs', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="redact-textareas">Redact textareas</Label>
            </div>
            <Switch
              id="redact-textareas"
              checked={settings.redactTextareas}
              onCheckedChange={(v) => updateSetting('redactTextareas', v)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="redact-contenteditable">Redact contenteditable</Label>
            </div>
            <Switch
              id="redact-contenteditable"
              checked={settings.redactContentEditable}
              onCheckedChange={(v) => updateSetting('redactContentEditable', v)}
            />
          </div>
        </div>

        {/* Retention Policy */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="retention">Data Retention (days)</Label>
          </div>
          <div className="flex items-center gap-3">
            <Input
              id="retention"
              type="number"
              min={1}
              max={365}
              value={settings.retentionDays}
              onChange={(e) => updateSetting('retentionDays', parseInt(e.target.value) || 30)}
              className="w-24 bg-muted/30"
            />
            <span className="text-sm text-muted-foreground">
              Data older than {settings.retentionDays} days will be automatically deleted
            </span>
          </div>
        </div>

        {/* Audit Logging */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="audit-logging">Audit Logging</Label>
          </div>
          <Switch
            id="audit-logging"
            checked={settings.auditLogging}
            onCheckedChange={(v) => updateSetting('auditLogging', v)}
          />
        </div>

        {/* Advanced Settings */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </Button>

        {showAdvanced && (
          <div className="space-y-4 pt-2">
            {/* Deny List */}
            <div className="space-y-2">
              <Label>Selector Deny List (never track)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., [data-sensitive]"
                  value={denyListInput}
                  onChange={(e) => setDenyListInput(e.target.value)}
                  className="bg-muted/30"
                />
                <Button size="sm" onClick={() => addToList('deny')}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {settings.denyList.map((selector) => (
                  <Badge 
                    key={selector} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeFromList('deny', selector)}
                  >
                    {selector} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allow List */}
            <div className="space-y-2">
              <Label>Selector Allow List (explicitly track)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., .track-me"
                  value={allowListInput}
                  onChange={(e) => setAllowListInput(e.target.value)}
                  className="bg-muted/30"
                />
                <Button size="sm" onClick={() => addToList('allow')}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {settings.allowList.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No exceptions (tracking disabled elements)</span>
                ) : (
                  settings.allowList.map((selector) => (
                    <Badge 
                      key={selector} 
                      variant="outline"
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => removeFromList('allow', selector)}
                    >
                      {selector} ×
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* GDPR Actions */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={handleDataExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export Data (GDPR)
          </Button>
          <Button variant="outline" size="sm" onClick={handleDataDeletion} className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
            Request Deletion
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
