/**
 * RL Training Environment Configuration
 *
 * This module provides configuration and variance for training RL agents
 * on the Asana UI replica. It simulates real-world conditions like varying
 * network speeds, viewport sizes, and browser behaviors.
 */

export type NetworkCondition = {
  name: string;
  downloadKbps: number;
  uploadKbps: number;
  latencyMs: number;
  packetLoss: number; // percentage 0-100
};

export type ViewportConfig = {
  name: string;
  width: number;
  height: number;
  deviceType: "mobile" | "tablet" | "desktop";
};

export type BrowserQuirk = {
  name: string;
  cssSupport: boolean;
  features: string[];
};

export const NETWORK_CONDITIONS: Record<string, NetworkCondition> = {
  fast: {
    name: "Fast (Fiber)",
    downloadKbps: 100000,
    uploadKbps: 50000,
    latencyMs: 20,
    packetLoss: 0,
  },
  cable: {
    name: "Cable",
    downloadKbps: 50000,
    uploadKbps: 10000,
    latencyMs: 50,
    packetLoss: 0,
  },
  "4g": {
    name: "4G",
    downloadKbps: 10000,
    uploadKbps: 5000,
    latencyMs: 100,
    packetLoss: 1,
  },
  "3g": {
    name: "3G",
    downloadKbps: 700,
    uploadKbps: 700,
    latencyMs: 300,
    packetLoss: 5,
  },
  "slow-3g": {
    name: "Slow 3G",
    downloadKbps: 400,
    uploadKbps: 400,
    latencyMs: 500,
    packetLoss: 10,
  },
  offline: {
    name: "Offline",
    downloadKbps: 0,
    uploadKbps: 0,
    latencyMs: 0,
    packetLoss: 100,
  },
};

export const VIEWPORT_CONFIGS: ViewportConfig[] = [
  // Mobile
  { name: "iPhone SE", width: 375, height: 667, deviceType: "mobile" },
  { name: "iPhone 12", width: 390, height: 844, deviceType: "mobile" },
  { name: "iPhone 14 Pro Max", width: 430, height: 932, deviceType: "mobile" },
  { name: "Galaxy S21", width: 360, height: 800, deviceType: "mobile" },

  // Tablet
  { name: "iPad Mini", width: 768, height: 1024, deviceType: "tablet" },
  { name: "iPad Pro 11", width: 834, height: 1194, deviceType: "tablet" },
  { name: "iPad Pro 12.9", width: 1024, height: 1366, deviceType: "tablet" },

  // Desktop
  { name: "Laptop 1280x720", width: 1280, height: 720, deviceType: "desktop" },
  { name: "Desktop 1920x1080", width: 1920, height: 1080, deviceType: "desktop" },
  { name: "Desktop 2560x1440", width: 2560, height: 1440, deviceType: "desktop" },
  { name: "Ultrawide 3440x1440", width: 3440, height: 1440, deviceType: "desktop" },
];

export const BROWSER_QUIRKS: Record<string, BrowserQuirk> = {
  chrome: {
    name: "Chrome",
    cssSupport: true,
    features: ["webgl", "webrtc", "serviceworker"],
  },
  firefox: {
    name: "Firefox",
    cssSupport: true,
    features: ["webgl", "webrtc"],
  },
  safari: {
    name: "Safari",
    cssSupport: true,
    features: ["webgl"],
  },
  edge: {
    name: "Edge",
    cssSupport: true,
    features: ["webgl", "webrtc", "serviceworker"],
  },
};

export interface EnvironmentVariance {
  networkCondition: NetworkCondition;
  viewport: ViewportConfig;
  browserQuirk: BrowserQuirk;
  zoomLevel: number; // 0.5 to 2.0
  darkMode: boolean;
  sidebarCollapsed: boolean;
  loadingDelay: number; // artificial delay in ms
}

/**
 * Sample a random environment configuration for training diversity
 */
export function sampleEnvironmentVariance(): EnvironmentVariance {
  const networkKeys = Object.keys(NETWORK_CONDITIONS);
  const networkKey = networkKeys[Math.floor(Math.random() * networkKeys.length)];

  const viewport = VIEWPORT_CONFIGS[Math.floor(Math.random() * VIEWPORT_CONFIGS.length)];

  const browserKeys = Object.keys(BROWSER_QUIRKS);
  const browserKey = browserKeys[Math.floor(Math.random() * browserKeys.length)];

  // Zoom level between 50% and 150%
  const zoomLevel = 0.5 + Math.random();

  // Loading delay between 0-1000ms
  const loadingDelay = Math.floor(Math.random() * 1000);

  return {
    networkCondition: NETWORK_CONDITIONS[networkKey],
    viewport,
    browserQuirk: BROWSER_QUIRKS[browserKey],
    zoomLevel,
    darkMode: Math.random() > 0.5,
    sidebarCollapsed: Math.random() > 0.7,
    loadingDelay,
  };
}

/**
 * Apply environment variance to the browser/viewport
 * This is called by the RL environment wrapper
 */
export function applyEnvironmentVariance(variance: EnvironmentVariance) {
  // Apply zoom level
  if (typeof document !== "undefined") {
    document.body.style.zoom = variance.zoomLevel.toString();
  }

  // Apply dark mode
  if (typeof document !== "undefined" && variance.darkMode) {
    document.documentElement.classList.add("dark");
  } else if (typeof document !== "undefined") {
    document.documentElement.classList.remove("dark");
  }

  // Store variance in window for RL environment to read
  if (typeof window !== "undefined") {
    (window as any).rlEnvironmentVariance = variance;
  }
}

/**
 * Get current environment variance
 */
export function getCurrentVariance(): EnvironmentVariance | null {
  if (typeof window === "undefined") {
    return null;
  }
  return (window as any).rlEnvironmentVariance || null;
}

/**
 * Simulate network latency
 */
export async function simulateNetworkLatency(latencyMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, latencyMs));
}

/**
 * Get a network condition profile name from speed
 */
export function getNetworkProfileFromSpeed(downloadKbps: number): string {
  if (downloadKbps >= 50000) return "fast";
  if (downloadKbps >= 10000) return "cable";
  if (downloadKbps >= 5000) return "4g";
  if (downloadKbps >= 700) return "3g";
  if (downloadKbps >= 400) return "slow-3g";
  return "offline";
}
