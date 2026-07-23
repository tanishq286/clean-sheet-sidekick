"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const values: number[] =
    props.value ?? props.defaultValue ?? [props.min ?? 0, props.max ?? 100];

  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/10">
        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block size-4 rounded-full border border-emerald-300 bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.2)]",
            "transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
