import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import type { GenerateSnakeResponse, SnakeShape } from "@shared/schema";

const DEFAULT_SHAPE = `   ######  ######
 ######## ########
 ###################
  #################
    #############
      #########
        #######
          ###
           #`;

const SNAKE_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F59E0B", // Amber
  "#6366F1", // Indigo
  "#84CC16", // Lime
];

export default function Home() {
  const [asciiShape, setAsciiShape] = useState(DEFAULT_SHAPE);
  const [minSnakeLen, setMinSnakeLen] = useState(1);
  const [maxSnakeLen, setMaxSnakeLen] = useState(7);
  const [randomSeed, setRandomSeed] = useState("");
  const [generatedShapes, setGeneratedShapes] = useState<SnakeShape[] | null>(null);
  const [attempts, setAttempts] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (data: { asciiShape: string; minSnakeLen: number; maxSnakeLen: number; randomSeed?: number }) => {
      const response = await apiRequest("POST", "/api/generate", data);
      return await response.json() as GenerateSnakeResponse;
    },
    onSuccess: (data) => {
      if (data.success && data.shapes) {
        setGeneratedShapes(data.shapes);
        setAttempts(data.attempts || null);
      } else {
        // Clear stale results on failure
        setGeneratedShapes(null);
        setAttempts(null);
      }
    },
    onError: () => {
      // Clear stale results on error
      setGeneratedShapes(null);
      setAttempts(null);
    },
  });

  const handleGenerate = () => {
    const seed = randomSeed.trim() ? parseInt(randomSeed) : undefined;
    generateMutation.mutate({
      asciiShape,
      minSnakeLen,
      maxSnakeLen,
      randomSeed: seed,
    });
  };

  const getJSONString = () => {
    if (!generatedShapes) return "";
    return JSON.stringify({ shapes: generatedShapes }, null, 2);
  };

  const handleExportJSON = () => {
    if (!generatedShapes) return;
    
    const jsonString = getJSONString();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snakeShapes.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = async () => {
    const jsonString = getJSONString();
    try {
      await navigator.clipboard.writeText(jsonString);
      toast({
        title: "Copied to clipboard",
        description: "JSON output has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!generatedShapes || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Parse shape to get dimensions
    const lines = asciiShape.split("\n");
    const height = lines.length;
    const width = Math.max(...lines.map(line => line.length));

    const cellSize = 24;
    const padding = 8;
    
    canvas.width = width * cellSize + padding * 2;
    canvas.height = height * cellSize + padding * 2;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(padding, padding + y * cellSize);
      ctx.lineTo(padding + width * cellSize, padding + y * cellSize);
      ctx.stroke();
    }
    
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(padding + x * cellSize, padding);
      ctx.lineTo(padding + x * cellSize, padding + height * cellSize);
      ctx.stroke();
    }

    // Helper function to draw directional arrow
    const drawArrow = (centerX: number, centerY: number, direction: string | null) => {
      if (!direction) return;
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      
      const arrowSize = 7;
      
      switch (direction) {
        case "up":
          // Triangle pointing up
          ctx.moveTo(centerX, centerY - arrowSize);
          ctx.lineTo(centerX - arrowSize, centerY + arrowSize);
          ctx.lineTo(centerX + arrowSize, centerY + arrowSize);
          break;
        case "down":
          // Triangle pointing down
          ctx.moveTo(centerX, centerY + arrowSize);
          ctx.lineTo(centerX - arrowSize, centerY - arrowSize);
          ctx.lineTo(centerX + arrowSize, centerY - arrowSize);
          break;
        case "left":
          // Triangle pointing left
          ctx.moveTo(centerX - arrowSize, centerY);
          ctx.lineTo(centerX + arrowSize, centerY - arrowSize);
          ctx.lineTo(centerX + arrowSize, centerY + arrowSize);
          break;
        case "right":
          // Triangle pointing right
          ctx.moveTo(centerX + arrowSize, centerY);
          ctx.lineTo(centerX - arrowSize, centerY - arrowSize);
          ctx.lineTo(centerX - arrowSize, centerY + arrowSize);
          break;
      }
      
      ctx.closePath();
      ctx.fill();
    };

    // Draw snakes
    generatedShapes.forEach((snake, snakeIndex) => {
      const color = SNAKE_COLORS[snakeIndex % SNAKE_COLORS.length];
      
      snake.positions.forEach((pos, index) => {
        const x = padding + pos.x * cellSize;
        const y = padding + pos.y * cellSize;
        
        // Draw cell
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        
        // Draw directional arrow on head (first position)
        if (index === 0) {
          drawArrow(x + cellSize / 2, y + cellSize / 2, snake.direction);
        }
      });
    });

  }, [generatedShapes, asciiShape]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-semibold text-foreground" data-testid="text-title">
            Snake Puzzle Generator
          </h1>
          <Button
            onClick={handleExportJSON}
            disabled={!generatedShapes}
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-2/5 border-b lg:border-b-0 lg:border-r overflow-auto">
          <div className="p-6 space-y-6">
            {/* ASCII Shape Input */}
            <div className="space-y-4">
              <Label htmlFor="shape-input" className="text-lg font-medium">
                Shape Input
              </Label>
              <p className="text-sm text-muted-foreground">
                Use '#' for cells, spaces for empty areas
              </p>
              <Textarea
                id="shape-input"
                value={asciiShape}
                onChange={(e) => setAsciiShape(e.target.value)}
                className="min-h-64 font-mono text-sm resize-none"
                data-testid="input-shape"
              />
            </div>

            {/* Parameters */}
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-medium">Parameters</h2>
              
              <div className="space-y-2">
                <Label htmlFor="min-length" className="text-sm">
                  Minimum Snake Length
                </Label>
                <Input
                  id="min-length"
                  type="number"
                  min={1}
                  max={11}
                  value={minSnakeLen}
                  onChange={(e) => setMinSnakeLen(parseInt(e.target.value) || 1)}
                  data-testid="input-min-length"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-length" className="text-sm">
                  Maximum Snake Length
                </Label>
                <Input
                  id="max-length"
                  type="number"
                  min={1}
                  max={11}
                  value={maxSnakeLen}
                  onChange={(e) => setMaxSnakeLen(parseInt(e.target.value) || 11)}
                  data-testid="input-max-length"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="random-seed" className="text-sm">
                  Random Seed (Optional)
                </Label>
                <Input
                  id="random-seed"
                  type="text"
                  placeholder="Leave empty for random"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(e.target.value)}
                  data-testid="input-seed"
                />
              </div>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-generate"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Snake Pattern"
              )}
            </Button>

            {/* Status Messages */}
            {generateMutation.isSuccess && generateMutation.data.success && (
              <Alert className="border-green-200 bg-green-50 text-green-900" data-testid="alert-success">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Success! Generated {generatedShapes?.length} snake{generatedShapes?.length !== 1 ? 's' : ''} 
                  {attempts && ` in ${attempts} attempt${attempts !== 1 ? 's' : ''}`}
                </AlertDescription>
              </Alert>
            )}

            {generateMutation.isSuccess && !generateMutation.data.success && (
              <Alert className="border-red-200 bg-red-50 text-red-900" data-testid="alert-error">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  {generateMutation.data.error || "Failed to generate pattern. Try adjusting parameters."}
                </AlertDescription>
              </Alert>
            )}

            {generateMutation.isError && (
              <Alert className="border-red-200 bg-red-50 text-red-900" data-testid="alert-error">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  An error occurred while generating the pattern. Please try again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Right Panel - Visualization */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="p-8 space-y-6">
            {!generatedShapes ? (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-border rounded-md bg-background">
                <div className="text-center space-y-2">
                  <p className="text-lg text-muted-foreground" data-testid="text-empty-state">
                    Click Generate to create snake pattern
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="border border-border rounded-md bg-white shadow-sm"
                    data-testid="canvas-visualization"
                  />
                </div>

                {/* JSON Output Viewer */}
                <div className="max-w-4xl mx-auto">
                  <Accordion type="single" collapsible data-testid="accordion-json">
                    <AccordionItem value="json-output">
                      <AccordionTrigger className="text-lg font-medium" data-testid="button-toggle-json">
                        View JSON Output
                      </AccordionTrigger>
                      <AccordionContent>
                        <Card className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">
                              Generated snake configuration
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyJSON}
                              data-testid="button-copy-json"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                          <div className="border border-border rounded-md bg-muted/50 p-4 overflow-auto max-h-96">
                            <pre className="font-mono text-sm" data-testid="text-json-output">
                              {getJSONString()}
                            </pre>
                          </div>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
