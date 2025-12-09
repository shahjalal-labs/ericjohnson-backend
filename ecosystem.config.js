module.exports = {
  apps: [
    {
      name: "playspark-server",
      script: "./dist/server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "playspark-email-worker",
      script: "./dist/workers/emailWorker.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
