const { createRequestHandler } = require("@remix-run/node");
const build = require("./build/server/index.js");

exports.handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});
