import { useEffect, useRef } from 'react';
import * as twgl from 'twgl.js';
import { FluidConfig } from '../types';

// --- Helpers ---
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255.0,
    parseInt(result[2], 16) / 255.0,
    parseInt(result[3], 16) / 255.0
  ] : [1, 1, 1];
};

// --- Shaders ---

const baseVS = `
  precision highp float;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const splatFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D u_target;
  uniform float u_aspect;
  uniform vec2 u_point;
  uniform vec3 u_color;
  uniform float u_radius;

  void main() {
    vec2 p = vUv - u_point.xy;
    p.x *= u_aspect;
    vec3 base = texture2D(u_target, vUv).xyz;
    // Softer falloff for better mixing
    float m = exp(-dot(p, p) / (u_radius * 1.5));
    gl_FragColor = vec4(base + m * u_color, 1.0);
  }
`;

const advectionFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D u_velocity;
  uniform sampler2D u_source;
  uniform vec2 u_texelSize;
  uniform float u_dt;
  uniform float u_dissipation;

  void main() {
    vec2 coord = vUv - u_dt * texture2D(u_velocity, vUv).xy * u_texelSize;
    gl_FragColor = u_dissipation * texture2D(u_source, coord);
  }
`;

const divergenceFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D u_velocity;
  uniform vec2 u_texelSize;

  void main() {
    float L = texture2D(u_velocity, vUv - vec2(u_texelSize.x, 0.0)).x;
    float R = texture2D(u_velocity, vUv + vec2(u_texelSize.x, 0.0)).x;
    float T = texture2D(u_velocity, vUv + vec2(0.0, u_texelSize.y)).y;
    float B = texture2D(u_velocity, vUv - vec2(0.0, u_texelSize.y)).y;
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const pressureFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D u_pressure;
  uniform sampler2D u_divergence;
  uniform vec2 u_texelSize;

  void main() {
    float L = texture2D(u_pressure, vUv - vec2(u_texelSize.x, 0.0)).x;
    float R = texture2D(u_pressure, vUv + vec2(u_texelSize.x, 0.0)).x;
    float T = texture2D(u_pressure, vUv + vec2(0.0, u_texelSize.y)).x;
    float B = texture2D(u_pressure, vUv - vec2(0.0, u_texelSize.y)).x;
    float div = texture2D(u_divergence, vUv).x;
    float p = (L + R + B + T - div) * 0.25;
    gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D u_pressure;
  uniform sampler2D u_velocity;
  uniform vec2 u_texelSize;

  void main() {
    float L = texture2D(u_pressure, vUv - vec2(u_texelSize.x, 0.0)).x;
    float R = texture2D(u_pressure, vUv + vec2(u_texelSize.x, 0.0)).x;
    float T = texture2D(u_pressure, vUv + vec2(0.0, u_texelSize.y)).x;
    float B = texture2D(u_pressure, vUv - vec2(0.0, u_texelSize.y)).x;
    vec2 v = texture2D(u_velocity, vUv).xy;
    gl_FragColor = vec4(v - 0.5 * vec2(R - L, T - B), 0.0, 1.0);
  }
`;

const curlFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D u_velocity;
  uniform vec2 u_texelSize;

  void main() {
    float L = texture2D(u_velocity, vUv - vec2(u_texelSize.x, 0.0)).y;
    float R = texture2D(u_velocity, vUv + vec2(u_texelSize.x, 0.0)).y;
    float T = texture2D(u_velocity, vUv + vec2(0.0, u_texelSize.y)).x;
    float B = texture2D(u_velocity, vUv - vec2(0.0, u_texelSize.y)).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D u_velocity;
  uniform sampler2D u_curl;
  uniform float u_curlIntensity;
  uniform float u_dt;
  uniform vec2 u_texelSize;

  void main() {
    float L = abs(texture2D(u_curl, vUv - vec2(u_texelSize.x, 0.0)).x);
    float R = abs(texture2D(u_curl, vUv + vec2(u_texelSize.x, 0.0)).x);
    float T = abs(texture2D(u_curl, vUv + vec2(0.0, u_texelSize.y)).x);
    float B = abs(texture2D(u_curl, vUv - vec2(0.0, u_texelSize.y)).x);
    float C = texture2D(u_curl, vUv).x;

    vec2 force = 0.5 * vec2(T - B, R - L);
    force /= length(force) + 0.0001;
    force *= u_curlIntensity * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(u_velocity, vUv).xy;
    gl_FragColor = vec4(velocity + force * u_dt, 0.0, 1.0);
  }
`;

const displayFS = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D u_texture;

  void main() {
    vec3 c = texture2D(u_texture, vUv).rgb;
    // Enhancement for neon vibrancy and dark contrast
    float brightness = length(c);
    c = pow(c, vec3(0.9)); // Keep it deep
    c *= 1.5 + 1.0 * smoothstep(0.2, 0.8, brightness);
    
    // Vignette for depth
    float d = distance(vUv, vec2(0.5));
    c *= smoothstep(0.8, 0.4, d);
    
    gl_FragColor = vec4(c, 1.0);
  }
`;

// --- Simulation Logic ---

export function FluidBackground({ config }: { config: FluidConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(config);
  const mouseState = useRef({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    dx: 0,
    dy: 0,
    moved: false
  });

  // Sync ref to avoid closure issues in rAF
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // We need float textures for the simulation to be stable
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) return;

    const ext = gl.getExtension('OES_texture_float');
    const ext2 = gl.getExtension('OES_texture_float_linear');
    if (!ext) {
      console.warn('OES_texture_float not supported');
    }

    function createDoubleFBO(w: number, h: number) {
      let fbo1 = twgl.createFramebufferInfo(gl!, [{ internalFormat: gl!.RGBA, type: gl!.FLOAT, minMag: gl!.LINEAR, wrap: gl!.CLAMP_TO_EDGE }], w, h);
      let fbo2 = twgl.createFramebufferInfo(gl!, [{ internalFormat: gl!.RGBA, type: gl!.FLOAT, minMag: gl!.LINEAR, wrap: gl!.CLAMP_TO_EDGE }], w, h);
      return {
        get read() { return fbo1; },
        get write() { return fbo2; },
        swap() { let tmp = fbo1; fbo1 = fbo2; fbo2 = tmp; }
      };
    }

    const simWidth = config.simRes;
    const simHeight = config.simRes;

    const density = createDoubleFBO(simWidth, simHeight);
    const velocity = createDoubleFBO(simWidth, simHeight);
    const pressure = createDoubleFBO(simWidth, simHeight);
    const divergence = twgl.createFramebufferInfo(gl, [{ internalFormat: gl.RGBA, type: gl.FLOAT, minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE }], simWidth, simHeight);
    const curl = twgl.createFramebufferInfo(gl, [{ internalFormat: gl.RGBA, type: gl.FLOAT, minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE }], simWidth, simHeight);

    const programs = {
      splat: twgl.createProgramInfo(gl, [baseVS, splatFS]),
      advection: twgl.createProgramInfo(gl, [baseVS, advectionFS]),
      divergence: twgl.createProgramInfo(gl, [baseVS, divergenceFS]),
      curl: twgl.createProgramInfo(gl, [baseVS, curlFS]),
      vorticity: twgl.createProgramInfo(gl, [baseVS, vorticityFS]),
      pressure: twgl.createProgramInfo(gl, [baseVS, pressureFS]),
      gradient: twgl.createProgramInfo(gl, [baseVS, gradientSubtractFS]),
      display: twgl.createProgramInfo(gl, [baseVS, displayFS]),
    };

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] },
    });

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1.0 - e.clientY / window.innerHeight;
      mouseState.current.dx = (x - mouseState.current.x) * 5.0;
      mouseState.current.dy = (y - mouseState.current.y) * 5.0;
      mouseState.current.x = x;
      mouseState.current.y = y;
      mouseState.current.moved = true;
    };

    window.addEventListener('mousemove', handleMouseMove);

    function render(time: number) {
      if (!gl) return;
      const currentConfig = configRef.current;
      twgl.resizeCanvasToDisplaySize(canvas);
      
      const aspect = canvas.width / canvas.height;
      const texelSize = [1 / simWidth, 1 / simHeight];

      // 1. Inputs (Splat)
      if (mouseState.current.moved) {
        gl.useProgram(programs.splat.program);
        twgl.setBuffersAndAttributes(gl, programs.splat, bufferInfo);

        const currentConfig = configRef.current;
        const cycle = time * 0.001 * currentConfig.colorSpeed;
        const colorsRgb = currentConfig.colors.map(hexToRgb);
        const colorCount = colorsRgb.length;
        const totalPhase = (cycle % colorCount);
        const index = Math.floor(totalPhase);
        const nextIndex = (index + 1) % colorCount;
        const fract = totalPhase - index;
        const colorA = colorsRgb[index];
        const colorB = colorsRgb[nextIndex];
        const color = [
          colorA[0] * (1 - fract) + colorB[0] * fract,
          colorA[1] * (1 - fract) + colorB[1] * fract,
          colorA[2] * (1 - fract) + colorB[2] * fract,
        ];

        // Improved interpolation logic to prevent "dots" on fast movement
        const dist = Math.hypot(mouseState.current.x - mouseState.current.lastX, mouseState.current.y - mouseState.current.lastY);
        // Increase max steps for better continuity
        const steps = Math.min(Math.max(Math.floor(dist * 4000), 1), 60);

        for (let s = 0; s < steps; s++) {
          const t = s / steps;
          const x = mouseState.current.lastX + (mouseState.current.x - mouseState.current.lastX) * t;
          const y = mouseState.current.lastY + (mouseState.current.y - mouseState.current.lastY) * t;

          // Splat Velocity
          twgl.bindFramebufferInfo(gl, velocity.write);
          twgl.setUniforms(programs.splat, {
            u_target: velocity.read.attachments[0],
            u_aspect: aspect,
            u_point: [x, y],
            u_color: [mouseState.current.dx, mouseState.current.dy, 0.0],
            u_radius: currentConfig.splatRadius * 0.8
          });
          twgl.drawBufferInfo(gl, bufferInfo);
          velocity.swap();

          // Splat Density
          twgl.bindFramebufferInfo(gl, density.write);
          twgl.setUniforms(programs.splat, {
            u_target: density.read.attachments[0],
            u_aspect: aspect,
            u_point: [x, y],
            u_color: [color[0] * 3.5, color[1] * 3.5, color[2] * 3.0],
            u_radius: currentConfig.splatRadius * 1.5 // Larger overlap for smoother lines
          });
          twgl.drawBufferInfo(gl, bufferInfo);
          density.swap();
        }

        mouseState.current.lastX = mouseState.current.x;
        mouseState.current.lastY = mouseState.current.y;
        mouseState.current.moved = false;
        // Decay mouse velocity gradually
        mouseState.current.dx *= 0.95;
        mouseState.current.dy *= 0.95;
      } else {
        // Even if not moved, keep updating last positions to prevent jumps
        mouseState.current.lastX = mouseState.current.x;
        mouseState.current.lastY = mouseState.current.y;
      }

      // 2. Advection
      gl.useProgram(programs.advection.program);
      twgl.setBuffersAndAttributes(gl, programs.advection, bufferInfo);

      twgl.bindFramebufferInfo(gl, velocity.write);
      twgl.setUniforms(programs.advection, {
        u_velocity: velocity.read.attachments[0],
        u_source: velocity.read.attachments[0],
        u_texelSize: texelSize,
        u_dt: 0.016,
        u_dissipation: currentConfig.velocityDissipation
      });
      twgl.drawBufferInfo(gl, bufferInfo);
      velocity.swap();

      twgl.bindFramebufferInfo(gl, density.write);
      twgl.setUniforms(programs.advection, {
        u_velocity: velocity.read.attachments[0],
        u_source: density.read.attachments[0],
        u_texelSize: texelSize,
        u_dt: 0.016,
        u_dissipation: currentConfig.densityDissipation
      });
      twgl.drawBufferInfo(gl, bufferInfo);
      density.swap();

      // 3. Vorticity Confinement
      gl.useProgram(programs.curl.program);
      twgl.bindFramebufferInfo(gl, curl);
      twgl.setUniforms(programs.curl, {
        u_velocity: velocity.read.attachments[0],
        u_texelSize: texelSize
      });
      twgl.drawBufferInfo(gl, bufferInfo);

      gl.useProgram(programs.vorticity.program);
      twgl.bindFramebufferInfo(gl, velocity.write);
      twgl.setUniforms(programs.vorticity, {
        u_velocity: velocity.read.attachments[0],
        u_curl: curl.attachments[0],
        u_curlIntensity: currentConfig.curlIntensity,
        u_dt: 0.016,
        u_texelSize: texelSize
      });
      twgl.drawBufferInfo(gl, bufferInfo);
      velocity.swap();

      // 4. Pressure Projection
      gl.useProgram(programs.divergence.program);
      twgl.bindFramebufferInfo(gl, divergence);
      twgl.setUniforms(programs.divergence, {
        u_velocity: velocity.read.attachments[0],
        u_texelSize: texelSize
      });
      twgl.drawBufferInfo(gl, bufferInfo);

      gl.useProgram(programs.pressure.program);
      for (let i = 0; i < currentConfig.iterations; i++) {
        twgl.bindFramebufferInfo(gl, pressure.write);
        twgl.setUniforms(programs.pressure, {
          u_pressure: pressure.read.attachments[0],
          u_divergence: divergence.attachments[0],
          u_texelSize: texelSize
        });
        twgl.drawBufferInfo(gl, bufferInfo);
        pressure.swap();
      }

      gl.useProgram(programs.gradient.program);
      twgl.bindFramebufferInfo(gl, velocity.write);
      twgl.setUniforms(programs.gradient, {
        u_pressure: pressure.read.attachments[0],
        u_velocity: velocity.read.attachments[0],
        u_texelSize: texelSize
      });
      twgl.drawBufferInfo(gl, bufferInfo);
      velocity.swap();

      // 4. Output Display
      twgl.bindFramebufferInfo(gl, null);
      gl.useProgram(programs.display.program);
      twgl.setUniforms(programs.display, {
        u_texture: density.read.attachments[0]
      });
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }

    const animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full block bg-black"
    />
  );
}
