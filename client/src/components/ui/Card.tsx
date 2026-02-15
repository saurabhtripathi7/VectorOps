"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "glass rounded-2xl p-6 transition-all duration-300",
          hover && "glass-hover hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export { Card };
