// copyPackage.js

const fs = require('fs');
const path = require('path');
const sourcePath = path.resolve(__dirname, 'package.json');
const targetPath = path.resolve(__dirname, 'dist', 'package.json');
const packageData = require(sourcePath);
delete packageData.scripts;
delete packageData.devDependencies;
packageData.types = 'index.d.ts';
packageData.typings = 'index.d.ts';
packageData.main = 'index.js';
packageData.module = 'index.js';
packageData.exports = {
    ".": {
        "import": "./index.js",
        "require": "./indexs.js",
        "types": "./index.d.ts"
    },
}
fs.writeFileSync(targetPath, JSON.stringify(packageData, null, 2), 'utf-8');
