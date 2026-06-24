import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import {
  Search,
  Download,
  Plus,
  Loader2,
  AlertCircle,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchPlate, setSearchPlate] = useState("");
  const [minConfidence, setMinConfidence] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "confidence">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Redirect if not authenticated
  //if (!authLoading && !isAuthenticated) {
    //setLocation("/");
    //return null;
  //}

  const { data: detections, isLoading, error } = trpc.detections.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: true }
  );

  // Filter and sort detections
  const filteredDetections = useMemo(() => {
    if (!detections) return [];

    let filtered = detections.filter((detection) => {
      const plateMatch = detection.plateNumber
        .toLowerCase()
        .includes(searchPlate.toLowerCase());
      const confidenceMatch = detection.confidence >= minConfidence;
      return plateMatch && confidenceMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime();
      } else {
        comparison = a.confidence - b.confidence;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [detections, searchPlate, minConfidence, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredDetections.length / itemsPerPage);
  const paginatedDetections = filteredDetections.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleExportCSV = () => {
    if (!filteredDetections.length) {
      toast.error("No detections to export");
      return;
    }

    const headers = ["Plate Number", "Confidence", "Detected At"];
    const rows = filteredDetections.map((d) => [
      d.plateNumber,
      `${d.confidence}%`,
      new Date(d.detectedAt).toLocaleString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute("download", "detections.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("CSV exported successfully");
  };

  const handleExportJSON = () => {
    if (!filteredDetections.length) {
      toast.error("No detections to export");
      return;
    }

    const data = filteredDetections.map((d) => ({
      plateNumber: d.plateNumber,
      confidence: d.confidence,
      detectedAt: d.detectedAt,
      originalImageKey: d.originalImageKey,
      croppedPlateKey: d.croppedPlateKey,
    }));

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2))
    );
    element.setAttribute("download", "detections.json");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("JSON exported successfully");
  };

  const handleClearFilters = () => {
    setSearchPlate("");
    setMinConfidence(0);
    setShowFilters(false);
    setPage(1);
  };

  const hasActiveFilters = searchPlate !== "" || minConfidence > 0;

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
          <Button onClick={() => setLocation("/upload")} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Upload
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Detection History
          </h1>
          <p className="text-lg text-muted-foreground">
            View and manage all your license plate detections
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by plate number..."
                value={searchPlate}
                onChange={(e) => {
                  setSearchPlate(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-white border-border"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={hasActiveFilters ? "default" : "outline"}
              className={hasActiveFilters ? "bg-blue-600" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={handleExportJSON} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-6 border-border bg-card/30">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Minimum Confidence: {minConfidence}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={minConfidence}
                    onChange={(e) => {
                      setMinConfidence(parseInt(e.target.value));
                      setPage(1);
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as "date" | "confidence");
                        setPage(1);
                      }}
                      className="flex-1 px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="date">Date</option>
                      <option value="confidence">Confidence</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-3 py-2 border border-border rounded-lg hover:bg-card/50"
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <Card className="p-12 text-center border-border">
            <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading detections...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 border-border">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Error Loading Detections</h3>
                <p className="text-sm text-destructive">{error.message}</p>
              </div>
            </div>
          </Card>
        ) : filteredDetections.length === 0 ? (
          <Card className="p-12 text-center border-border">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? "No detections match your filters" : "No detections yet"}
            </p>
            {!hasActiveFilters && (
              <Button onClick={() => setLocation("/upload")}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Your First Image
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedDetections.map((detection) => (
                <Card
                  key={detection.id}
                  className="p-4 border-border hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setLocation(`/result/${detection.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-mono font-bold text-blue-600">
                            {detection.plateNumber}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(detection.detectedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            {detection.confidence}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-4" />
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    onClick={() => setPage(p)}
                    variant={page === p ? "default" : "outline"}
                    className={page === p ? "bg-blue-600" : ""}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Summary */}
        {!isLoading && !error && detections && detections.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-border">
              <p className="text-sm text-muted-foreground mb-1">Total Detections</p>
              <p className="text-3xl font-bold text-foreground">{detections.length}</p>
            </Card>
            <Card className="p-6 border-border">
              <p className="text-sm text-muted-foreground mb-1">Filtered Results</p>
              <p className="text-3xl font-bold text-foreground">{filteredDetections.length}</p>
            </Card>
            <Card className="p-6 border-border">
              <p className="text-sm text-muted-foreground mb-1">Average Confidence</p>
              <p className="text-3xl font-bold text-foreground">
                {Math.round(
                  detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
                )}
                %
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
