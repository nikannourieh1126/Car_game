const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

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

server.listen(8088, async () => {
    console.log('Server running on http://localhost:8088');
    const screenshotsDir = path.join(__dirname, '..', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    let browser;
    try {
        browser = await chromium.launch({
            executablePath: '/usr/bin/google-chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader']
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();

        await page.goto('http://localhost:8088');
        await page.waitForTimeout(2000);

        console.log('Capturing Screenshot 1: NFS ProStreet Race Action Chase Cam');
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot1_chase_cam.png') });

        console.log('Driving & capturing Screenshot 2: Cockpit View & Steering');
        await page.evaluate(() => {
            window.gameInstance.switchCamera(); // Chase 2
            window.gameInstance.switchCamera(); // Cockpit
            window.gameInstance.car.throttleInput = 1.0;
            const dt = 0.016;
            for (let i = 0; i < 30; i++) {
                const driveForce = window.gameInstance.transmission.update(dt);
                window.gameInstance.car.update(dt, driveForce);
                window.gameInstance.traffic.update(dt, window.gameInstance.car.position);
            }
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot2_cockpit_view.png') });

        console.log('Capturing Screenshot 3: Manual Transmission & ProStreet Gauge');
        await page.evaluate(() => {
            window.gameInstance.transmission.setMode('MANUAL');
            document.getElementById('manual-controls').classList.remove('hidden');
            document.getElementById('btn-toggle-trans').textContent = 'MANUAL (6-SPD)';
            document.getElementById('btn-toggle-trans').className = 'mode-badge manual';
            window.gameInstance.transmission.rpm = 6800;
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot3_manual_trans.png') });

        console.log('Capturing Screenshot 4: Billboards, Kerbs & Sky Balloon');
        await page.evaluate(() => {
            window.gameInstance.switchCamera(); // Bonnet
            window.gameInstance.switchCamera(); // Chase 1
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot4_sunset_city.png') });

        console.log('Encoding gameplay.mp4 with ffmpeg...');
        const mp4Path = path.join(__dirname, '..', 'gameplay.mp4');
        execSync(`ffmpeg -y -loop 1 -i "${screenshotsDir}/screenshot1_chase_cam.png" -loop 1 -i "${screenshotsDir}/screenshot2_cockpit_view.png" -loop 1 -i "${screenshotsDir}/screenshot3_manual_trans.png" -loop 1 -i "${screenshotsDir}/screenshot4_sunset_city.png" -filter_complex "[0:v]settb=AVTB,fps=30,scale=1280:720,trim=duration=1.5[v0];[1:v]settb=AVTB,fps=30,scale=1280:720,trim=duration=1.5[v1];[2:v]settb=AVTB,fps=30,scale=1280:720,trim=duration=1.5[v2];[3:v]settb=AVTB,fps=30,scale=1280:720,trim=duration=1.5[v3];[v0][v1][v2][v3]concat=n=4:v=1:a=0[v]" -map "[v]" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`);

        console.log('Media capture completed successfully!');
    } catch (e) {
        console.error('Error generating media:', e);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.close();
        process.exit(0);
    }
});
