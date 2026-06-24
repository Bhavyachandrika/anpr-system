import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createDetection,
  getDetectionById,
  getUserDetections,
  searchDetections,
  getUserVideoDetections,
  getVideoDetectionById,
  createVideoDetection,
  createVideoFrameDetection,
  getVideoFrameDetections,
} from "./db";
import { detectPlateFromImage } from "./_core/plateDetection";
import { detectPlatesInVideo, getVideoMetadata } from "./_core/videoProcessing";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  detections: router({
    /**
     * Upload an image and detect license plate.
     * Returns detection result with plate number, confidence, and storage keys.
     */
    detect: publicProcedure
      .input(
        z.object({
          imageBase64: z.string().describe("Base64-encoded image data"),
          fileName: z.string().describe("Original file name"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await detectPlateFromImage(
           input.imageBase64,
           input.fileName,
           ctx.user?.id ?? 0
          );
        return result;
      }),

    /**
     * Get all detections for the current user.
     */
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getUserDetections(ctx.user.id, input.limit, input.offset);
      }),

    /**
     * Get a single detection by ID (user-scoped).
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getDetectionById(input.id, ctx.user.id);
      }),

    /**
     * Search detections with filters.
     */
    search: protectedProcedure
      .input(
        z.object({
          plateNumber: z.string().optional(),
          minConfidence: z.number().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return searchDetections(ctx.user.id, input);
      }),
  }),

  videos: router({
    /**
     * Upload a video and detect license plates in all frames.
     * Returns video detection record with frame-level detections.
     */
    detect: publicProcedure
      .input(
        z.object({
          videoBase64: z.string().optional().describe("Base64-encoded video data (optional if frames provided)"),
          fileName: z.string().describe("Original file name"),
          fps: z.number().default(1).describe("Frames per second to extract"),
          frames: z.array(
            z.object({
              frameNumber: z.number(),
              timestamp: z.number(),
              imageBase64: z.string(),
            })
          ).optional().describe("Pre-extracted frames from browser"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
  let detections: any[] = [];
  let frameCount = 0;
  let duration = 0;

  const userId = ctx.user?.id ?? 0;

  if (input.frames && input.frames.length > 0) {
    frameCount = input.frames.length;
    duration = input.frames[input.frames.length - 1]?.timestamp || 0;

    console.log(
      `[Video Detection] Processing ${frameCount} frames for user ${userId}`
    );

    for (const frame of input.frames) {
      try {
        const detection = await detectPlateFromImage(
          frame.imageBase64,
          `frame_${frame.frameNumber}.jpg`,
          userId
        );

        if (detection && detection.plateNumber) {
          detections.push({
            frameNumber: frame.frameNumber,
            timestamp: frame.timestamp,
            plateNumber: detection.plateNumber,
            confidence: detection.confidence,
            croppedPlateKey: detection.croppedPlateKey,
            boundingBox: detection.boundingBox,
          });
        }
      } catch (error) {
        console.error(
          `[Video Detection] Failed to process frame ${frame.frameNumber}:`,
          error
        );
      }
    }
  } else if (input.videoBase64) {
    const videoBuffer = Buffer.from(input.videoBase64, "base64");
    const metadata = await getVideoMetadata(videoBuffer);

    frameCount = Math.ceil((metadata.duration * input.fps) / 1);
    duration = metadata.duration;

    detections = await detectPlatesInVideo(
      videoBuffer,
      userId,
      input.fps
    );
  } else {
    throw new Error(
      "Either videoBase64 or frames must be provided"
    );
  }

          // Create video detection record
          const videoDetectionResult = await createVideoDetection({
            userId: userId,
            videoKey: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: input.fileName,
            frameCount,
            duration,
            fps: input.fps,
            totalDetections: 0,
          });

          if (!videoDetectionResult) {
            throw new Error("Failed to create video detection record");
          }

          // Extract the inserted ID properly from Drizzle result
          let insertedId: number | undefined;
          if (Array.isArray(videoDetectionResult)) {
            insertedId = (videoDetectionResult as any)[0]?.id;
          } else if ((videoDetectionResult as any).insertId) {
            insertedId = (videoDetectionResult as any).insertId;
          }

          if (!insertedId) {
            throw new Error("Invalid video ID returned from database");
          }

          // Store frame detections
          for (const detection of detections) {
            await createVideoFrameDetection({
              videoDetectionId: insertedId,
              frameNumber: detection.frameNumber,
              timestamp: detection.timestamp,
              plateNumber: detection.plateNumber,
              confidence: detection.confidence,
              croppedPlateKey: detection.croppedPlateKey,
              boundingBox: JSON.stringify(detection.boundingBox),
            });
          }

          return {
            id: insertedId,
            fileName: input.fileName,
            frameCount,
            duration,
            totalDetections: detections.length,
            detections: detections.map((d) => ({
              frameNumber: d.frameNumber,
              timestamp: d.timestamp,
              plateNumber: d.plateNumber,
              confidence: d.confidence,
            })),
          };
        } catch (error) {
          console.error("[Video Detection] Error:", error);
          throw error;
        }
      }),

    /**
     * Get all video detections for the current user.
     */
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getUserVideoDetections(ctx.user.id, input.limit, input.offset);
      }),

    /**
     * Get a single video detection by ID with all frame detections (user-scoped)
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getVideoDetectionById(input.id, ctx.user.id);
      }),

    /**
     * Get frame detections for a specific video
     */
    getFrames: protectedProcedure
      .input(z.object({ videoDetectionId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getVideoFrameDetections(input.videoDetectionId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
