"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

const CHARACTERS = "!\"#$%&'()*+,-./:;<=>?@[\\]"; // Reduced set for better performance/look

// Function to determine character font size based on screen width
const getCharFontSize = () => {
  if (typeof window !== "undefined") {
    if (window.innerWidth < 768) return 10; // Smaller font for mobile
  }
  return 14; // Default font size
};

// Vertical padding/margin for elements other than canvas (e.g., link button)
const VERTICAL_OFFSET = 80; // Approximate pixels for button and margins

export default function CharsPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [charFontSize, setCharFontSize] = useState(getCharFontSize());
  const [gridCols, setGridCols] = useState(0);
  const [gridRows, setGridRows] = useState(0);

  const updateCanvasDimensions = useCallback(() => {
    if (typeof window !== "undefined") {
      const currentFontSize = getCharFontSize();
      setCharFontSize(currentFontSize);

      const newCols = Math.floor(window.innerWidth / currentFontSize);
      const availableHeight = window.innerHeight - VERTICAL_OFFSET;
      const newRows = Math.floor(availableHeight / currentFontSize);

      setGridCols(newCols > 0 ? newCols : 1);
      setGridRows(newRows > 0 ? newRows : 1);
    }
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener("resize", updateCanvasDimensions);
    return () => window.removeEventListener("resize", updateCanvasDimensions);
  }, [updateCanvasDimensions]);

  useEffect(() => {
    const outputCanvas = outputCanvasRef.current;
    const processingCanvas = processingCanvasRef.current;

    if (outputCanvas && gridCols > 0 && gridRows > 0) {
      outputCanvas.width = gridCols * charFontSize;
      outputCanvas.height = gridRows * charFontSize;
    }
    if (processingCanvas && gridCols > 0 && gridRows > 0) {
      processingCanvas.width = gridCols;
      processingCanvas.height = gridRows;
    }
  }, [gridCols, gridRows, charFontSize]);

  const drawCharacterArt = useCallback(() => {
    if (
      !videoRef.current ||
      !outputCanvasRef.current ||
      !processingCanvasRef.current ||
      videoRef.current.paused ||
      videoRef.current.ended ||
      videoRef.current.videoWidth === 0 ||
      gridCols === 0 ||
      gridRows === 0
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

    processingCtx.drawImage(videoRef.current, 0, 0, gridCols, gridRows);

    let imageData;
    try {
      imageData = processingCtx.getImageData(0, 0, gridCols, gridRows);
    } catch (e) {
      console.error("Error getting image data:", e);
      animationFrameIdRef.current = requestAnimationFrame(drawCharacterArt);
      return;
    }
    const data = imageData.data;

    outputCtx.fillStyle = "rgba(0, 0, 0, 0.25)";
    outputCtx.fillRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);

    outputCtx.fillStyle = "#00FF00";
    outputCtx.font = `${charFontSize}px monospace`;
    outputCtx.textAlign = "center";
    outputCtx.textBaseline = "middle";

    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const i = (y * gridCols + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3 / 255;

        if (brightness > 0.2) {
          const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          outputCtx.fillText(
            char,
            x * charFontSize + charFontSize / 2,
            y * charFontSize + charFontSize / 2
          );
        }
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(drawCharacterArt);
  }, [gridCols, gridRows, charFontSize]);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
          },
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-neutral-300 p-2 sm:p-4 overflow-hidden">
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      <canvas ref={processingCanvasRef} style={{ display: "none" }} />

      {hasPermission === null && <p className="text-sm sm:text-lg">Requesting camera permission...</p>}
      {error && <p className="text-sm sm:text-lg text-red-500 max-w-xs sm:max-w-md text-center my-2">{error}</p>}

      <div className="flex justify-center items-center flex-grow w-full">
        <canvas
          ref={outputCanvasRef}
          className="border border-green-700 shadow-lg shadow-green-500/30 max-w-full max-h-full"
        />
      </div>

      <Link
        href="/"
        className="mt-4 sm:mt-6 mb-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm rounded-md transition-colors"
      >
        Back to Main Page
      </Link>
    </div>
  );
}
