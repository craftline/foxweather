const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // ===== Handle /download?day=FRI&type=storm =====
    if (parsedUrl.pathname === '/download') {
        const dayStr = parsedUrl.query.day || '';
        let day = '';
        if (dayStr) {
            const date = new Date(dayStr);
            if (!isNaN(date)) {
                const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                day = days[date.getUTCDay()];
            }
        }
        const type = parsedUrl.query.type || 'storm';
        const validDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        if (!validDays.includes(day)) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end('Invalid weekday.');
        }

        let imageUrl;
        let filename;
        
        if (type === 'wind') {
            imageUrl = `https://media.foxweather.com/weather/${day}%20Wind%20Outlook.png`;
            filename = `${dayStr}_Damaging_Wind_Threat_Outlook.png`;
        } else {
            // Default to storm
            imageUrl = `https://media.foxweather.com/weather/${day}%20Severe%20Outlook.png`;
            filename = `${dayStr}_Severe_Storm_Threat_Outlook.png`;
        }

        https.get(imageUrl, (imageRes) => {
            if (imageRes.statusCode !== 200) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return res.end(`Image not found on Fox Weather for ${type} threat.`);
            }

            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="${filename}"`
            });

            imageRes.pipe(res);
        }).on('error', (err) => {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Failed to fetch image.');
        });

        return;
    }

    // ===== Serve Static Files =====
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>404 Not Found</title></head>
                <body style="text-align:center;padding:40px;font-family:sans-serif;">
                    <h1>404 - File Not Found</h1>
                    <p>The page you're looking for does not exist.</p>
                    <a href="/">← Back to Home</a>
                </body>
                </html>
            `);
            return;
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Internal Server Error');
            }

            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        });
    });
});

server.listen(PORT, () => {
    console.log(`🌐 Server is running: http://localhost:${PORT}`);
});