// Simple color utilities using ANSI escape codes
const RESET = "\x1b[0m";
const COLORS = {
  gray: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

type Level = "debug" | "info" | "warn" | "error" | "fatal";

export function colorLevel(level: Level, text: string): string {
  switch (level) {
    case "debug":
      return `${COLORS.gray}${text}${RESET}`;
    case "info":
      return `${COLORS.green}${text}${RESET}`;
    case "warn":
      return `${COLORS.yellow}${text}${RESET}`;
    case "error":
      return `${COLORS.red}${text}${RESET}`;
    case "fatal":
      return `${COLORS.magenta}${text}${RESET}`;
    default:
      return text;
  }
}

export function formatLogLine(params: { timestamp: string; level: Level; service: string; func: string; message: string; data?: any }): string {
  const serviceSeg = `${COLORS.magenta}[${params.service}]${RESET}`; // purple
  const ts = `${COLORS.cyan}[${params.timestamp}]${RESET}`;
  const lvl = colorLevel(params.level, params.level.toUpperCase());
  const methodSeg = `${COLORS.yellow}[${params.func}]${RESET}`; // yellow
  const messageSed = colorLevel(params.level, params.message);
  const base = `${serviceSeg} ${ts} ${lvl} ${params.func} | ${messageSed}`;
  if (params.data === undefined || params.data === null) return base;
  try {
    const serialized = typeof params.data === "string" ? params.data : JSON.stringify(params.data, null, 2);
    return `${base} ${COLORS.gray}${serialized}${RESET}`;
  } catch {
    return base;
  }
}
