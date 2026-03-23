const fs = require('fs');
const { execSync } = require('child_process');

const targets = execSync('dir /s /b *.tsx').toString().split('\r\n').filter(f=>f);

let count=0;
for(const f of targets){
    let c = fs.readFileSync(f,'utf-8');
    if(c.includes("const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';")) {
        c = c.replace(
            "const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';",
            "const isL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';\nconst API = isL ? `http://${window.location.hostname}:4000/api` : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');"
        );
        fs.writeFileSync(f,c);
        count++;
    }
}
console.log('Replaced in ' + count + ' files.');
