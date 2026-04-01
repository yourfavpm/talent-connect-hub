import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const LOADING_PHRASES = [
  "Polishing the operations gear...",
  "Sourcing high-fidelity talent...",
  "Assembling your dashboard...",
  "Virtually high-fiving the server...",
  "Calibrating excellence...",
  "Synchronizing with the mothership...",
  "Optimizing for maximum scale...",
  "Vetting the pixels...",
  "Reticulating splines...",
  "Readying your workspace...",
  "Connecting professional dots...",
  "Injecting corporate blue..."
];

const OpslyLoader = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0A0A0B] font-inter overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#0f2147]/20 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-12">
        {/* Animated Logo Container */}
        <div className="relative">
          {/* Pulsing ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.2, 1.4],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute inset-0 rounded-full border-2 border-blue-500/30"
          />
          
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative h-24 w-24 rounded-3xl bg-[#0f2147] border border-white/10 flex items-center justify-center shadow-[0_20px_50px_rgba(15,33,71,0.4)]"
          >
            <img 
              src="/images/logoplain.png" 
              alt="OPSly" 
              className="h-12 w-12 object-contain brightness-0 invert"
            />
          </motion.div>
          
          {/* Subtle reflection shadow */}
          <motion.div
            animate={{ 
              scale: [0.8, 1, 0.8],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-2 w-16 bg-blue-500/20 blur-md rounded-full mt-6 mx-auto"
          />
        </div>

        {/* Dynamic Fun Phrases */}
        <div className="h-8 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase text-center"
            >
              {LOADING_PHRASES[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
                backgroundColor: ["#1e293b", "#3b82f6", "#1e293b"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="h-1.5 w-1.5 rounded-full"
            />
          ))}
        </div>
      </div>
      
      {/* Bottom Identity Block */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <p className="text-[10px] font-black tracking-[0.3em] text-slate-700 uppercase">
          OPSly<span className="text-slate-800">HR</span> &bull; Strategic Operations
        </p>
      </div>
    </div>
  );
};

export default OpslyLoader;
