/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        // Mock IndexedDB for server-side rendering
        if (isServer) {
            config.plugins.push(
                new (require('webpack').DefinePlugin)({
                    'window.indexedDB': 'undefined',
                    'window.IDBRequest': 'undefined',
                    'window.IDBTransaction': 'undefined',
                    'window.IDBKeyRange': 'undefined',
                    'window.IDBCursor': 'undefined',
                    'window.IDBDatabase': 'undefined',
                    'window.IDBObjectStore': 'undefined',
                    'window.IDBIndex': 'undefined',
                    'window.IDBFactory': 'undefined',
                })
            );
        }

        // Add externals
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        
        return config;
    },
    // Configure the compiler
    compiler: {
        // Disable removing React properties in production
        reactRemoveProperties: false,
        // Keep error logs in production
        removeConsole: process.env.NODE_ENV === 'production' ? { 
            exclude: ['error'] 
        } : false,
    },
    // Handle static exports
    output: 'standalone',
    // Configure TypeScript
    typescript: {
        // Ignore TypeScript errors during build
        ignoreBuildErrors: false,
    },
    // Configure ESLint
    eslint: {
        // Don't run ESLint during build
        ignoreDuringBuilds: false,
    },
    // Configure images
    images: {
        // Disable image optimization during build
        unoptimized: true,
    }
};

// Only require @next/bundle-analyzer in development
if (process.env.ANALYZE === 'true') {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
        enabled: process.env.ANALYZE === 'true',
    });
    module.exports = withBundleAnalyzer(nextConfig);
} else {
    module.exports = nextConfig;
}