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
      return { success: true } as const;
    }),
  }),

  detections: router({
    detect: publicProcedure
      .input(z.object({
        imageBase64: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await detectPlateFromImage(input.imageBase64, input.fileName, ctx.user?.id ?? 0);
      }),

    list: publicProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return getUserDetections(0, input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDetectionById(input.id, 0);
      }),

    search: publicProcedure
      .input(z.object({
        plateNumber: z.string().optional(),
        minConfidence: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return searchDetections(0, input);
      }),
  }),

  videos: router({
    detect: publicProcedure
      .input(z.object({
        videoBase64: z.string().optional(),
        fileName: z.string(),
        fps: z.number().default(1),
        frames: z.array(z.object({
          frameNumber: z.number(),
          timestamp: z.number(),
          imageBase64: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          let detections: any[] = [];
          let frameCount = 0;
          let duration = 0;
          const userId = ctx.user?.id ?? 0;

          if (input.frames && input.frames.length > 0) {
            frameCount = input.frames.length;
            duration = input.frames[input.frames.length - 1]?.timestamp || 0;

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
                console.error(`[Video] Failed frame ${frame.frameNumber}:`, error);
              }
            }
          } else {
            throw new Error("frames must be provided");
          }

          const videoDetectionResult = await createVideoDetection({
            userId,
            videoKey: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            frameCount,
            duration,
            fps: input.fps,
            status: "completed",
          });

          let insertedId: number = Date.now();
          if (videoDetectionResult) {
            const r = videoDetectionResult as any;
            if (r.insertId) insertedId = r.insertId;
            else if (r[0]?.insertId) insertedId = r[0].insertId;
          }

          for (const detection of detections) {
            await createVideoFrameDetection({
              videoDetectionId: insertedId,
              frameNumber: detection.frameNumber,
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

    list: publicProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return getUserVideoDetections(0, input.limit, input.offset);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getVideoDetectionById(input.id, 0);
      }),

    getFrames: publicProcedure
      .input(z.object({ videoDetectionId: z.number() }))
      .query(async ({ input }) => {
        return getVideoFrameDetections(input.videoDetectionId);
      }),
  }),
});

export type AppRouter = typeof appRouter;