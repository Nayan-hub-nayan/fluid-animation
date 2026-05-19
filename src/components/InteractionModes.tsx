import { motion } from 'motion/react';
import { Wind, Droplets, Ghost, Zap } from 'lucide-react';
import { FluidMode, FLUID_PRESETS, FluidConfig } from '../types';

interface ModesProps {
  currentMode: FluidMode;
  onModeChange: (mode: FluidMode, presets: Partial<FluidConfig>) => void;
}

const MODES = [
  { id: 'flow', label: 'Classic Flow', icon: <Wind size={16} />, color: '#3B82F6' },
  { id: 'dense', label: 'Liquid Blobs', icon: <Droplets size={16} />, color: '#EC4899' },
  { id: 'storm', label: 'Plasma Storm', icon: <Zap size={16} />, color: '#F59E0B' },
] as const;

export function InteractionModes({ currentMode, onModeChange }: ModesProps) {
  return (
    <div className="fixed bottom-6 right-4 sm:bottom-12 sm:right-12 md:right-24 z-[90] flex flex-col gap-3 items-end">
      <div className="flex flex-col gap-1.2 items-end">
         <span className="text-[9px] tracking-[0.3em] font-mono opacity-30 uppercase mr-1 mb-1 hidden sm:block">Interaction Mode</span>
         <div className="flex items-center gap-1.5 p-1.5 bg-[#141517]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
            {MODES.map((mode) => {
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onModeChange(mode.id as FluidMode, FLUID_PRESETS[mode.id as FluidMode])}
                  className="group relative"
                >
                  <div 
                    className={`
                      relative z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl transition-all duration-500
                      ${isActive ? 'text-white' : 'text-white/20 hover:text-white/50 hover:bg-white/5'}
                    `}
                  >
                    <span className="hidden sm:block">{mode.icon}</span>
                    <span className="block sm:hidden">{isActive ? mode.icon : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div 
                      layoutId="active-mode"
                      className="absolute inset-0 rounded-xl bg-white/10 border border-white/10"
                      style={{ boxShadow: `0 0 20px ${mode.color}40` }}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg bg-[#0A0A0B] border border-white/10 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tracking-widest uppercase font-bold text-white/70">
                    {mode.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-[#0A0A0B]" />
                  </div>
                </button>
              );
            })}
         </div>
      </div>
    </div>
  );
}
