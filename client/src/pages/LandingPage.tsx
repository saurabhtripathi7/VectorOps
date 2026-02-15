"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Search, Clock, Shield, ArrowRight, Github, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroHighlight } from "@/components/ui/HeroHighlight";

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black selection:bg-blue-500/30 text-white">
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/icon.svg" alt="VectorOps" className="w-7 h-7" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white/90">
              Vector <span className="text-indigo-500">Ops</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/saurabhtripathi7/VectorOps" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Github className="w-5 h-5" />
              </Button>
            </a>
            <Link to="/chat">
              <Button variant="primary" size="sm" className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <HeroHighlight>
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              <span>Next-Gen Knowledge Management</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Unlock the Power of Your <br />
              <span className="text-transparent bg-clip-text bg-linear-to-b from-indigo-300 to-indigo-600">
                VectorOps
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl mb-10 leading-relaxed font-light">
              Transform your scattered notes into a structured knowledge engine.
              Our AI understands your context and surfaces insights instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/chat">
                <Button size="lg" className="rounded-full group px-8 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                  Launch VectorOps
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="secondary" size="lg" className="rounded-full px-8 bg-white/5 hover:bg-white/10 border-white/10">
                  Documentation
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </HeroHighlight>

      <section className="py-24 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Search className="w-6 h-6 text-indigo-400" />,
                title: "Semantic Understanding",
                description: "Not just keyword matching. We understand the meaning behind your queries across all documents.",
              },
              {
                icon: <Clock className="w-6 h-6 text-purple-400" />,
                title: "Real-time Retrieval",
                description: "Optimized vector search ensures your answers are generated in milliseconds, not minutes.",
              },
              {
                icon: <Shield className="w-6 h-6 text-pink-400" />,
                title: "Built-in Citations",
                description: "Every answer comes with precise links to your original sources for complete transparency.",
              },
            ].map((feature, i) => (
              <motion.div key={i} variants={item}>
                <Card className="h-full bg-zinc-900/40 border-white/5 hover:border-indigo-500/50 transition-colors p-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="size-6 flex items-center justify-center">
              <img src="/icon.svg" alt="VectorOps" className="w-6 h-6" />
            </div>
            <span className="font-bold tracking-tight">VectorOps</span>
          </div>
          <p className="text-sm text-zinc-500 font-light">
            &copy; 2025 VectorOps. Powered by Gemini and OpenAI.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/saurabhtripathi7/VectorOps" className="text-zinc-500 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
