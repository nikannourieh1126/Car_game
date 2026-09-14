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

server.listen(8087, async () => {
    console.log('Server running on http://localhost:8087');
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

        await page.goto('http://localhost:8087');
        await page.waitForTimeout(2000);

        const testResults = await page.evaluate(() => {
            const traffic = window.gameInstance.traffic;
            const gamepadMgr = window.gameInstance.gamepadManager;

            const vehicleCount = traffic.vehicles.length;
            const firstCarPos1 = traffic.vehicles[0].mesh.position.x;

            // Step traffic physics
            traffic.update(0.1, window.gameInstance.car.position);
            const firstCarPos2 = traffic.vehicles[0].mesh.position.x;

            // Test Gamepad poll
            const gpInputs = gamepadMgr.pollInputs();

            return {
                vehicleCount,
                moved: firstCarPos1 !== firstCarPos2,
                hasGamepadMgr: !!gamepadMgr
            };
        });

        console.log('Traffic AI & Gamepad Test Results:', testResults);

        if (testResults.vehicleCount >= 20 && testResults.hasGamepadMgr) {
            console.log('Step 3 Verification SUCCESSFUL!');
        } else {
            console.error('Step 3 Verification FAILED!');
            process.exit(1);
        }
    } catch (e) {
        console.error('Verification error:', e);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.close();
        process.exit(0);
    }
});
