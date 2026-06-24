import { and, desc, eq, gte, like, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Detection, InsertDetection, InsertUser, detections, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all detections for a specific user, ordered by most recent first.
 */
export async function getUserDetections(
  userId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(detections)
    .where(eq(detections.userId, userId))
    .orderBy(desc(detections.detectedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get a single detection by ID, ensuring it belongs to the user.
 */
export async function getDetectionById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(detections)
    .where(and(eq(detections.id, id), eq(detections.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new detection record.
 */
export async function createDetection(data: InsertDetection) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(detections).values(data);
  return result;
}

/**
 * Get detections filtered by plate number and/or date range.
 */
export async function searchDetections(
  userId: number,
  filters: {
    plateNumber?: string;
    startDate?: Date;
    endDate?: Date;
    minConfidence?: number;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(detections.userId, userId)];

  if (filters.plateNumber) {
    conditions.push(
      like(detections.plateNumber, `%${filters.plateNumber}%`)
    );
  }

  if (filters.startDate) {
    conditions.push(gte(detections.detectedAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(detections.detectedAt, filters.endDate));
  }

  if (filters.minConfidence !== undefined) {
    conditions.push(gte(detections.confidence, filters.minConfidence));
  }

  return db
    .select()
    .from(detections)
    .where(and(...conditions))
    .orderBy(desc(detections.detectedAt));
}

// Video Detection Helpers

import { VideoDetection, InsertVideoDetection, videoDetections, VideoFrameDetection, InsertVideoFrameDetection, videoFrameDetections } from "../drizzle/schema";
import { asc } from "drizzle-orm";

/**
 * Create a new video detection record.
 */
export async function createVideoDetection(data: InsertVideoDetection) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(videoDetections).values(data);
  
  // Drizzle returns the result with metadata; fetch the inserted record to get the ID
  if (result && data.userId) {
    const inserted = await db
      .select()
      .from(videoDetections)
      .where(eq(videoDetections.userId, data.userId))
      .orderBy(desc(videoDetections.uploadedAt))
      .limit(1);
    
    if (inserted.length > 0) {
      return { ...inserted[0], insertId: inserted[0].id };
    }
  }
  
  return result;
}

/**
 * Get all video detections for a specific user.
 */
export async function getUserVideoDetections(
  userId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(videoDetections)
    .where(eq(videoDetections.userId, userId))
    .orderBy(desc(videoDetections.uploadedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get a single video detection by ID, ensuring it belongs to the user.
 */
export async function getVideoDetectionById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(videoDetections)
    .where(and(eq(videoDetections.id, id), eq(videoDetections.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new video frame detection record.
 */
export async function createVideoFrameDetection(data: InsertVideoFrameDetection) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(videoFrameDetections).values(data);
  return result;
}

/**
 * Get all frame detections for a video.
 */
export async function getVideoFrameDetections(videoDetectionId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(videoFrameDetections)
    .where(eq(videoFrameDetections.videoDetectionId, videoDetectionId))
    .orderBy(asc(videoFrameDetections.frameNumber));
}
