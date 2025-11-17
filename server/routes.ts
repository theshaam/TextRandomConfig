import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateSnakeSchema, type GenerateSnakeResponse } from "@shared/schema";
import { generateSnakesForShape, snakesToJSON } from "./snakeGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Snake generation endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      // Validate request body
      const validation = generateSnakeSchema.safeParse(req.body);
      
      if (!validation.success) {
        const response: GenerateSnakeResponse = {
          success: false,
          error: validation.error.errors[0]?.message || "Invalid input parameters",
        };
        return res.status(400).json(response);
      }

      const { asciiShape, minSnakeLen, maxSnakeLen, randomSeed } = validation.data;

      // Validate that shape contains at least one '#' character
      if (!asciiShape.includes('#')) {
        const response: GenerateSnakeResponse = {
          success: false,
          error: "Shape must contain at least one '#' character",
        };
        return res.status(400).json(response);
      }

      // Generate snakes
      const { snakes, attempts } = generateSnakesForShape(
        asciiShape,
        minSnakeLen,
        maxSnakeLen,
        randomSeed
      );

      if (snakes === null) {
        const response: GenerateSnakeResponse = {
          success: false,
          error: "Failed to generate snake pattern after many attempts. Try adjusting parameters or simplifying the shape.",
          attempts,
        };
        return res.json(response);
      }

      // Convert to JSON format
      const shapes = snakesToJSON(snakes);

      const response: GenerateSnakeResponse = {
        success: true,
        shapes,
        attempts,
      };

      res.json(response);
    } catch (error) {
      console.error("Error generating snakes:", error);
      const response: GenerateSnakeResponse = {
        success: false,
        error: "Internal server error occurred while generating pattern",
      };
      res.status(500).json(response);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
