module.exports = {
  apps: [
    {
      name: 'hono-api',
      script: 'pnpm',
      args: 'dev:hono',
      cwd: './',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
