/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FluidBackground } from './components/FluidBackground';
import { IridescenceUI } from './components/IridescenceUI';
import { CustomizationPanel } from './components/CustomizationPanel';
import { InteractionModes } from './components/InteractionModes';
import { DEFAULT_CONFIG, FluidConfig, FluidMode } from './types';

export default function App() {
  const [config, setConfig] = useState<FluidConfig>(DEFAULT_CONFIG);

  const updateConfig = (updates: Partial<FluidConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleModeChange = (mode: FluidMode, presets: Partial<FluidConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...presets,
      mode
    }));
  };

  return (
    <main id="app-container" className={`relative w-full h-screen overflow-hidden bg-[#050505] text-white selection:bg-pink-500/30 ${config.showCursor ? 'cursor-default' : 'cursor-none'}`}>
      <FluidBackground config={config} />
      <IridescenceUI />
      <CustomizationPanel config={config} onChange={updateConfig} />
      <InteractionModes currentMode={config.mode} onModeChange={handleModeChange} />
    </main>
  );
}

