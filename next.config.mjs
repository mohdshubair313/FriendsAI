/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- DELETE THE ENTIRE 'webpack' FUNCTION ---

  // 1. Convert all other *.svg imports to React components using @svgr/webpack
  //    This replaces your custom Webpack rule for SVGR.
  svgr: true,

  // 2. To ensure that *.svg?url is treated as a standard file/URL (your second rule),
  //    Next.js handles this by default when `svgr: true`.

  // 3. To silence the original Turbopack error (if it was still complaining):
  turbopack: {},

  // ...other config like i18n, output, etc.
};

export default nextConfig;