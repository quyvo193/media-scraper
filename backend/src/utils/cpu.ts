import os from "os";

/**
 * CPU Monitor
 * Tracks CPU usage over time for accurate load measurement
 */

interface CpuTimes {
  idle: number;
  total: number;
}

let previousCpuTimes: CpuTimes | null = null;

/**
 * Get current CPU times
 */
function getCpuTimes(): CpuTimes {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  });

  return { idle, total };
}

/**
 * Get CPU load percentage (0-100)
 * Measures CPU usage since last call for accurate readings
 */
export function getCpuLoad(): number {
  const currentTimes = getCpuTimes();

  if (!previousCpuTimes) {
    previousCpuTimes = currentTimes;
    return 0; // First call, no data yet
  }

  const idleDiff = currentTimes.idle - previousCpuTimes.idle;
  const totalDiff = currentTimes.total - previousCpuTimes.total;

  previousCpuTimes = currentTimes;

  if (totalDiff === 0) return 0;

  const usage = ((totalDiff - idleDiff) / totalDiff) * 100;
  return Math.round(usage);
}

/**
 * Check if CPU load is above threshold
 */
export function isCpuHigh(thresholdPercent: number = 70): boolean {
  return getCpuLoad() > thresholdPercent;
}

/**
 * Check if CPU load is below threshold
 */
export function isCpuLow(thresholdPercent: number = 40): boolean {
  return getCpuLoad() < thresholdPercent;
}
