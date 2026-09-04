const http = require('http');
const fs = require('fs');
const path = require('path');

const apiHandler = require('./api/index.js');

const rootDir = __dirname;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.json': 'application/json; charset=utf-8',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    try {
        // ==============================
        // API REQUESTS
        // ==============================
        if (req.url.startsWith('/api/')) {
            return await apiHandler(req, res);
        }

        // ==============================
        // STATIC WEBSITE FILES
        // ==============================
        let reqUrl = req.url.split('?')[0];

        if (reqUrl === '/') {
            reqUrl = '/index.html';
        }

        // Prevent path traversal
        const requestedPath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
        let filePath = path.join(rootDir, requestedPath);

        // If file doesn't exist, use index.html
        try {
            const stats = fs.statSync(filePath);

            if (!stats.isFile()) {
                filePath = path.join(rootDir, 'index.html');
            }
        } catch {
            filePath = path.join(rootDir, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                console.error('Static file error:', error);

                res.writeHead(500, {
                    'Content-Type': 'text/plain; charset=utf-8'
                });

                return res.end('Server Error');
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
                'Access-Control-Allow-Origin': '*'
            });

            res.end(content);
        });

    } catch (error) {
        console.error('Server Error:', error);

        if (!res.headersSent) {
            res.writeHead(500, {
                'Content-Type': 'application/json; charset=utf-8'
            });
        }

        res.end(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }));
    }
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log('');
    console.log('==========================================');
    console.log(' AutoRecon AI Local Server');
    console.log('==========================================');
    console.log(` Website: http://localhost:${PORT}`);
    console.log(` API:     http://localhost:${PORT}/api/`);
    console.log('==========================================');
    console.log('');
});