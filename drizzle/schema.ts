import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const detections = mysqlTable("detections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  plateNumber: varchar("plateNumber", { length: 20 }).notNull(),
  confidence: int("confidence").notNull(),
  originalImageKey: text("originalImageKey").notNull(),
  croppedPlateKey: text("croppedPlateKey").notNull(),
  boundingBox: text("boundingBox"),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
});

export const videoDetections = mysqlTable("videoDetections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  videoKey: text("videoKey").notNull(),
  frameCount: int("frameCount").default(0),
  duration: float("duration").default(0),
  fps: float("fps").default(0),
  status: varchar("status", { length: 20 }).default("pending"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export const videoFrameDetections = mysqlTable("videoFrameDetections", {
  id: int("id").autoincrement().primaryKey(),
  videoDetectionId: int("videoDetectionId").notNull(),
  frameNumber: int("frameNumber").notNull(),
  plateNumber: varchar("plateNumber", { length: 20 }),
  confidence: int("confidence"),
  boundingBox: text("boundingBox"),
  croppedPlateKey: text("croppedPlateKey"),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Detection = typeof detections.$inferSelect;
export type InsertDetection = typeof detections.$inferInsert;
export type VideoDetection = typeof videoDetections.$inferSelect;
export type InsertVideoDetection = typeof videoDetections.$inferInsert;
export type VideoFrameDetection = typeof videoFrameDetections.$inferSelect;
export type InsertVideoFrameDetection = typeof videoFrameDetections.$inferInsert;