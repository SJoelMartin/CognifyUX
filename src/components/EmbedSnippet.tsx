import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Check, FileCode, Puzzle } from "lucide-react";
import { toast } from "sonner";

interface SnippetConfig {
  siteId: string;
  trackClicks: boolean;
  trackScrolls: boolean;
  trackForms: boolean;
  trackHover: boolean;
  batchInterval: number;
  selectorDenyList: string;
}

export function EmbedSnippet() {
  const [copied, setCopied] = useState<string | null>(null);
  const [config, setConfig] = useState<SnippetConfig>({
    siteId: "your-site-id",
    trackClicks: true,
    trackScrolls: true,
    trackForms: true,
    trackHover: true,
    batchInterval: 2000,
    selectorDenyList: "[data-cla-ignore]",
  });

  const cdnSnippet = `<!-- Cognitive Load Analyzer -->
<script>
  (function(w,d,s,l,i){
    w[l]=w[l]||[];
    w[l].push({'cla.start':new Date().getTime(),event:'cla.js'});
    var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='claLayer'?'&l='+l:'';
    j.async=true;
    j.src='https://cdn.cognitiveload.dev/cla.js?id='+i+dl;
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','claLayer','${config.siteId}');
</script>
<!-- End Cognitive Load Analyzer -->`;

  const npmSnippet = `// Install the package
npm install @cognitive-load/tracker

// In your app entry point (e.g., main.tsx)
import { initCLA } from '@cognitive-load/tracker';

initCLA({
  siteId: '${config.siteId}',
  trackClicks: ${config.trackClicks},
  trackScrolls: ${config.trackScrolls},
  trackForms: ${config.trackForms},
  trackHover: ${config.trackHover},
  batchInterval: ${config.batchInterval},
  selectorDenyList: '${config.selectorDenyList}',
});`;

  const reactSnippet = `// Install the package
npm install @cognitive-load/react

// Wrap your app with the provider
import { CognitiveLoadProvider } from '@cognitive-load/react';

function App() {
  return (
    <CognitiveLoadProvider
      siteId="${config.siteId}"
      config={{
        trackClicks: ${config.trackClicks},
        trackScrolls: ${config.trackScrolls},
        trackForms: ${config.trackForms},
        trackHover: ${config.trackHover},
        batchInterval: ${config.batchInterval},
        selectorDenyList: '${config.selectorDenyList}',
      }}
    >
      <YourApp />
    </CognitiveLoadProvider>
  );
}

// Use the hook in components
import { useCognitiveLoad } from '@cognitive-load/react';

function MyComponent() {
  const { trackEvent, sessionId } = useCognitiveLoad();
  
  const handleImportantAction = () => {
    trackEvent('custom_action', { action: 'checkout' });
  };
  
  return <button onClick={handleImportantAction}>Checkout</button>;
}`;

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Integration Snippet
          </CardTitle>
          <CardDescription>
            Add the tracking script to your website or application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Site ID</Label>
              <Input
                value={config.siteId}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, siteId: e.target.value }))
                }
                placeholder="your-site-id"
              />
            </div>
            <div className="space-y-2">
              <Label>Batch Interval (ms)</Label>
              <Input
                type="number"
                value={config.batchInterval}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    batchInterval: parseInt(e.target.value) || 2000,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Selector Deny List</Label>
              <Input
                value={config.selectorDenyList}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    selectorDenyList: e.target.value,
                  }))
                }
                placeholder="[data-cla-ignore]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={config.trackClicks}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, trackClicks: checked }))
                }
              />
              <Label>Track Clicks</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.trackScrolls}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, trackScrolls: checked }))
                }
              />
              <Label>Track Scrolls</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.trackForms}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, trackForms: checked }))
                }
              />
              <Label>Track Forms</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.trackHover}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, trackHover: checked }))
                }
              />
              <Label>Track Hover</Label>
            </div>
          </div>

          <Tabs defaultValue="cdn" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cdn" className="gap-2">
                <FileCode className="h-4 w-4" />
                CDN Script
              </TabsTrigger>
              <TabsTrigger value="npm" className="gap-2">
                <Code className="h-4 w-4" />
                NPM Package
              </TabsTrigger>
              <TabsTrigger value="react" className="gap-2">
                <Puzzle className="h-4 w-4" />
                React
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cdn" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted/50 border border-border overflow-x-auto text-sm font-mono">
                  <code>{cdnSnippet}</code>
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 gap-2"
                  onClick={() => copyToClipboard(cdnSnippet, "cdn")}
                >
                  {copied === "cdn" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Paste this snippet in the <code>&lt;head&gt;</code> section of
                your HTML
              </p>
            </TabsContent>

            <TabsContent value="npm" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted/50 border border-border overflow-x-auto text-sm font-mono">
                  <code>{npmSnippet}</code>
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 gap-2"
                  onClick={() => copyToClipboard(npmSnippet, "npm")}
                >
                  {copied === "npm" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="react" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted/50 border border-border overflow-x-auto text-sm font-mono">
                  <code>{reactSnippet}</code>
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 gap-2"
                  onClick={() => copyToClipboard(reactSnippet, "react")}
                >
                  {copied === "react" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
