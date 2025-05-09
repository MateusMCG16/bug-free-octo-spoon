"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link"; // Import Link

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sliderValue, setSliderValue] = useState(100);
  const speedRef = useRef(1.0);
  const [characterColor, setCharacterColor] = useState("#00FF00");
  const colorRef = useRef("#00FF00");
  const [isRgbMode, setIsRgbMode] = useState(false);
  const isRgbModeRef = useRef(false);
  const rgbEffectTimeRef = useRef(0);

  const [isFallingDown, setIsFallingDown] = useState(true);
  const isFallingDownRef = useRef(true);
  const dropsRef = useRef<number[]>([]);
  const canvasDimensionsRef = useRef({
    width: 0,
    height: 0,
    columns: 0,
    fontSize: 16,
  });

  useEffect(() => {
    speedRef.current = sliderValue / 100.0;
  }, [sliderValue]);

  useEffect(() => {
    colorRef.current = characterColor;
  }, [characterColor]);

  useEffect(() => {
    isRgbModeRef.current = isRgbMode;
  }, [isRgbMode]);

  const initializeDrops = useCallback(() => {
    const { columns, height, fontSize } = canvasDimensionsRef.current;
    const newDrops: number[] = [];
    for (let i = 0; i < columns; i++) {
      if (isFallingDownRef.current) {
        newDrops[i] = Math.random() * -height / fontSize;
      } else {
        newDrops[i] = height / fontSize + (Math.random() * height / fontSize);
      }
    }
    dropsRef.current = newDrops;
  }, []);

  useEffect(() => {
    isFallingDownRef.current = isFallingDown;
    initializeDrops();
  }, [isFallingDown, initializeDrops]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvasDimensionsRef.current.width = window.innerWidth;
    canvasDimensionsRef.current.height = window.innerHeight;
    canvasDimensionsRef.current.columns = Math.floor(
      canvasDimensionsRef.current.width / canvasDimensionsRef.current.fontSize
    );
    canvas.width = canvasDimensionsRef.current.width;
    canvas.height = canvasDimensionsRef.current.height;

    initializeDrops();

    const katakana = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
    const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const characters = katakana + latin + nums;

    let animationFrameId: number;

    const draw = () => {
      const { width, height, fontSize, columns } = canvasDimensionsRef.current;
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      if (isRgbModeRef.current) {
        rgbEffectTimeRef.current = (rgbEffectTimeRef.current + 0.5) % 360;
      }

      ctx.font = fontSize + "px monospace";
      const currentSpeed = speedRef.current;

      for (let i = 0; i < columns; i++) {
        if (dropsRef.current.length <= i) continue;

        const text = characters.charAt(
          Math.floor(Math.random() * characters.length)
        );

        if (isRgbModeRef.current) {
          const hue = (dropsRef.current[i] * 2 + rgbEffectTimeRef.current) % 360;
          ctx.fillStyle = `hsl(${hue < 0 ? hue + 360 : hue}, 100%, 50%)`;
        } else {
          ctx.fillStyle = colorRef.current;
        }

        ctx.fillText(text, i * fontSize, dropsRef.current[i] * fontSize);

        if (isFallingDownRef.current) {
          dropsRef.current[i] += currentSpeed;
          if (dropsRef.current[i] * fontSize > height && Math.random() > 0.975) {
            dropsRef.current[i] = 0;
          }
        } else {
          dropsRef.current[i] -= currentSpeed;
          if (dropsRef.current[i] * fontSize < 0 && Math.random() > 0.975) {
            dropsRef.current[i] = height / fontSize;
          }
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvasDimensionsRef.current.width = window.innerWidth;
      canvasDimensionsRef.current.height = window.innerHeight;
      canvasDimensionsRef.current.columns = Math.floor(
        canvasDimensionsRef.current.width / canvasDimensionsRef.current.fontSize
      );
      if (canvasRef.current) {
        canvasRef.current.width = canvasDimensionsRef.current.width;
        canvasRef.current.height = canvasDimensionsRef.current.height;
      }
      initializeDrops();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [initializeDrops]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: "block", background: "#000" }}
      />
      <div className="absolute top-4 right-4 z-10 p-3 bg-black bg-opacity-60 rounded-lg text-white font-[family-name:var(--font-geist-mono)] shadow-lg flex flex-col gap-4">
        <div>
          <label
            htmlFor="speedSlider"
            className="block text-sm mb-1 select-none"
          >
            Speed: {(sliderValue / 100).toFixed(1)}x
          </label>
          <input
            type="range"
            id="speedSlider"
            min="10"
            max="300"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>
        <div>
          <label
            htmlFor="colorPicker"
            className="block text-sm mb-1 select-none"
          >
            Color:
          </label>
          <input
            type="color"
            id="colorPicker"
            value={characterColor}
            onChange={(e) => setCharacterColor(e.target.value)}
            className="w-full h-8 p-0 border-none rounded cursor-pointer bg-gray-700"
            disabled={isRgbMode}
          />
        </div>
        <div>
          <button
            onClick={() => setIsRgbMode(!isRgbMode)}
            className={`w-full px-3 py-2 text-sm rounded-md transition-colors ${
              isRgbMode
                ? "bg-pink-600 hover:bg-pink-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isRgbMode ? "Disable RGB Mode" : "Enable RGB Mode"}
          </button>
        </div>
        <div>
          <button
            onClick={() => setIsFallingDown(!isFallingDown)}
            className="w-full px-3 py-2 text-sm rounded-md bg-transparent hover:bg-gray-700/50 border border-gray-600/50 transition-colors"
            title="Toggle Rain Direction"
          >
            {isFallingDown ? "Make Rain Go Up ↑" : "Make Rain Go Down ↓"}
          </button>
        </div>
        <div>
          <Link
            href="/lorem"
            className="block w-full px-3 py-2 text-sm text-center rounded-md bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            Go to Lorem Page
          </Link>
        </div>
      </div>
    </>
  );
}
