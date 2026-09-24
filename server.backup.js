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
    '.json': 'application/json; charset=utf-8'
};

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

const server = http.createServer(async (req, res) => {
    try {
        const reqUrl = req.url.split('?')[0];

        // Send /api/* requests to the existing API handler
        if (reqUrl.startsWith('/api/')) {
            const body = await readRequestBody(req);

            let parsedBody = {};
            if (body) {
                try {
                    parsedBody = JSON.parse(body);
                } catch {
                    parsedBody = {};
                }
            }

            const result = await apiHandler({
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: parsedBody,
                query: Object.fromEntries(
                    new URL(req.url, 'http://localhost:3000').searchParams
                )
            });

            res.writeHead(result.statusCode || 200, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            });

            res.end(result.body);
            return;
        }

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            });
            res.end();
            return;
        }

        // Serve static files
        let fileUrl = reqUrl;

        if (fileUrl === '/') {
            fileUrl = '/index.html';
        }

        let filePath = path.join(rootDir, fileUrl);

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                filePath = path.join(rootDir, 'index.html');
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            fs.readFile(filePath, (error, content) => {
                if (error) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });
                    res.end('Server Error');
                    return;
                }

                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                    'Access-Control-Allow-Origin': '*'
                });

                res.end(content);
            });
        });

    } catch (error) {
        console.error('Local server error:', error);

        res.writeHead(500, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        res.end(JSON.stringify({
            error: 'Local server error',
            message: error.message
        }));
    }
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`AutoRecon AI local server running on http://localhost:${PORT}`);
});