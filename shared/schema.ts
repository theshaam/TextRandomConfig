import { z } from "zod";

// Snake generation schemas
export const generateSnakeSchema = z.object({
  asciiShape: z.string().min(1, "Shape input is required"),
  minSnakeLen: z.number().int().min(1).max(11),
  maxSnakeLen: z.number().int().min(1).max(11),
  randomSeed: z.number().int().optional(),
}).refine(data => data.minSnakeLen <= data.maxSnakeLen, {
  message: "Minimum snake length must be less than or equal to maximum",
  path: ["minSnakeLen"],
});

export type GenerateSnakeRequest = z.infer<typeof generateSnakeSchema>;

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof positionSchema>;

export const directionSchema = z.enum(["up", "down", "left", "right"]);

export type Direction = z.infer<typeof directionSchema>;

export const snakeShapeSchema = z.object({
  type: z.string(),
  startPos: positionSchema,
  direction: directionSchema.nullable(),
  lookingAt: positionSchema.nullable(),
  positions: z.array(positionSchema),
});

export type SnakeShape = z.infer<typeof snakeShapeSchema>;

export const generateSnakeResponseSchema = z.object({
  success: z.boolean(),
  shapes: z.array(snakeShapeSchema).optional(),
  attempts: z.number().optional(),
  error: z.string().optional(),
});

export type GenerateSnakeResponse = z.infer<typeof generateSnakeResponseSchema>;
