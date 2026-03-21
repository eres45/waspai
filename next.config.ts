import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    env: {
      NO_HTTPS: process.env.NO_HTTPS,
    },
    experimental: {
      taint: true,
      authInterrupts: true,
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "api.telegram.org",
        },
        {
          protocol: "https",
          hostname: "api.infip.pro",
        },
      ],
    },
    webpack: (config, { isServer, webpack }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          https: false,
          http: false,
          url: false,
          buffer: false,
          stream: false,
          os: false,
          zlib: false,
        };

        // Handle 'node:' prefixed imports for browser-side libraries like pptxgenjs
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            /^node:/,
            (resource: any) => {
              resource.request = resource.request.replace(/^node:/, "");
            },
          ),
        );
      }
      return config;
    },
  };
  const withNextIntl = createNextIntlPlugin();
  return withNextIntl(nextConfig);
};
