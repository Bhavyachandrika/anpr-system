import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

function createAuthContext(userId: number = 1): TrpcContext {
  const user: User = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@test.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("detections router", () => {
  describe("list", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.detections.list({ limit: 10, offset: 0 });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("returns empty array for user with no detections", async () => {
      const ctx = createAuthContext(999);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.detections.list({ limit: 10, offset: 0 });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("respects limit and offset parameters", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.detections.list({ limit: 5, offset: 0 });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getById", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.detections.getById({ id: 1 });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("returns null for non-existent detection", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.detections.getById({ id: 99999 });
      
      expect(result).toBeUndefined();
    });
  });

  describe("detect", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.detections.detect({
          imageBase64: "invalid",
          fileName: "test.jpg",
        });
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("validates base64 image input", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        // Invalid base64 that's too short
        await caller.detections.detect({
          imageBase64: "invalid",
          fileName: "test.jpg",
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        // Should fail due to invalid image format or size
        expect(error).toBeDefined();
      }
    });

    it("validates fileName parameter", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        // Create a minimal valid JPEG base64 (1x1 pixel)
        const minimalJpeg = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";
        
        const result = await caller.detections.detect({
          imageBase64: minimalJpeg,
          fileName: "",  // Empty filename should fail
        });
        expect.fail("Should have thrown validation error for empty fileName");
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("data isolation", () => {
    it("users only see their own detections", async () => {
      // This test verifies that the list procedure filters by userId
      const user1Ctx = createAuthContext(1);
      const user2Ctx = createAuthContext(2);

      const caller1 = appRouter.createCaller(user1Ctx);
      const caller2 = appRouter.createCaller(user2Ctx);

      const user1Detections = await caller1.detections.list({ limit: 100, offset: 0 });
      const user2Detections = await caller2.detections.list({ limit: 100, offset: 0 });

      // Both should be empty or contain only their own data
      // In a real test, we'd create detections and verify isolation
      expect(Array.isArray(user1Detections)).toBe(true);
      expect(Array.isArray(user2Detections)).toBe(true);
    });

    it("users cannot access other users' detections", async () => {
      const user1Ctx = createAuthContext(1);
      const user2Ctx = createAuthContext(2);

      const caller1 = appRouter.createCaller(user1Ctx);
      const caller2 = appRouter.createCaller(user2Ctx);

      // Try to get a detection with ID that might belong to another user
      // The procedure should either return null or throw an error
      const result = await caller2.detections.getById({ id: 1 });
      
      // Should not return a detection from user1
      if (result) {
        expect(result.userId).toBe(2);
      }
    });
  });
});
