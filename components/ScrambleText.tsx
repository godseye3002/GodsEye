"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface ScrambleTextProps {
  text: string;
  delay?: number;
  duration?: number;
  onComplete?: () => void;
  className?: string;
  trigger?: boolean;
}

const CHARS = "ABCDEFGHIJ KLMNOPQRSTUVWXYZ 1234567890 !@#$%^&*()_+";

export function ScrambleText({ 
  text, 
  delay = 0, 
  duration = 1.2, 
  onComplete, 
  className,
  trigger = true 
}: ScrambleTextProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!trigger || !elementRef.current) return;
    
    const obj = { progress: 0 };
    const textLength = text.length;
    const element = elementRef.current;

    timelineRef.current = gsap.to(obj, {
      progress: 1,
      duration,
      delay,
      ease: "none",
      onUpdate: () => {
        const p = obj.progress;
        let scrambled = "";
        
        for (let i = 0; i < textLength; i++) {
          const char = text[i];
          if (char === " ") {
            scrambled += " ";
            continue;
          }
          
          const threshold = i / textLength;
          if (p >= threshold + (1 / textLength) * 0.5) {
            scrambled += char;
          } else {
            scrambled += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        
        element.textContent = scrambled;
      },
      onComplete: () => {
        element.textContent = text;
        onComplete?.();
      }
    });

    return () => {
      timelineRef.current?.kill();
    };
  }, [text, delay, duration, trigger, onComplete]);

  return (
    <span ref={elementRef} className={className}>
      {text}
    </span>
  );
}
