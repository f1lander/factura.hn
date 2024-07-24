/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/invoices',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
