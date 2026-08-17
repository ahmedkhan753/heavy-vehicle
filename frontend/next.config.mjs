/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // Hosts that next/image is allowed to optimize. Uploads are served from
    // Cloudinary; the static fallback image comes from Unsplash.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
