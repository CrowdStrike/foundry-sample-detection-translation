const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

// Build configuration
esbuild
  .build({
    entryPoints: [path.join(__dirname, "src", "app.js")],
    bundle: true,
    outfile: path.join(__dirname, "dist", "app.js"),
    format: "esm", // Keep as ES modules since we're using import maps for Foundry JS
    minify: true,
    sourcemap: true,
    external: ["@crowdstrike/foundry-js"], // Don't bundle this as it's provided via import maps
    plugins: [
      // Add any plugins if needed in the future
    ],
  })
  .catch((error) => {
    console.error("Build failed:", error);
    process.exit(1);
  });

// Copy index.html without modification
const srcHtmlPath = path.join(__dirname, "src", "index.html");
const distHtmlPath = path.join(__dirname, "dist", "index.html");

// Copy the HTML file to dist directory
fs.copyFile(srcHtmlPath, distHtmlPath, (err) => {
  if (err) {
    console.error("Error copying index.html to dist:", err);
    return;
  }
  console.log("index.html copied to dist/ successfully");
});
