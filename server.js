const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// MIME types for serving static files
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Handle CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    // ===== Handle API Routes =====
    
    // Download image endpoint
    if (parsedUrl.pathname === '/api/download') {
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
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Invalid weekday' }));
        }

        let imageUrl;
        let filename;
        
        switch (type) {
            case 'wind':
                imageUrl = `https://media.foxweather.com/weather/${day}%20Wind%20Outlook.png`;
                filename = `${dayStr}_Damaging_Wind_Threat_Outlook.png`;
                break;
            case 'northeast':
                imageUrl = `https://media.foxweather.com/weather/${day}%20Northeast%20Severe%20Outlook.png`;
                filename = `${dayStr}_Northeast_Severe_Storm_Threat_Outlook.png`;
                break;
            case 'southeast':
                imageUrl = `https://media.foxweather.com/weather/${day}%20East%20Severe%20Outlook.png`;
                filename = `${dayStr}_Southeast_Severe_Storm_Threat_Outlook.png`;
                break;
            case 'plains':
                imageUrl = `https://media.foxweather.com/weather/${day}%20Plains%20Severe%20Outlook.png`;
                filename = `${dayStr}_Southern_Plains_Severe_Storm_Threat_Outlook.png`;
                break;
            default: // 'storm' - General US
                imageUrl = `https://media.foxweather.com/weather/${day}%20Severe%20Outlook.png`;
                filename = `${dayStr}_General_US_Severe_Storm_Threat_Outlook.png`;
                break;
        }

        console.log(`Fetching image: ${imageUrl}`);

        https.get(imageUrl, (imageRes) => {
            if (imageRes.statusCode !== 200) {
                console.log(`Image not found: ${imageRes.statusCode}`);
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ 
                    error: `Image not found on Fox Weather for ${type} threat` 
                }));
            }

            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="${filename}"`
            });

            imageRes.pipe(res);
        }).on('error', (err) => {
            console.error('Error fetching image:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch image' }));
        });

        return;
    }

    // Check if image exists endpoint
    if (parsedUrl.pathname === '/api/check-image') {
        const dayStr = parsedUrl.query.day || '';
        const type = parsedUrl.query.type || 'storm';
        let day = '';
        
        if (dayStr) {
            const date = new Date(dayStr);
            if (!isNaN(date)) {
                const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                day = days[date.getUTCDay()];
            }
        }

        let imageUrl;
        switch (type) {
            case 'wind':
                imageUrl = `https://media.foxweather.com/weather/${day}%20Wind%20Outlook.png`;
                break;
            case 'northeast':
                imageUrl = `https://media.foxweather.com/weather/${day}%20Northeast%20Severe%20Outlook.png`;
                break;
            case 'southeast':
                imageUrl = `https://media.foxweather.com/weather/${day}%20East%20Severe%20Outlook.png`;
                break;
            case 'plains':
                imageUrl = `https://media.foxweather.com/weather/${day}%20Plains%20Severe%20Outlook.png`;
                break;
            default: // 'storm' - General US
                imageUrl = `https://media.foxweather.com/weather/${day}%20Severe%20Outlook.png`;
                break;
        }

        https.get(imageUrl, (imageRes) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                exists: imageRes.statusCode === 200,
                url: imageUrl 
            }));
            imageRes.destroy();
        }).on('error', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ exists: false, url: imageUrl }));
        });

        return;
    }

    // ===== Serve Static Files =====
    let filePath = req.url === '/' ? '/public/index.html' : `/public${req.url}`;
    filePath = path.join(__dirname, filePath);

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 Not Found</title>
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            text-align: center; 
                            padding: 60px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            min-height: 100vh;
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-direction: column;
                        }
                        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
                        p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
                        a { 
                            color: white; 
                            text-decoration: none; 
                            background: rgba(255,255,255,0.2);
                            padding: 12px 24px;
                            border-radius: 8px;
                            backdrop-filter: blur(10px);
                            transition: all 0.3s ease;
                        }
                        a:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
                    </style>
                </head>
                <body>
                    <h1>404 - Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
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
    console.log(`🌐 Weather Outlook Downloader running at: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
});