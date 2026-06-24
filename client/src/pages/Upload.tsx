import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectMutation = trpc.detections.detect.useMutation();

  // Redirect if not authenticated
  //if (!authLoading && !isAuthenticated) {
    //setLocation("/");
    //return null;
  //}

  const handleFileSelect = (file: File) => {
    // Validate file type - only JPG and PNG
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a JPG or PNG image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setPreview(e.target?.result as string);
      } catch (error) {
        toast.error("Failed to load image preview");
        console.error("Preview error:", error);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setSelectedFile(null);
      setPreview("");
    };
    reader.readAsDataURL(file);
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          
          const result = await detectMutation.mutateAsync({
            imageBase64: base64,
            fileName: selectedFile.name,
          });

          toast.success("Plate detected successfully!");
          setLocation(`/result/${result.detectionId}`);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Detection failed"
          );
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file for detection");
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Detection failed"
      );
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          <Button onClick={() => setLocation("/dashboard")} variant="outline" size="sm">
            View History
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Upload Vehicle Image
          </h1>
          <p className="text-lg text-muted-foreground">
            Select a JPG or PNG image to detect and extract license plate information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div>
            <Card
              className={`border-2 border-dashed transition-all cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-border hover:border-slate-400"
              } ${selectedFile ? "bg-card/30" : "bg-white"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadClick}
            >
              <div className="p-12 text-center">
                {selectedFile ? (
                  <div className="space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-semibold text-foreground mb-1">
                        Drag and drop your image here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to select from your device
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG or PNG • Max 10MB
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Preview Area */}
          <div>
            {preview ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-border bg-card/50">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
                <Button
                  onClick={handleDetect}
                  disabled={detectMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  size="lg"
                >
                  {detectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Detecting Plate...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Detect Plate
                    </>
                  )}
                </Button>
                {detectMutation.error && (
                  <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive">Detection Error</p>
                      <p className="text-sm text-destructive">
                        {detectMutation.error.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-8 bg-card/30 border-border h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-muted-foreground">
                    Select an image to see a preview
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground mb-2">Supported Formats</h3>
            <p className="text-sm text-muted-foreground">
              JPG and PNG images up to 10MB in size
            </p>
          </Card>
          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground mb-2">Fast Detection</h3>
            <p className="text-sm text-muted-foreground">
              Results typically available within 2-3 seconds
            </p>
          </Card>
          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground mb-2">Secure Storage</h3>
            <p className="text-sm text-muted-foreground">
              All images securely stored and accessible from your history
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
