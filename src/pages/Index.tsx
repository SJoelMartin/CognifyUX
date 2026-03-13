import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  MousePointer2, 
  Activity, 
  Shield, 
  BarChart3, 
  Zap,
  ArrowRight,
  Code,
  Eye,
  Target,
  Moon,
  Sun
} from "lucide-react";
import { useEffect, useState } from "react";

const Index = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Default to dark mode
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const features = [
    {
      icon: MousePointer2,
      title: "Interaction Tracking",
      description: "Capture clicks, hovers, scrolls, and navigation patterns without capturing PII.",
    },
    {
      icon: Brain,
      title: "Cognitive Load Scoring",
      description: "Get a 0-100 score measuring user cognitive effort on each page.",
    },
    {
      icon: Target,
      title: "Friction Hotspots",
      description: "Identify exactly where users struggle with hesitation and rage clicks.",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Live dashboard with session replay, heatmaps, and trend analysis.",
    },
    {
      icon: Shield,
      title: "Privacy-First",
      description: "No keystrokes, no form values, automatic PII redaction built-in.",
    },
    {
      icon: Zap,
      title: "Lightweight Script",
      description: "<8KB gzipped, async loading, zero impact on page performance.",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 cla-grid-bg opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center cla-glow-sm">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg font-mono">CognifyUX</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link to="/demo" className="text-muted-foreground hover:text-foreground transition-colors">
                Quick Demo
              </Link>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                className="text-muted-foreground"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Link to="/demo">
                <Button variant="outline" size="sm">
                  Try Demo
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-fade-in">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Measure What Matters</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-slide-up">
              Understand{" "}
              <span className="cla-gradient-text">Cognitive Load</span>
              <br />
              on Your Interfaces
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up animation-delay-100">
              Measure user friction, identify hesitation patterns, and get actionable UX 
              recommendations — all while respecting user privacy.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
              <Link to="/demo">
                <Button size="lg" className="gap-2 cla-glow">
                  <Eye className="w-5 h-5" />
                  Experience Demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="gap-2">
                  <Code className="w-5 h-5" />
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Score Preview */}
          <div className="mt-20 max-w-lg mx-auto animate-slide-up animation-delay-300">
            <Card className="cla-glass">
              <CardContent className="p-8">
                <div className="text-sm text-muted-foreground mb-4 font-mono">Sample Cognitive Load Score</div>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-7xl font-bold cla-gradient-text font-mono">42</div>
                  <div className="text-left">
                    <div className="text-2xl font-semibold text-cla-moderate">Moderate</div>
                    <div className="text-sm text-muted-foreground">Some friction detected</div>
                  </div>
                </div>
                <div className="mt-6 h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cla-low via-cla-mild via-cla-moderate to-cla-high animate-score-fill"
                    style={{ '--score-width': '42%' } as React.CSSProperties}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
                  <span>Low (0-20)</span>
                  <span>Mild (21-40)</span>
                  <span>Moderate (41-70)</span>
                  <span>High (71-100)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Measure UX Friction
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete toolkit for understanding and improving user experience through 
              cognitive load analysis.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="cla-metric-card animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Integration Section */}
        <section className="container mx-auto px-6 py-24">
          <Card className="cla-glass overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
              <div>
                <h2 className="text-3xl font-bold mb-4">
                  One-Line Integration
                </h2>
                <p className="text-muted-foreground mb-6">
                  Add cognitive load tracking to any website with a single script tag. 
                  For React apps, use our provider component for even easier integration.
                </p>
                <Link to="/demo">
                  <Button className="gap-2 cla-glow-sm">
                    See It in Action
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="bg-secondary/50 rounded-lg p-6 font-mono text-sm overflow-x-auto border border-border">
                <div className="text-muted-foreground mb-4">{"<!-- Script Tag -->"}</div>
                <code className="text-primary">
                  {'<script src="https://cdn.cla.dev/tracker.js"'}
                  <br />
                  {'  data-key="your-api-key"'}
                  <br />
                  {'  async></script>'}
                </code>
                <div className="text-muted-foreground mt-6 mb-4">{"// React Provider"}</div>
                <code className="text-accent-foreground">
                  {"<CognitiveLoadProvider config={{ debug: true }}>"}
                  <br />
                  {"  <App />"}
                  <br />
                  {"</CognitiveLoadProvider>"}
                </code>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-medium font-mono">Cognitive Load Analyzer</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Ease of Digital Products • Privacy-first design
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
