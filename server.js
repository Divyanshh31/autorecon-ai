const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname);
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';
    
    let filePath = path.join(rootDir, reqUrl);
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            filePath = path.join(rootDir, 'index.html');
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end('Server Error');
            } else {
                res.writeHead(200, { 
                    'Content-Type': contentType, 
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(content, 'utf-8');
            }
        });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`AutoRecon AI local server running on http://localhost:${PORT}`);
});
