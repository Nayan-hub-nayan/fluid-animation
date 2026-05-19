
export type FluidMode = 'flow' | 'dense' | 'storm';

export interface FluidConfig {
  mode: FluidMode;
  simRes: number;
  iterations: number;
  velocityDissipation: number;
  densityDissipation: number;
  splatRadius: number;
  curlIntensity: number;
  colors: string[];
  colorSpeed: number;
  showCursor: boolean;
}

export const DEFAULT_CONFIG: FluidConfig = {
  mode: 'dense',
  simRes: 256,
  iterations: 40,
  velocityDissipation: 0.97,
  densityDissipation: 0.98,
  splatRadius: 0.0004,
  curlIntensity: 10,
  colors: ['#ff0080', '#00ffcc', '#8000ff'],
  colorSpeed: 1.0,
  showCursor: true,
};

export const FLUID_PRESETS: Record<FluidMode, Partial<FluidConfig>> = {
  flow: {
    iterations: 20,
    velocityDissipation: 0.99,
    densityDissipation: 0.995,
    splatRadius: 0.0008,
    curlIntensity: 30,
  },
  dense: {
    iterations: 40,
    velocityDissipation: 0.97,
    densityDissipation: 0.98,
    splatRadius: 0.0004,
    curlIntensity: 10,
  },
  storm: {
    iterations: 20,
    velocityDissipation: 0.99,
    densityDissipation: 0.995,
    splatRadius: 0.0008,
    curlIntensity: 80,
  }
};
