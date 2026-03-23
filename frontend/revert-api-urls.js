const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory && !dirPath.includes('node_modules') && !dirPath.includes('.next')) {
            walkDir(dirPath, callback);
        } else if (!isDirectory && (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts') || dirPath.endsWith('.js'))) {
            callback(dirPath);
        }
    });
}

function revertFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove isL and isLocalNetwork declarations
    content = content.replace(/const\s+(isL|isLocalNetwork)\s*=\s*typeof\s+window\s*!==\s*'undefined'[^;]+;/g, '');

    // Replace the ternary API assignment
    content = content.replace(/const\s+API\s*=\s*(isL|isLocalNetwork)\s*\?[^:]+:\s*\(process\.env\.NEXT_PUBLIC_API_URL\s*\|\|\s*'http:\/\/localhost:4000\/api'\);/g, "const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';");

    // Clean up any double empty lines that might have been created
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Reverted API logic in: ${filePath}`);
    }
}

const frontendSrcDir = path.join(__dirname, 'src');
console.log(`Scanning frontend directory: ${frontendSrcDir}`);
walkDir(frontendSrcDir, revertFile);
console.log('Reversion complete.');
