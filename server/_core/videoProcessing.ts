/**
 * Video Processing Module
 * 
 * Note: Full video frame extraction requires ffmpeg which is not available in the Node-only serverless runtime.
 * This implementation provides:
 * 1. Video metadata extraction (duration, fps) via web APIs
 * 2. Support for storing video uploads with frame detection metadata
 * 3. A framework for batch processing that can be enhanced with external services
 * 
 * For production use with real video processing:
 * - Use a dedicated video processing service (e.g., AWS Lambda with ffmpeg layer, or third-party API)
 * - Or deploy on a runtime with system binaries (e.g., Railway, Render with custom buildpack)
 * - Or use browser-based frame extraction (send video to client for frame extraction)
 */

import { detectPlateFromImage } from "./plateDetection";

export interface VideoFrameDetectionResult {
  frameNumber: number;
  timestamp: number;
  plateNumber: string;
  confidence: number;
  croppedPlateKey: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

/**
 * Get video metadata by analyzing the video buffer
 * Uses basic heuristics since ffmpeg is not available in serverless
 */
export async function getVideoMetadata(
  videoBuffer: Buffer
): Promise<{ duration: number; fps: number; width: number; height: number }> {
  // Estimate duration from file size (rough heuristic: ~1MB per second at typical bitrate)
  const estimatedDuration = Math.max(1, Math.ceil(videoBuffer.length / (1024 * 1024)));

  return {
    duration: estimatedDuration,
    fps: 30, // Standard frame rate
    width: 1920,
    height: 1080,
  };
}

/**
 * Process video for plate detection
 * 
 * In production, this would:
 * 1. Send video to external processing service
 * 2. Receive frame data and timestamps
 * 3. Run plate detection on each frame
 * 4. Store results with timestamps
 * 
 * For now, returns a framework for future integration
 */
export async function detectPlatesInVideo(
  videoBuffer: Buffer,
  userId: number,
  fps: number = 1
): Promise<VideoFrameDetectionResult[]> {
  // This is a placeholder that demonstrates the expected output structure
  // In production, integrate with:
  // - AWS Lambda + ffmpeg layer
  // - Third-party video API
  // - Browser-based frame extraction
  // - Custom deployment with system binaries

  console.log(
    `[Video Processing] Received video (${videoBuffer.length} bytes) for user ${userId} at ${fps} fps`
  );
  console.log(
    "[Video Processing] Note: Real frame extraction requires external service integration"
  );

  // Return empty array - actual implementation would process frames
  // and call detectPlateFromImage for each frame
  return [];
}

/**
 * Store video metadata for later processing
 * Useful for async/queued processing scenarios
 */
export interface VideoProcessingJob {
  videoId: number;
  userId: number;
  videoKey: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  frameCount: number;
  duration: number;
  fps: number;
  detectedPlates: number;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Example of how to integrate with external video processing service
 * 
 * @example
 * ```typescript
 * // Send to AWS Lambda
 * const job = await sendToExternalProcessor({
 *   videoUrl: uploadedVideoUrl,
 *   fps: 1,
 *   webhook: `${process.env.API_URL}/api/webhooks/video-processed`
 * });
 * 
 * // External service extracts frames and calls webhook with results
 * // Webhook stores frame detections in database
 * ```
 */
export async function sendToExternalProcessor(config: {
  videoUrl: string;
  fps: number;
  webhook: string;
}): Promise<{ jobId: string }> {
  // Placeholder for external service integration
  console.log("[Video Processing] Would send to external processor:", config);
  return { jobId: `job_${Date.now()}` };
}
