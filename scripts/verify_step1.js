const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', 'game', req.url === '/' ? 'index.html' : req.url);
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
    }
    const ext = path.extname(filePath);
    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png'
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
});

server.listen(8085, async () => {
    console.log('Server running on http://localhost:8085');
    let browser;
    try {
        browser = await chromium.launch({
            executablePath: '/usr/bin/google-chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader']
        });
        const page = await browser.newPage();

        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

        await page.goto('http://localhost:8085');
        await page.waitForTimeout(2500);

        const isGameLoaded = await page.evaluate(() => {
            return !!(window.gameInstance && window.gameInstance.scene && window.gameInstance.car);
        });

        console.log('Is 3D Game Engine Loaded & Rendered:', isGameLoaded);

        if (!isGameLoaded) {
            console.error('Game failed to initialize correctly!');
            process.exit(1);
        } else {
            console.log('Step 1 Verification SUCCESSFUL!');
        }
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.close();
        process.exit(0);
    }
});
