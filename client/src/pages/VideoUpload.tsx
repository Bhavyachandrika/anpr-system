import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Upload, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { extractVideoFrames } from "@/lib/videoFrameExtractor";

export default function VideoUploadPage() {
  //const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [fps, setFps] = useState(1);

  const detectMutation = trpc.videos.detect.useMutation();

  // Redirect if not authenticated
 // if (!authLoading && !isAuthenticated) {
   // setLocation("/");
    //return null;
  //}

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid video file (MP4, WebM, MOV, AVI)");
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video file must be smaller than 500MB");
      return;
    }

    setVideoFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    try {
      toast.loading("Extracting frames from video...");

      // Extract frames from video using Canvas API
      const frames = await extractVideoFrames(videoFile, fps, 30);

      if (frames.length === 0) {
        toast.dismiss();
        toast.error("No frames could be extracted from the video");
        return;
      }

      toast.loading(`Processing ${frames.length} frames for plate detection...`);

      try {
        const result = await detectMutation.mutateAsync({
          videoBase64: "", // Not used with frame-based detection
          fileName: videoFile.name,
          fps,
          frames: frames.map((f) => ({
            frameNumber: f.frameNumber,
            timestamp: f.timestamp,
            imageBase64: f.base64.split(",")[1], // Remove data:image/jpeg;base64, prefix
          })),
        });

        toast.dismiss();
        toast.success(`Detected ${result.totalDetections} plates in video`);

        // Navigate to video results
        setLocation(`/video-result/${result.id}`);
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || "Video processing failed");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Frame extraction failed");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Upload Video</h1>
          <p className="text-muted-foreground">
            Upload a video file to detect license plates in all frames
          </p>
        </div>

        {/* Upload Area */}
        <Card className="border-2 border-dashed border-border hover:border-blue-400 transition-colors p-8 mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`text-center cursor-pointer transition-all ${
              isDragging ? "bg-blue-50 border-blue-400" : ""
            }`}
          >
            {videoPreview ? (
              <div className="space-y-4">
                <video
                  src={videoPreview}
                  className="w-full max-h-64 rounded-lg bg-black"
                  controls
                />
                <p className="text-sm text-muted-foreground">{videoFile?.name}</p>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview("");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Choose Different Video
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload size={48} className="mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Drag and drop your video here
                  </p>
                  <p className="text-sm text-muted-foreground">or click to select a file</p>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="video-input"
                />
                <label
                  htmlFor="video-input"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Select Video
                </label>
                <p className="text-xs text-muted-foreground">MP4, WebM, MOV, AVI • Max 500MB</p>
              </div>
            )}
          </div>
        </Card>

        {/* FPS Setting */}
        <Card className="p-6 mb-6">
          <label className="block text-sm font-semibold text-foreground mb-3">
            Frames Per Second (FPS)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={fps}
              onChange={(e) => setFps(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-muted-foreground w-12">{fps} fps</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Higher FPS = more frames to process = slower but more thorough detection
          </p>
        </Card>

        {/* Upload Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleUpload}
            disabled={!videoFile || detectMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {detectMutation.isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload size={20} />
                Process Video
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {detectMutation.isError && (
          <Card className="mt-6 p-4 bg-destructive/10 border-destructive">
            <div className="flex gap-3">
              <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Processing Failed</p>
                <p className="text-sm text-destructive mt-1">
                  {detectMutation.error?.message || "An error occurred while processing the video"}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
