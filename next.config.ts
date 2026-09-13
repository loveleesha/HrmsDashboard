import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // The backend's password-reset email links to /resetpassword.html
        // (a static-site-style path); this app's real route is
        // /reset-password. Query params (token, email) pass through as-is.
        source: "/resetpassword.html",
        destination: "/reset-password",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
