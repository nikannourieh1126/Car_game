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

server.listen(8086, async () => {
    console.log('Server running on http://localhost:8086');
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

        await page.goto('http://localhost:8086');
        await page.waitForTimeout(2000);

        const testResults = await page.evaluate(() => {
            const trans = window.gameInstance.transmission;
            const car = window.gameInstance.car;

            const initialMode = trans.mode; // 'AUTO'

            car.throttleInput = 1.0;
            const dt = 0.016;
            for (let i = 0; i < 60; i++) {
                const driveForce = trans.update(dt);
                car.update(dt, driveForce);
            }
            const speedAuto = car.getSpeedKmH();
            const rpmAuto = trans.rpm;

            trans.toggleMode();
            const manualMode = trans.mode; // 'MANUAL'

            trans.shiftUp();
            const gearManual = trans.getGearName(); // 'M2' or 'M3'

            return {
                initialMode,
                speedAuto,
                rpmAuto,
                manualMode,
                gearManual
            };
        });

        console.log('Transmission System Test Results:', testResults);

        if (testResults.initialMode === 'AUTO' && testResults.manualMode === 'MANUAL' && testResults.speedAuto > 5 && testResults.rpmAuto > 1000) {
            console.log('Step 2 Verification SUCCESSFUL!');
        } else {
            console.error('Step 2 Verification FAILED!');
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
