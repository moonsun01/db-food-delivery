import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // 페이지에서 redirect()를 호출하면 Cache Components의 instant 검증이 실패하므로
  // 렌더링 전에 처리되는 설정 리다이렉트를 쓴다.
  async redirects() {
    return [{ source: "/owner", destination: "/owner/orders", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
