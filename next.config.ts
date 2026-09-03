import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/sign-in",
        destination: "/signin",
        permanent: true,
      },
      {
        source: "/sigin",
        destination: "/signin",
        permanent: true,
      },
      {
        source: "/sign-up",
        destination: "/signup",
        permanent: true,
      },
      {
        source: "/sigup",
        destination: "/signup",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
