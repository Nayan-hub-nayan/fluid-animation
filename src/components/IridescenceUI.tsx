import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Instagram, Search, Twitter, ArrowUpRight } from 'lucide-react';
import { useEffect } from 'react';

export function IridescenceUI() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 30, stiffness: 100 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Parallax transforms
  const titleX = useTransform(smoothX, (x) => x * 40);
  const titleY = useTransform(smoothY, (y) => y * 40);
  const subX = useTransform(smoothX, (x) => x * 20);
  const subY = useTransform(smoothY, (y) => y * 20);

  return (
    <div className="relative z-10 w-full h-full text-white font-sans overflow-hidden">
      {/* Top Bar */}
      <nav className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] md:text-[10px] tracking-[0.3em] font-mono opacity-50 uppercase">SH-01 EXPERIMENT</span>
          <h2 className="text-xs md:text-sm tracking-[0.1em] font-light">SYSTEM MANIFEST</h2>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:flex bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 items-center gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            <div className="flex gap-2 text-[10px] tracking-widest uppercase opacity-70">
              <span>EXPLORE</span>
              <span className="opacity-30">/</span>
              <span>INDEX</span>
            </div>
            <Search size={14} className="opacity-50" />
          </div>
          
          <div className="flex gap-2 md:gap-4">
            <button className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Twitter size={14} className="md:w-[16px]" />
            </button>
            <button className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Instagram size={14} className="md:w-[16px]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-24">
        <motion.div
           style={{ x: titleX, y: titleY }}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1.5, ease: "easeOut" }}
           className="relative"
        >
          <h1 className="font-serif text-[18vw] sm:text-[12vw] leading-none italic tracking-tight font-medium text-white/90">
            Iridescence
          </h1>
          <div className="absolute -top-4 -left-2 w-full h-full bg-gradient-to-r from-pink-500/0 via-pink-400/10 to-purple-500/0 blur-2xl -z-10" />
        </motion.div>

        <motion.div 
          style={{ x: subX, y: subY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-8 md:mt-12 max-w-[280px] sm:max-w-sm"
        >
          <p className="text-xs md:text-sm leading-relaxed text-white/50 font-light tracking-wide">
            A study on light diffraction and fluid motion through GLSL shaders. 
            Interactive ripples respond to your proximity.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4">
            <button className="flex items-center gap-2 group">
              <span className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase font-semibold pb-1 border-b border-white/20 group-hover:border-white transition-all">SYSTEM MANIFEST</span>
              <ArrowUpRight size={12} className="opacity-50 group-hover:opacity-100 transition-opacity md:w-[14px]" />
            </button>
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 md:px-8 py-2 md:py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-[9px] md:text-xs tracking-[0.3em] uppercase font-semibold hover:bg-white/10 transition-all shadow-2xl pointer-events-auto"
            >
                Start
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Footer / Interaction Area */}
      <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-12 md:left-24 right-4 sm:right-12 md:right-24 flex justify-between items-end pointer-events-none">
        <div className="flex gap-4 sm:gap-12 items-center pointer-events-auto">
            {/* Removed redundant start button and cursor icon */}
        </div>

        <div className="hidden sm:flex flex-col items-end gap-1 opacity-30 font-mono text-[9px] tracking-widest uppercase">
            <span>Core: v2.4.9</span>
            <span>Latency: 14ms</span>
        </div>
      </div>
    </div>
  );
}
