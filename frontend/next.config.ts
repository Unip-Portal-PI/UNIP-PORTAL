import type { NextConfig } from "next";

const localIp = process.env.NEXT_PUBLIC_LAN_IP?.trim();

const allowedDevOrigins = [
  "http://localhost:3100",
  "http://127.0.0.1:3100",
  "http://192.168.253.30:3100",
  "http://192.168.253.31:3100",
  localIp ? `http://${localIp}:3100` : null,
].filter(Boolean) as string[];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
