/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Thêm cấu hình này nếu bạn sử dụng ảnh từ domain bên ngoài
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;