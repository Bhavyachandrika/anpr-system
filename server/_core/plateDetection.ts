/**
 * Plate Detection Module
 * Uses LLM vision capabilities to detect and extract license plate information from vehicle images.
 */

import { invokeLLM, type Message } from "./llm";
import { storagePut } from "../storage";
import { createDetection } from "../db";
import { notifyOwner } from "./notification";
import sharp from "sharp";

export interface PlateDetectionResult {
  plateNumber: string;
  confidence: number;
  originalImageKey: string;
  croppedPlateKey: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  detectionId: number;
}

/**
 * Detect license plate from a base64-encoded image using LLM vision.
 * Stores original and cropped plate images to cloud storage.
 * Creates detection record in database and sends owner notification.
 */
export async function detectPlateFromImage(
  imageBase64: string,
  fileName: string,
  userId: number
): Promise<PlateDetectionResult> {
  try {
    // Convert base64 to buffer for image processing
    const imageBuffer = Buffer.from(imageBase64, "base64");

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const imageWidth = metadata.width || 800;
    const imageHeight = metadata.height || 600;

    // Prepare LLM messages with proper typing
    const messages: Message[] = [
      {
        role: "system",
        content:
          "You are an expert at detecting and reading vehicle license plates from images. " +
          "Analyze the image and extract the license plate number, estimate the confidence (0-100), " +
          "and provide the bounding box coordinates of the plate region. " +
          'Return ONLY valid JSON: {"plateNumber": "ABC123", "confidence": 95, "boundingBox": {"x": 100, "y": 200, "width": 150, "height": 50}}',
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please detect and extract the license plate information from this vehicle image.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ];

    // Call LLM vision to detect plate
    const detectionResponse = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "plate_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              plateNumber: {
                type: "string",
                description: "The detected license plate number",
              },
              confidence: {
                type: "number",
                description: "Confidence score 0-100",
              },
              boundingBox: {
                type: "object",
                properties: {
                  x: { type: "number", description: "X coordinate" },
                  y: { type: "number", description: "Y coordinate" },
                  width: { type: "number", description: "Width in pixels" },
                  height: { type: "number", description: "Height in pixels" },
                },
                required: ["x", "y", "width", "height"],
              },
            },
            required: ["plateNumber", "confidence", "boundingBox"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse LLM response
    const messageContent = detectionResponse.choices[0]?.message.content;
    let responseText = "{}";
    
    if (typeof messageContent === 'string') {
      responseText = messageContent;
    } else if (Array.isArray(messageContent) && messageContent.length > 0) {
      const textContent = messageContent.find(c => c.type === 'text');
      if (textContent && 'text' in textContent) {
        responseText = textContent.text;
      }
    }
    
    const detectionData = JSON.parse(responseText);

    const plateNumber = detectionData.plateNumber || "UNKNOWN";
    const confidence = Math.min(100, Math.max(0, detectionData.confidence || 0));
    const boundingBox = detectionData.boundingBox || {
      x: 0,
      y: 0,
      width: imageWidth,
      height: imageHeight,
    };

    // Normalize bounding box to ensure it's within image bounds
    const normalizedBBox = {
      x: Math.max(0, Math.min(boundingBox.x, imageWidth - 1)),
      y: Math.max(0, Math.min(boundingBox.y, imageHeight - 1)),
      width: Math.min(boundingBox.width, imageWidth - boundingBox.x),
      height: Math.min(boundingBox.height, imageHeight - boundingBox.y),
    };

    // Upload original image to storage
    const timestamp = Date.now();
    const originalImageRelKey = `detections/${userId}/${timestamp}-original-${fileName}`;
    const { key: originalImageKey, url: originalImageUrl } = await storagePut(
      originalImageRelKey,
      imageBuffer,
      "image/jpeg"
    );

    // Crop plate region and upload
    let croppedPlateKey = originalImageKey;
    let croppedPlateUrl = originalImageUrl;

    try {
      const croppedBuffer = await sharp(imageBuffer)
        .extract({
          left: Math.floor(normalizedBBox.x),
          top: Math.floor(normalizedBBox.y),
          width: Math.floor(normalizedBBox.width),
          height: Math.floor(normalizedBBox.height),
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      const croppedRelKey = `detections/${userId}/${timestamp}-cropped-${fileName}`;
      const { key: storedCroppedKey, url: croppedUrl } = await storagePut(
        croppedRelKey,
        croppedBuffer,
        "image/jpeg"
      );
      croppedPlateKey = storedCroppedKey;
      croppedPlateUrl = croppedUrl;
    } catch (cropError) {
      console.warn("[Plate Detection] Failed to crop plate region:", cropError);
      // Continue with original image if cropping fails
    }

    // Create detection record in database
    const detectionRecord = await createDetection({
      userId,
      plateNumber,
      confidence: Math.round(confidence),
      originalImageKey,
      croppedPlateKey,
      boundingBox: JSON.stringify(normalizedBBox),
      detectedAt: new Date(),
    });

    // Extract detection ID from result
  let detectionId = 1;
    if (detectionRecord && typeof detectionRecord === 'object') {
      const record = detectionRecord as any;
      if (record[0]?.insertId) {
        detectionId = record[0].insertId;
      } else if (record.insertId) {
        detectionId = record.insertId;
      }
    }

    // Send owner notification
    try {
      await notifyOwner({
        title: "New Plate Detection",
        content: `Plate detected: ${plateNumber} (${Math.round(confidence)}% confidence)`,
      });
    } catch (notifyError) {
      console.warn("[Plate Detection] Failed to send notification:", notifyError);
      // Don't fail the detection if notification fails
    }

    return {
      plateNumber,
      confidence: Math.round(confidence),
      originalImageKey,
      croppedPlateKey,
      boundingBox: normalizedBBox,
      detectionId,
    };
  } catch (error) {
    console.error("[Plate Detection] Detection failed:", error);
    throw new Error(
      `Failed to detect plate: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
