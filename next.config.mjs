/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for Docker deployment
    output: 'standalone',

    // Environment variable mapping – maps Adobe's variables to your existing code expectations
    env: {
        NEXT_PUBLIC_AZURE_TTS_KEY: process.env.AZURE_TTS_KEY,
        NEXT_PUBLIC_AZURE_TTS_ENDPOINT: process.env.AZURE_TTS_ENDPOINT,
        NEXT_PUBLIC_GEMINI_API_KEY: process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        NEXT_PUBLIC_AZURE_TTS_DEPLOYMENT: process.env.AZURE_TTS_DEPLOYMENT || 'tts',
        TTS_PROVIDER: process.env.TTS_PROVIDER || 'azure',
        LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini',
        GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        ADOBE_EMBED_API_KEY: process.env.ADOBE_EMBED_API_KEY,
    },

    // Replace experimental.serverComponentsExternalPackages
    serverExternalPackages: ['pdf2pic', 'pdfjs-dist'],

    webpack: (config, { isServer, webpack }) => {
        // PDF.js worker and Node fallback
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                stream: false,
                crypto: false,
            };
        }

        // Polyfill DOMMatrix on the server to avoid build-time errors
        config.plugins.push(
            new webpack.DefinePlugin({
                'global.DOMMatrix': 'typeof DOMMatrix !== "undefined" ? DOMMatrix : class {}',
            })
        );

        return config;
    },

    // Security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                ],
            },
        ];
    },
};

export default nextConfig;