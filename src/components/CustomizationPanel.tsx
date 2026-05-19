import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, ChevronDown, ChevronRight, Palette, Sliders, Search, GripHorizontal, Plus, Trash2, MousePointer2, EyeOff, MoreHorizontal } from 'lucide-react';
import { FluidConfig } from '../types';

interface PanelProps {
  config: FluidConfig;
  onChange: (updates: Partial<FluidConfig>) => void;
}

export function CustomizationPanel({ config, onChange }: PanelProps) {
  const [isOpen, setIsOpen] = useState(false); // Default to closed on mobile/tablet for better UX
  const [activeSections, setActiveSections] = useState({ shader: true, palette: true });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Open by default on desktop
    if (window.innerWidth >= 1024) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleSection = (section: 'shader' | 'palette') => {
    setActiveSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const addColor = () => {
    if (config.colors.length < 8) {
      onChange({ colors: [...config.colors, '#ffffff'] });
    }
  };

  const removeColor = (index: number) => {
    if (config.colors.length > 2) {
      const newColors = config.colors.filter((_, i) => i !== index);
      onChange({ colors: newColors });
    }
  };

  const updateColor = (index: number, value: string) => {
    const newColors = [...config.colors];
    newColors[index] = value;
    onChange({ colors: newColors });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 md:top-8 md:right-8 z-[100] w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1A1C1E]/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors shadow-2xl"
      >
        <Settings2 size={18} className="md:w-5 md:h-5" />
      </button>
    );
  }

  return (
    <motion.div 
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="fixed top-4 right-4 left-4 sm:left-auto md:top-8 md:right-8 z-[100] sm:w-[260px] bg-[#141517]/95 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden font-mono"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
         <div className="flex items-center gap-2.5 text-white/20">
            <MoreHorizontal size={14} className="cursor-pointer hover:text-white transition-colors" onClick={() => setIsOpen(false)} />
            <GripHorizontal size={14} />
         </div>
         <span className="text-[9px] tracking-[0.3em] uppercase text-white/40 font-semibold">Settings</span>
         <Search size={14} className="text-white/20" />
      </div>

      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
        {/* Shader Section */}
        <div className="rounded-xl overflow-hidden bg-white/[0.01] border border-white/[0.03]">
          <SectionHeader 
            icon={<Sliders size={12} />} 
            title="Shader" 
            isOpen={activeSections.shader} 
            onClick={() => toggleSection('shader')} 
          />
          <AnimatePresence>
            {activeSections.shader && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 space-y-4 border-l border-white/5 ml-4 mb-2">
                  <SliderRow 
                    label="splatRadius" 
                    value={config.splatRadius * 10000} 
                    min={1} 
                    max={20} 
                    onChange={(v) => onChange({ splatRadius: v / 10000 })} 
                  />
                  <SliderRow 
                    label="dissipation" 
                    value={config.densityDissipation * 100} 
                    min={90} 
                    max={99.9} 
                    onChange={(v) => onChange({ densityDissipation: v / 100, velocityDissipation: (v - 0.5) / 100 })} 
                  />
                  <SliderRow 
                    label="colorSpeed" 
                    value={config.colorSpeed} 
                    min={0} 
                    max={5} 
                    step={0.1}
                    onChange={(v) => onChange({ colorSpeed: v })} 
                  />
                  
                  {/* Cursor Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-white/40 uppercase tracking-tighter">Show Cursor</span>
                    <button 
                      onClick={() => onChange({ showCursor: !config.showCursor })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${config.showCursor ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/20'}`}
                    >
                      {config.showCursor ? <MousePointer2 size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Palette Section */}
        <div className="rounded-xl overflow-hidden bg-white/[0.01] border border-white/[0.03]">
          <SectionHeader 
            icon={<Palette size={12} />} 
            title="Palette" 
            isOpen={activeSections.palette} 
            onClick={() => toggleSection('palette')} 
          />
          <AnimatePresence>
            {activeSections.palette && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-3 border-l border-white/5 ml-4 mb-2">
                  {config.colors.map((color, index) => (
                    <ColorRow 
                      key={index} 
                      label={`color${String.fromCharCode(65 + index)}`} 
                      value={color} 
                      onRemove={config.colors.length > 2 ? () => removeColor(index) : undefined}
                      onChange={(v) => updateColor(index, v)} 
                    />
                  ))}
                  
                  {config.colors.length < 8 && (
                    <button 
                      onClick={addColor}
                      className="w-full py-2 flex items-center justify-center gap-2 rounded-md bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/50 transition-all border border-dashed border-white/10"
                    >
                      <Plus size={14} />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Add Color</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeader({ icon, title, isOpen, onClick }: { icon: any, title: string, isOpen: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full px-4 py-2.5 flex items-center gap-2.5 text-white/70 hover:bg-white/[0.02] transition-colors group"
    >
      <span className="text-white/30 group-hover:text-white/50 transition-colors">
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </span>
      <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold">{title}</span>
    </button>
  );
}

function SliderRow({ label, value, min, max, step = 1, onChange }: { label: string, value: number, min: number, max: number, step?: number, onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-[10px] tracking-tight">
        <span className="text-white/40">{label}...</span>
        <span className="bg-white/5 px-2 py-1 rounded text-white/60 min-w-10 text-right">{value.toFixed(label === 'colorSpeed' ? 2 : 1)}</span>
      </div>
      <div className="relative flex items-center h-4">
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step}
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#3B82F6]"
        />
        <div 
          className="absolute left-0 h-0.5 bg-[#3B82F6] rounded-full pointer-events-none" 
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange, onRemove }: { label: string, value: string, onChange: (v: string) => void, onRemove?: () => void, key?: number | string }) {
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-[10px] text-white/20 flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative overflow-hidden w-6 h-6 rounded-md border border-white/10">
          <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer opacity-0"
          />
          <div className="w-full h-full" style={{ backgroundColor: value }} />
        </div>
        <input 
          type="text" 
          value={value.toUpperCase()} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-white/5 text-[10px] text-white/60 px-2 py-1.5 rounded-md border border-white/5 w-20 outline-none focus:border-white/20 transition-colors uppercase"
        />
        {onRemove && (
          <button 
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded bg-white/5 text-white/10 hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
