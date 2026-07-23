import { useRef, useCallback, useEffect } from "react";

/**
 * Animated background hook inspired by Stripe's design
 * Smoothly cycles through HSL colors and updates CSS variables
 */
export function useAnimatedBackground() {
  const counterRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  const animate = useCallback((timestamp: number) => {
    // Update every 240ms
    if (timestamp - lastUpdateRef.current >= 240) {
      counterRef.current += 6;

      // Calculate three hue values offset by 120 degrees
      const hue1 = (0.5 * counterRef.current + 120) % 360;
      const hue2 = (0.5 * counterRef.current + 240) % 360;
      const hue3 = (0.5 * counterRef.current + 360) % 360;

      // Create gradient colors with low saturation and high lightness
      const color1 = `hsl(${hue1}deg, ${40}%, ${96}%)`;
      const color2 = `hsl(${hue2}deg, ${40}%, ${96}%)`;
      const color3 = `hsl(${hue3}deg, ${40}%, ${96}%)`;

      // Create linear gradient
      const gradient = `linear-gradient(20deg, ${color1}, ${color2}, ${color3})`;

      // Highlight and text colors based on hue2
      const highlightColor = `hsl(${hue2}deg, 80%, 70%)`;
      const fontColor = `hsl(${hue2}deg, 30%, 10%)`;

      // Update CSS variables on body
      const { body } = document;
      body.style.backgroundImage = gradient;
      body.style.setProperty("--fontColor", fontColor);
      body.style.setProperty("--artForeground", color2);
      body.style.setProperty("--highlightColor", highlightColor);

      lastUpdateRef.current = timestamp;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Start animation
    rafRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate]);
}
