"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const CHAR_FONT_SIZE = 16; // Increased from 10 to 16
const GRID_COLS = 120; // Number of character columns
const GRID_ROWS = 80;  // Number of character rows

const CHARACTERS = "!\"#$%&'()*+,-./:;<=>?@[\\]";

export default function CharsPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null); // Hidden canvas for frame processing
  const animationFrameIdRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const drawCharacterArt = useCallback(() => {
    if (
      !videoRef.current ||
      !outputCanvasRef.current ||
      !processingCanvasRef.current ||
      videoRef.current.paused ||
      videoRef.current.ended ||
      videoRef.current.videoWidth === 0
    ) {
      animationFrameIdRef.current = requestAnimationFrame(drawCharacterArt);
      return;
    }

    const outputCtx = outputCanvasRef.current.getContext("2d", { willReadFrequently: true });
    const processingCtx = processingCanvasRef.current.getContext("2d", { willReadFrequently: true });

    if (!outputCtx || !processingCtx) {
      animationFrameIdRef.current = requestAnimationFrame(drawCharacterArt);
      return;
    }
    
    // Draw video frame to processing canvas (scaled down)
    processingCtx.drawImage(videoRef.current, 0, 0, GRID_COLS, GRID_ROWS);
    
    let imageData;
    try {
      imageData = processingCtx.getImageData(0, 0, GRID_COLS, GRID_ROWS);
    } catch (e) {
      console.error("Error getting image data:", e);
      animationFrameIdRef.current = requestAnimationFrame(drawCharacterArt);
      return;
    }
    const data = imageData.data;

    // Clear output canvas
    outputCtx.fillStyle = "rgba(0, 0, 0, 0.25)"; // Slight trail effect
    outputCtx.fillRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
    
    outputCtx.fillStyle = "#00FF00"; // Green characters
    outputCtx.font = `${CHAR_FONT_SIZE}px monospace`;
    outputCtx.textAlign = "center";
    outputCtx.textBaseline = "middle";

    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const i = (y * GRID_COLS + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3 / 255; // Normalize to 0-1

        if (brightness > 0.2) { // Threshold for drawing a character
          const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          outputCtx.fillText(
            char,
            x * CHAR_FONT_SIZE + CHAR_FONT_SIZE / 2,
            y * CHAR_FONT_SIZE + CHAR_FONT_SIZE / 2
          );
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(drawCharacterArt);
  }, []);

  useEffect(() => {
    const outputCanvas = outputCanvasRef.current;
    const processingCanvas = processingCanvasRef.current;

    if (outputCanvas) {
        outputCanvas.width = GRID_COLS * CHAR_FONT_SIZE;
        outputCanvas.height = GRID_ROWS * CHAR_FONT_SIZE;
    }
    if (processingCanvas) {
        processingCanvas.width = GRID_COLS;
        processingCanvas.height = GRID_ROWS;
    }

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 }, // Request a small resolution
          audio: false,
        });
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) videoRef.current.play();
            if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
            }
            animationFrameIdRef.current = requestAnimationFrame(drawCharacterArt);
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (err instanceof Error) {
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Camera permission denied. Please allow camera access in your browser settings.");
            } else {
                setError(`Error accessing camera: ${err.message}`);
            }
        } else {
            setError("An unknown error occurred while accessing the camera.");
        }
        setHasPermission(false);
      }
    }

    setupCamera();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [drawCharacterArt]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-neutral-300 p-4">
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      <canvas ref={processingCanvasRef} style={{ display: "none" }} />
      
      {hasPermission === null && <p className="text-lg">Requesting camera permission...</p>}
      {error && <p className="text-lg text-red-500 max-w-md text-center">{error}</p>}
      
      <canvas
        ref={outputCanvasRef}
        className="border border-green-700 shadow-lg shadow-green-500/30"
      />

      <Link
        href="/"
        className="mt-8 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
      >
        Back to Main Page
      </Link>
    </div>
  );
}
