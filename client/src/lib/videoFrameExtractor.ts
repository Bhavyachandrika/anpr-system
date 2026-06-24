/**
 * Browser-based video frame extraction using Canvas API
 * Extracts frames from video at specified intervals and returns as base64 images
 */

export interface ExtractedFrame {
  frameNumber: number;
  timestamp: number;
  base64: string;
}

/**
 * Extract frames from a video file using Canvas API
 * @param videoFile - The video file to extract frames from
 * @param fps - Frames per second to extract (e.g., 1 = extract 1 frame per second)
 * @param maxFrames - Maximum number of frames to extract (default: 30)
 * @returns Array of extracted frames with timestamps
 */
export async function extractVideoFrames(
  videoFile: File,
  fps: number = 1,
  maxFrames: number = 30
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    const frames: ExtractedFrame[] = [];
    let frameCount = 0;
    let currentTime = 0;
    const frameInterval = 1 / fps; // Time between frames in seconds

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;
      const totalFramesToExtract = Math.min(
        Math.ceil(duration * fps),
        maxFrames
      );

      if (totalFramesToExtract === 0) {
        resolve(frames);
        return;
      }

      const extractNextFrame = () => {
        if (frameCount >= totalFramesToExtract) {
          // Clean up
          video.pause();
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        // Draw current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64
        const base64 = canvas.toDataURL("image/jpeg", 0.8);

        frames.push({
          frameNumber: frameCount,
          timestamp: currentTime,
          base64,
        });

        frameCount++;
        currentTime += frameInterval;

        // Extract next frame
        if (frameCount < totalFramesToExtract) {
          video.currentTime = currentTime;
        } else {
          // Done extracting
          video.pause();
          URL.revokeObjectURL(video.src);
          resolve(frames);
        }
      };

      video.onerror = () => {
        reject(new Error("Failed to load video"));
      };

      // Start extraction
      extractNextFrame();
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    // Load video
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.load();
  });
}

/**
 * Get video metadata without extracting frames
 */
export async function getVideoMetadata(
  videoFile: File
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
  });
}
