import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";

export default function VideoResultPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/video-result/:id");
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Redirect if not authenticated
  //if (!authLoading && !isAuthenticated) {
    //setLocation("/");
    //return null;
  //}

  const videoId = params?.id ? parseInt(params.id) : null;
  const { data: video, isLoading, error } = trpc.videos.getById.useQuery(
    { id: videoId! },
    { enabled: !!videoId }
  );

  // Fetch frame detections separately
  const { data: frameDetections = [] } = trpc.videos.getFrames.useQuery(
    { videoDetectionId: videoId! },
    { enabled: !!videoId }
  );

  if (!videoId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 border-border text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Invalid video ID</p>
        </Card>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (!frameDetections || frameDetections.length === 0) {
      toast.error("No detections to export");
      return;
    }

    const rows = frameDetections.map((d: any) => [
      d.frameNumber,
      d.timestamp,
      d.plateNumber,
      d.confidence,
    ]);

    const csv = [
      ["Frame", "Timestamp (s)", "Plate Number", "Confidence (%)"],
      ...rows,
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video_detections_${video?.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleExportJSON = () => {
    if (!frameDetections || frameDetections.length === 0) {
      toast.error("No detections to export");
      return;
    }

    const data = {
      videoId: video?.id,
      fileName: video?.fileName,
      duration: video?.duration,
      frameCount: video?.frameCount,
      totalDetections: frameDetections.length,
      detections: frameDetections.map((d: any) => ({
        frameNumber: d.frameNumber,
        timestamp: d.timestamp,
        plateNumber: d.plateNumber,
        confidence: d.confidence,
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video_detections_${video?.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported successfully");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading video results...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Card className="p-8 border-border text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load video results</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Video Detection Results</h1>
          <p className="text-muted-foreground">{video.fileName}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Frames</p>
            <p className="text-3xl font-bold text-foreground">{video.frameCount}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Plates Detected</p>
            <p className="text-3xl font-bold text-blue-600">{frameDetections.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Duration</p>
            <p className="text-3xl font-bold text-foreground">{video.duration.toFixed(1)}s</p>
          </Card>
        </div>

        {/* Frame Viewer */}
        {frameDetections.length > 0 ? (
          <Card className="p-8 mb-8">
            <div className="space-y-6">
              {/* Frame Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Frame Timeline</h2>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={18} />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={18} />
                        Play
                      </>
                    )}
                  </button>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={frameDetections.length - 1}
                    value={currentFrameIndex}
                    onChange={(e) => setCurrentFrameIndex(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {currentFrameIndex + 1} / {frameDetections.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Detection */}
              {frameDetections[currentFrameIndex] && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Detected Plate</p>
                      <p className="text-4xl font-bold text-blue-600 font-mono">
                        {frameDetections[currentFrameIndex].plateNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Confidence Score</p>
                      <div className="space-y-2">
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all"
                            style={{
                              width: `${frameDetections[currentFrameIndex].confidence}%`,
                            }}
                          />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {frameDetections[currentFrameIndex].confidence}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Frame Number</p>
                      <p className="font-semibold text-foreground">
                        {frameDetections[currentFrameIndex].frameNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Timestamp</p>
                      <p className="font-semibold text-foreground">
                        {frameDetections[currentFrameIndex].timestamp}s
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-8 mb-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No plates detected in this video</p>
          </Card>
        )}

        {/* Detections List */}
        {frameDetections.length > 0 && (
          <Card className="p-8 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">All Detections</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Frame</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Timestamp</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Plate Number</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {frameDetections.map((detection: any, index: number) => (
                    <tr
                      key={index}
                      className={`border-b border-border hover:bg-card/30 cursor-pointer transition-colors ${
                        index === currentFrameIndex ? "bg-blue-50" : ""
                      }`}
                      onClick={() => setCurrentFrameIndex(index)}
                    >
                      <td className="py-3 px-4">{detection.frameNumber}</td>
                      <td className="py-3 px-4">{detection.timestamp}s</td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                        {detection.plateNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full"
                              style={{ width: `${detection.confidence}%` }}
                            />
                          </div>
                          <span>{detection.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Export Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleExportCSV}
            disabled={frameDetections.length === 0}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Export as CSV
          </Button>
          <Button
            onClick={handleExportJSON}
            disabled={frameDetections.length === 0}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Export as JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
