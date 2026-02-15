"use client";

import React, { forwardRef, useRef } from "react";
import { Brain, FileText, Search, Database, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "./ui/AnimatedBeam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border border-white/10 bg-black/50 p-3 shadow-2xl backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function WorkflowAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-lg bg-black p-10 md:shadow-xl"
      ref={containerRef}
    >
      <div className="flex size-full flex-col max-w-lg max-h-[200px] items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref}>
            <FileText className="text-white/90" />
          </Circle>
          <Circle ref={div7Ref} className="size-16">
            <Brain className="text-white/90 size-8" />
          </Circle>
          <Circle ref={div6Ref}>
            <Database className="text-white/90" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref}>
            <User className="text-white/90" />
          </Circle>
          <Circle ref={div4Ref} className="size-16">
            <div className="text-xs tracking-wider">AI</div>
          </Circle>
          <Circle ref={div5Ref}>
            <Search className="text-white/90" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div7Ref}
        curvature={-50}
        delay={0}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div7Ref}
        curvature={50}
        delay={0.5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={0}
        delay={1}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div5Ref}
        curvature={50}
        delay={1.5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div6Ref}
        curvature={-50}
        delay={2}
      />
    </div>
  );
}
