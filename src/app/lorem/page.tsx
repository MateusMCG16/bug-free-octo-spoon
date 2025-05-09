"use client"; // Add this for client-side interactivity

import Link from "next/link";
import { useState, useEffect } from "react";

export default function LoremPage() {
  const [hue, setHue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHue((prevHue) => (prevHue + 1) % 360);
    }, 50); // Adjust speed of color change here (milliseconds)
    return () => clearInterval(interval);
  }, []);

  const dynamicColorStyle = {
    color: `hsl(${hue}, 100%, 70%)`, // Using HSL for easy hue rotation, 70% lightness for better visibility
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 text-center text-neutral-300 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl">
        <Link href="/" className="cursor-pointer">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 transition-colors"
            style={dynamicColorStyle}
          >
            About This Page
          </h1>
        </Link>
        <p className="text-base sm:text-lg leading-relaxed">
          Welcome! The main page features a dynamic Matrix-style digital rain
          effect. You can control various aspects of this animation using the
          panel in the top-right corner: adjust the falling speed, change the
          character color, toggle an RGB rainbow mode for the characters, and
          even reverse the direction of the rain.
        </p>
        <p className="text-base sm:text-lg leading-relaxed mt-4">
          Additionally, there&apos;s a link to a <code>/chars</code> page where
          you can see your webcam feed rendered using only special characters,
          creating a unique ASCII-art like visual effect.
        </p>
        <p className="text-xs sm:text-sm leading-relaxed mt-6 sm:mt-8 text-neutral-500">
          This page was created with assistance from GitHub Copilot.
        </p>
      </main>
    </div>
  );
}
