/** NOAA equation-of-time approx + longitude correction (东八区基准 120°E). */

export interface TrueSolarResult {
  corrected: boolean;
  hour: number;
  minute: number;
  dayOffset: number;
  branch: number;
  totalCorrectionMinutes: number;
}

const mod = (v: number, b: number) => ((v % b) + b) % b;

function isLeap(y: number) {
  return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
}

function dayOfYear(y: number, m: number, d: number) {
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
}

export function equationOfTimeMinutes(y: number, m: number, d: number, h = 12, mi = 0) {
  const days = isLeap(y) ? 366 : 365;
  const fh = h + mi / 60;
  const gamma = ((2 * Math.PI) / days) * (dayOfYear(y, m, d) - 1 + (fh - 12) / 24);
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma))
  );
}

export function branchFromMinutes(mins: number) {
  if (mins >= 1380 || mins < 60) return 0;
  return Math.floor((mins - 60) / 120) + 1;
}

export function calculateTrueSolar(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  longitude?: number;
}): TrueSolarResult {
  const corrected = input.longitude !== undefined && Number.isFinite(input.longitude);
  const lngCorr = corrected ? (input.longitude! - 120) * 4 : 0;
  const eot = corrected
    ? equationOfTimeMinutes(input.year, input.month, input.day, input.hour, input.minute)
    : 0;
  const total = lngCorr + eot;
  const raw = input.hour * 60 + input.minute + total;
  const rounded = Math.round(raw * 60);
  const dayOffset = Math.floor(rounded / 86400);
  const sod = mod(rounded, 86400);
  const hour = Math.floor(sod / 3600);
  const minute = Math.floor((sod % 3600) / 60);
  const normalized = sod / 60;
  return {
    corrected,
    hour,
    minute,
    dayOffset,
    branch: branchFromMinutes(normalized),
    totalCorrectionMinutes: total,
  };
}

export const BRANCH_NAMES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
