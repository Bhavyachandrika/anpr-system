import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Detection results table for storing ANPR scan history.
 * Each row represents one successful plate detection from an uploaded image.
 */
export const detections = mysqlTable("detections", {
  id: int("id").autoincrement().primaryKey(),
  /** User who performed the detection */
  userId: int("userId").notNull().references(() => users.id),
  /** Detected license plate number/text */
  plateNumber: varchar("plateNumber", { length: 64 }).notNull(),
  /** Confidence score as percentage (0-100) */
  confidence: int("confidence").notNull(),
  /** Storage key for the original uploaded vehicle image */
  originalImageKey: varchar("originalImageKey", { length: 255 }).notNull(),
  /** Storage key for the cropped plate region image */
  croppedPlateKey: varchar("croppedPlateKey", { length: 255 }).notNull(),
  /** Bounding box coordinates as JSON: {x, y, width, height} */
  boundingBox: text("boundingBox").notNull(),
  /** Detection timestamp */
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Detection = typeof detections.$inferSelect;
export type InsertDetection = typeof detections.$inferInsert;

/**
 * Video detection results table for storing ANPR scans from video files.
 * Each row represents one video file with multiple frame-level detections.
 */
export const videoDetections = mysqlTable("videoDetections", {
  id: int("id").autoincrement().primaryKey(),
  /** User who uploaded the video */
  userId: int("userId").notNull().references(() => users.id),
  /** Storage key for the original video file */
  videoKey: varchar("videoKey", { length: 255 }).notNull(),
  /** Video file name */
  fileName: varchar("fileName", { length: 255 }).notNull(),
  /** Total number of frames extracted */
  frameCount: int("frameCount").notNull(),
  /** Video duration in seconds */
  duration: int("duration").notNull(),
  /** Frames per second */
  fps: int("fps").default(30).notNull(),
  /** Total number of plates detected across all frames */
  totalDetections: int("totalDetections").default(0).notNull(),
  /** Detection timestamp */
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoDetection = typeof videoDetections.$inferSelect;
export type InsertVideoDetection = typeof videoDetections.$inferInsert;

/**
 * Video frame detection results table.
 * Each row represents a plate detection from a specific frame in a video.
 */
export const videoFrameDetections = mysqlTable("videoFrameDetections", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the parent video detection */
  videoDetectionId: int("videoDetectionId").notNull().references(() => videoDetections.id),
  /** Frame number in the video (0-indexed) */
  frameNumber: int("frameNumber").notNull(),
  /** Timestamp in video (seconds) */
  timestamp: int("timestamp").notNull(),
  /** Detected license plate number */
  plateNumber: varchar("plateNumber", { length: 64 }).notNull(),
  /** Confidence score (0-100) */
  confidence: int("confidence").notNull(),
  /** Storage key for the cropped plate region from this frame */
  croppedPlateKey: varchar("croppedPlateKey", { length: 255 }).notNull(),
  /** Bounding box coordinates as JSON: {x, y, width, height} */
  boundingBox: text("boundingBox").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VideoFrameDetection = typeof videoFrameDetections.$inferSelect;
export type InsertVideoFrameDetection = typeof videoFrameDetections.$inferInsert;
