// copyPackage.js

const fs = require("fs");
const path = require("path");
const sourcePath = path.resolve(__dirname, "package.json");
const targetPath = path.resolve(__dirname, "dist", "package.json");
const packageData = require(sourcePath);
delete packageData.scripts;
delete packageData.devDependencies;
packageData.main = "index.ts";
packageData.module = "index.ts";
packageData.typings = "index.ts";
packageData.types = "index.ts";
packageData.exports = {
  ".": {
    import: "./index.ts",
    require: "./index.ts",
    browser: "./index.ts",
  },
  "./style.css": {
    import: "./style.css",
    require: "./style.css",
  },
};
fs.writeFileSync(targetPath, JSON.stringify(packageData, null, 2), "utf-8");
