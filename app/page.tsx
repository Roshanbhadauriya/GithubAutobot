"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiquidMetal, liquidMetalPresets } from "@paper-design/shaders-react";
import { motion } from "framer-motion";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function Home({ searchParams }: PageProps) {
  const resolvedParams = use(searchParams);
  const error = resolvedParams?.error;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans antialiased overflow-hidden select-none bg-liquid-metal">
      
      
      {/* Space Grotesk Link & Custom Metallic Background */}
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: `
        html {
          scroll-behavior: smooth;
        }
        .font-grotesk {
          font-family: 'Space Grotesk', sans-serif;
        }
        @keyframes liquid {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-4deg); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 5s ease-in-out infinite;
        }
        .bg-liquid-metal {
          background: linear-gradient(-45deg, #000000, #0c0c0e, #141418, #050507, #000000);
          background-size: 400% 400%;
          animation: liquid 16s ease infinite;
        }
      `}} />

      {/* Ambient silver spot glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-gradient-to-br from-zinc-700/10 to-transparent blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-bl from-zinc-800/10 to-transparent blur-[140px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="relative border-b border-[#1f1f1f] bg-black/40 backdrop-blur-md px-6 py-5 z-10 font-grotesk">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white uppercase">autobot.</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-wider text-zinc-400 font-medium">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="https://github.com" className="hover:text-white transition-colors">Documentation</a>
          </nav>

          <Link href="/api/auth/login" prefetch={false}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" className="bg-white hover:bg-zinc-200 text-black font-bold rounded-full px-5 text-[10px] uppercase tracking-wider h-8 transition-all duration-300">
                Login with GitHub
              </Button>
            </motion.div>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative max-w-5xl w-full mx-auto px-6 py-16 space-y-36 font-grotesk">
        
        {/* Error Notification Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/15 border border-red-900/30 text-red-400 text-xs max-w-lg mx-auto text-center">
            <p className="font-bold uppercase tracking-wider">Authentication Error</p>
            <p className="text-zinc-500 mt-1 text-[10px]">
              {error === "missing_code" ? "OAuth callback verification failed." : "Internal token authentication timeout."}
            </p>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative pt-12 pb-8 space-y-10 text-center md:text-left">
          
          {/* Interactive Floating Liquid Metal Sphere */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 opacity-95 pointer-events-auto z-0 overflow-hidden">
            <div className="w-full h-full animate-float-slow">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <div className="w-[125%] h-[125%] absolute -left-[12.5%] -top-[12.5%]">
                  <LiquidMetal
                    {...liquidMetalPresets[2]}
                    colorBack="#000000"
                    colorTint="#ffffff"
                    shape="circle"
                    scale={0.8}
                    style={{ width: "100%", height: "100%", mixBlendMode: "screen" }}
                  />
                </div>
              </div>
            </div>
          </div>
          

          <motion.div 
            className="max-w-2xl space-y-6 relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Status Badge */}
            <motion.div 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111111]/80 border border-[#1f1f1f] text-[9px] font-mono text-zinc-400 uppercase tracking-widest w-fit"
              variants={itemVariants}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Auto-Orchestration v1.0</span>
            </motion.div>

            {/* Heading */}
            <motion.h1 
              className="text-5xl md:text-7xl font-bold tracking-tight uppercase leading-[0.95] text-white"
              variants={itemVariants}
            >
              THE GITHUB <br />
              AUTOMATION <br />
              ENGINE.
            </motion.h1>

            {/* Description */}
            <motion.p 
              className="text-zinc-400 text-xs md:text-sm max-w-md leading-relaxed"
              variants={itemVariants}
            >
              Unlock your developer velocity. Set event-driven rules to execute issue triage, priority labeling, and webhook alerts without manual overhead.
            </motion.p>

            {/* CTA Button with framer motion animations */}
            <motion.div 
              className="pt-2"
              variants={buttonVariants}
            >
              <Link href="/api/auth/login" className="inline-block" prefetch={false}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white text-black hover:bg-zinc-200 font-bold px-6 py-3.5 rounded-full text-xs flex items-center gap-2 transition-colors shadow-2xl font-grotesk"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  Continue with GitHub
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* About Section */}
        <section id="about" className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start pt-12 border-t border-[#1f1f1f]/50">
          <div className="md:col-span-3 space-y-4">
            <h2 className="text-2xl font-bold uppercase tracking-tight text-white">About</h2>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
              AutoBot is an autonomous workflow orchestrator designed to listen to GitHub events. Through intelligent comparison logic and API integrations, we handle the manual review overhead of your repositories so you can focus on building products.
            </p>
          </div>

          <div className="md:col-span-2 grid grid-cols-3 gap-4 pt-4 md:pt-0 text-left relative">

            <div>
              <h4 className="text-2xl font-bold text-white">65K+</h4>
              <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wide">Projects</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">1.5B+</h4>
              <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wide">Events</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">300K+</h4>
              <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wide">Triggers</p>
            </div>
          </div>
        </section>

        {/* Services & Capabilities Section */}
        <section id="capabilities" className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold uppercase tracking-tight text-white">Our Capabilities</h2>
              <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">
                Explore our suite of automations, designed to standardize developer pipelines and boost collaboration.
              </p>
            </div>

            <Link href="/api/auth/login" prefetch={false}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="border border-zinc-800 bg-[#0a0a0a] hover:bg-[#111] text-zinc-300 font-bold px-5 py-2.5 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300"
              >
                Connect Repository <ArrowUpRight className="h-3.5 w-3.5" />
              </motion.button>
            </Link>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 01 */}
            <div className="border border-[#1f1f1f] bg-[#0a0a0a]/20 rounded-2xl p-6 space-y-4 flex flex-col h-44 hover:border-zinc-800 transition-colors">
              <span className="text-[10px] text-zinc-500 font-mono">01 /</span>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-zinc-200 uppercase tracking-wide">AI Triage & Summaries</h3>
                <p className="text-zinc-500 text-[10px] leading-normal max-w-xs">
                  Generate instant 1-sentence summaries, evaluate severity indices, and auto-recommend labels for incoming issues.
                </p>
              </div>
            </div>

            {/* Card 02 */}
            <div className="border border-[#1f1f1f] bg-[#0a0a0a]/20 rounded-2xl p-6 space-y-4 flex flex-col h-44 hover:border-zinc-800 transition-colors">
              <span className="text-[10px] text-zinc-500 font-mono">02 /</span>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-zinc-200 uppercase tracking-wide">Flexible Rules Engine</h3>
                <p className="text-zinc-500 text-[10px] leading-normal max-w-xs">
                  Configure custom trigger conditions matching issue titles, PR body texts, or push authors to run custom operations.
                </p>
              </div>
            </div>

            {/* Card 03 - Solid Contrast Highlight Card */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="bg-white text-black rounded-2xl p-6 space-y-4 flex flex-col h-44 shadow-lg hover:bg-zinc-100 transition-colors"
            >
              <span className="text-[10px] text-zinc-400 font-mono">03 /</span>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-black uppercase tracking-wide">Slack Webhook Alerts</h3>
                <p className="text-zinc-600 text-[10px] leading-normal max-w-xs font-medium">
                  Format and route webhook details immediately to target channels using Slack Block Kit cards and actionable links.
                </p>
              </div>
            </motion.div>

            {/* Card 04 with floating 3D sphere */}
            <div className="border border-[#1f1f1f] bg-[#0a0a0a]/20 rounded-2xl p-6 flex flex-col h-44 space-y-4 hover:border-zinc-800 transition-colors relative overflow-hidden">
              <div className="space-y-4 flex flex-col z-10">
                <span className="text-[10px] text-zinc-500 font-mono">04 /</span>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-zinc-200 uppercase tracking-wide">Log Inspection & Retry</h3>
                  <p className="text-zinc-500 text-[10px] leading-normal max-w-xs">
                    Inspect event payloads, trace triage errors, and trigger manual webhooks reloads in one click.
                  </p>
                </div>
              </div>

              {/* Interactive Floating Liquid Metal Sphere */}
              <div className="absolute right-[-10px] bottom-[-20px] w-36 h-36 opacity-90 pointer-events-none z-0 overflow-hidden">
                <div className="w-full h-full animate-float-medium">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <div className="w-[125%] h-[125%] absolute -left-[12.5%] -top-[12.5%]">
                      <LiquidMetal
                        {...liquidMetalPresets[2]}
                        colorBack="#000000"
                        colorTint="#ffffff"
                        shape="circle"
                        scale={0.8}
                        style={{ width: "100%", height: "100%", mixBlendMode: "screen" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Pricing / Call-to-action */}
        <section id="pricing" className="border-t border-[#1f1f1f]/50 pt-16 text-center space-y-8 relative">
          
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-3xl font-bold uppercase tracking-tight text-white leading-none">
              SPECIAL ACCESSIBILITY <br />FOR ACTIVE TEAMS
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              We are offering unlimited connected repositories and automated rules completely free for the initial cohort. Elevate your automation today.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link href="/api/auth/login" prefetch={false}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="bg-white text-black hover:bg-zinc-200 font-bold px-8 py-3.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 shadow-2xl"
              >
                Connect GitHub <ArrowUpRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] bg-black py-16 px-6 text-center text-xs text-zinc-600 z-10 font-grotesk">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p>© {new Date().getFullYear()} Autobot. Webhook automation for engineering teams.</p>
          <div className="flex gap-6 uppercase tracking-wider text-[10px] font-medium">
            <a href="https://github.com" className="hover:text-zinc-400">GitHub</a>
            <a href="https://slack.com" className="hover:text-zinc-400">Slack</a>
            <a href="https://neon.tech" className="hover:text-zinc-400">Neon</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
