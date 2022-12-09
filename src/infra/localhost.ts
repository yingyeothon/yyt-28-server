export function isLocalhost({
  ip,
  ips,
}: {
  ip: string;
  ips?: string[];
}): boolean {
  if (ips && ips[ips.length - 1] === "127.0.0.1") {
    return true;
  }
  if (ip === "127.0.0.1") {
    return true;
  }
  return false;
}
