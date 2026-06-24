import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Download, CheckCircle2, AlertCircle, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useRef, useEffect, useState } from "react";

export default function ResultPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/result/:id");
  const detectionId = params?.id ? parseInt(params.id) : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Redirect if not authenticated
  //if (!authLoading && !isAuthenticated) {
    //setLocation("/");
    //return null;
  //}

  const { data: detection, isLoading, error } = trpc.detections.getById.useQuery(
    { id: detectionId || 0 },
    { enabled: !!detectionId }
  );

  // Draw bounding box on canvas when detection loads
  useEffect(() => {
    if (!detection || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const boundingBox = JSON.parse(detection.boundingBox);

    // Create a placeholder image with bounding box visualization
    canvas.width = 600;
    canvas.height = 400;

    // Draw background
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw placeholder text
    ctx.fillStyle = "#64748b";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Original Vehicle Image", canvas.width / 2, 50);
    ctx.fillText(`(Storage Key: ${detection.originalImageKey.substring(0, 40)}...)`, canvas.width / 2, 80);

    // Draw bounding box
    const scale = Math.min(
      (canvas.width - 40) / 800,
      (canvas.height - 120) / 600
    );
    const x = 20 + boundingBox.x * scale;
    const y = 120 + boundingBox.y * scale;
    const width = boundingBox.width * scale;
    const height = boundingBox.height * scale;

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Draw corner markers
    const cornerSize = 10;
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x - cornerSize / 2, y - cornerSize / 2, cornerSize, cornerSize);
    ctx.fillRect(x + width - cornerSize / 2, y - cornerSize / 2, cornerSize, cornerSize);
    ctx.fillRect(x - cornerSize / 2, y + height - cornerSize / 2, cornerSize, cornerSize);
    ctx.fillRect(x + width - cornerSize / 2, y + height - cornerSize / 2, cornerSize, cornerSize);

    // Draw label
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(x, y - 30, 120, 25);
    ctx.fillStyle = "white";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Detected Plate", x + 5, y - 12);
  }, [detection]);

  if (!match || !detectionId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Detection Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            The detection you're looking for doesn't exist.
          </p>
          <Button onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading detection results...</p>
        </Card>
      </div>
    );
  }

  if (error || !detection) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Error Loading Result
          </h2>
          <p className="text-muted-foreground mb-6">
            {error?.message || "Failed to load detection result"}
          </p>
          <Button onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const boundingBox = JSON.parse(detection.boundingBox);
  const detectedAt = new Date(detection.detectedAt).toLocaleString();

  const handleDownload = () => {
    const data = {
      plateNumber: detection.plateNumber,
      confidence: detection.confidence,
      detectedAt: detection.detectedAt,
      originalImageKey: detection.originalImageKey,
      croppedPlateKey: detection.croppedPlateKey,
      boundingBox: boundingBox,
    };

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2))
    );
    element.setAttribute("download", `detection-${detectionId}.json`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Result downloaded");
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AP</span>
            </div>
            <span className="font-semibold text-foreground">ANPR System</span>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setLocation("/upload")} variant="outline" size="sm">
              New Upload
            </Button>
            <Button onClick={() => setLocation("/dashboard")} variant="outline" size="sm">
              View History
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <Button
          onClick={() => setLocation("/dashboard")}
          variant="ghost"
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Result Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plate Number Card */}
            <Card className="p-8 border-border bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Detected Plate Number
                  </p>
                  <h1 className="text-5xl font-bold text-blue-600 font-mono tracking-wider">
                    {detection.plateNumber}
                  </h1>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  {detection.confidence}% Confidence
                </span>
              </div>
            </Card>

            {/* Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Image with Bounding Box */}
              <Card className="overflow-hidden border-border">
                <div className="bg-card/50">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
                <div className="p-4 border-t border-border">
                  <p className="text-xs text-muted-foreground break-all">
                    Key: {detection.originalImageKey}
                  </p>
                </div>
              </Card>

              {/* Cropped Plate */}
              <Card className="overflow-hidden border-border">
                <div className="bg-card/50 aspect-square flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-foreground mb-2">
                      Detected Plate Region
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      {Math.round(boundingBox.width)} × {Math.round(boundingBox.height)}px
                    </div>
                    <p className="text-xs text-muted-foreground break-all">
                      Key: {detection.croppedPlateKey}
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Cropped from original image
                  </p>
                </div>
              </Card>
            </div>

            {/* Details */}
            <Card className="p-6 border-border">
              <h3 className="font-semibold text-foreground mb-4">Detection Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Detected At</span>
                  <span className="font-medium text-foreground">{detectedAt}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Confidence Score</span>
                  <span className="font-medium text-foreground">{detection.confidence}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Bounding Box</span>
                  <span className="font-mono text-sm text-foreground">
                    {Math.round(boundingBox.width)} × {Math.round(boundingBox.height)}px
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Position</span>
                  <span className="font-mono text-sm text-foreground">
                    ({Math.round(boundingBox.x)}, {Math.round(boundingBox.y)})
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="p-6 border-border">
              <h3 className="font-semibold text-foreground mb-4">Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                <Button
                  onClick={handleBookmark}
                  variant={isBookmarked ? "default" : "outline"}
                  className="w-full"
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </Button>
                <Button
                  onClick={() => setLocation("/upload")}
                  variant="outline"
                  className="w-full"
                >
                  Detect Another
                </Button>
              </div>
            </Card>

            {/* Confidence Indicator */}
            <Card className="p-6 border-border">
              <h3 className="font-semibold text-foreground mb-4">Confidence Level</h3>
              <div className="space-y-3">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      detection.confidence >= 90
                        ? "bg-green-500"
                        : detection.confidence >= 70
                        ? "bg-yellow-500"
                        : "bg-destructive/100"
                    }`}
                    style={{ width: `${detection.confidence}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-semibold text-foreground">
                    {detection.confidence}%
                  </span>
                  <span>100%</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  {detection.confidence >= 90
                    ? "Excellent detection quality"
                    : detection.confidence >= 70
                    ? "Good detection quality"
                    : "Low confidence - manual review recommended"}
                </p>
              </div>
            </Card>

            {/* Info */}
            <Card className="p-6 border-border bg-blue-50">
              <h3 className="font-semibold text-foreground mb-2">Detection Info</h3>
              <p className="text-sm text-muted-foreground">
                This detection is stored securely and can be accessed anytime from your history dashboard.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
