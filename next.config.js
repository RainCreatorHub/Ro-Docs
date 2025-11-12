const { withFumadocs } = require('fumadocs-core/next-plugin');

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'mdx'],
};

module.exports = withFumadocs(config);
