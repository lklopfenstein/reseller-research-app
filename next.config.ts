import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth'],
};

export default nextConfig;
