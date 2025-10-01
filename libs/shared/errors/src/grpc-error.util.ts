/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export const GRPC_UNAVAILABLE_CODE = 14; // @grpc/grpc-js status.UNAVAILABLE

export function isGrpcUnavailableError(err: any): boolean {
  if (!err) return false;
  if (typeof err.code === "number" && err.code === GRPC_UNAVAILABLE_CODE) return true;
  const msg = String(err.message || "").toUpperCase();
  const details = String(err.details ?? err.data?.details ?? "").toUpperCase();
  return msg.includes("ECONNREFUSED") || msg.includes("UNAVAILABLE") || msg.includes("NO CONNECTION") || details.includes("UNAVAILABLE");
}

export function mapGrpcErrorDetail(err: any): string | undefined {
  if (!err) return undefined;
  const code = typeof err.code === "number" ? err.code : undefined;
  const name = code === GRPC_UNAVAILABLE_CODE ? "UNAVAILABLE" : undefined;
  const reason = err.details || err.message;
  return [name, reason].filter(Boolean).join(": ");
}
