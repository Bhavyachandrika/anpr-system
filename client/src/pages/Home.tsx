import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { CheckCircle2, Upload, Zap, BarChart3, Shield, Clock } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
  setLocation("/upload");
};

const handleVideoUpload = () => {
  setLocation("/video-upload");
};

  const features = [
    {
      icon: Upload,
      title: "Smart Upload",
      description: "Drag and drop vehicle images or select from your device. Supports JPG and PNG formats.",
    },
    {
      icon: Zap,
      title: "AI Detection",
      description: "Advanced LLM vision technology instantly detects and extracts license plate information.",
    },
    {
      icon: BarChart3,
      title: "Confidence Scoring",
      description: "Every detection includes a confidence percentage to ensure accuracy and reliability.",
    },
    {
      icon: Shield,
      title: "Secure Storage",
      description: "All your detection data and images are securely stored in encrypted cloud storage.",
    },
    {
      icon: Clock,
      title: "Full History",
      description: "Access your complete detection history with search, filter, and export capabilities.",
    },
    {
      icon: CheckCircle2,
      title: "Export Ready",
      description: "Download your results as CSV or JSON for seamless integration with other systems.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AP</span>
            </div>
            <span className="font-semibold text-foreground">ANPR System</span>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
              <Button
                onClick={() => setLocation("/dashboard")}
                variant="outline"
                size="sm"
              >
                Dashboard
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              AI-Powered Vehicle
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                License Plate Recognition
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Instantly detect and extract license plate information from vehicle images using advanced AI vision technology. Secure, accurate, and ready for enterprise use.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
            >
              Upload Image →
            </Button>
            <Button
              onClick={handleVideoUpload}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
            >
              Upload Video →
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="text-3xl font-bold text-blue-400">99%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Detection Time</div>
              <div className="text-3xl font-bold text-blue-400">&lt;2s</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Scalable</div>
              <div className="text-3xl font-bold text-blue-400">∞</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for professional license plate recognition
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 group cursor-pointer bg-card border-border"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-all">
                    <Icon size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 md:p-16 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            Start detecting license plates in seconds. No setup required.
          </p>
          <Button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 text-lg"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AP</span>
              </div>
              <span className="font-semibold text-foreground">ANPR System</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 ANPR System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
