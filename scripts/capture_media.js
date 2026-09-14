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

    const frameDir = path.join(__dirname, '..', 'frames');
    if (!fs.existsSync(frameDir)) {
        fs.mkdirSync(frameDir, { recursive: true });
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
        await page.waitForTimeout(2500);

        console.log('Capturing Screenshot 1: Chase Camera View');
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot1_chase_cam.png') });

        // Drive car forward & switch camera
        console.log('Driving car & capturing Screenshot 2: Cockpit Interior');
        await page.evaluate(() => {
            window.gameInstance.switchCamera(); // Chase 2
            window.gameInstance.switchCamera(); // Cockpit
            window.gameInstance.car.throttleInput = 1.0;
            const dt = 0.016;
            for (let i = 0; i < 40; i++) {
                const driveForce = window.gameInstance.transmission.update(dt);
                window.gameInstance.car.update(dt, driveForce);
                window.gameInstance.traffic.update(dt, window.gameInstance.car.position);
            }
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot2_cockpit_view.png') });

        // Switch to Manual Mode & capture Screenshot 3
        console.log('Capturing Screenshot 3: Manual Transmission System');
        await page.evaluate(() => {
            window.gameInstance.transmission.setMode('MANUAL');
            document.getElementById('manual-controls').classList.remove('hidden');
            document.getElementById('btn-toggle-trans').textContent = 'MANUAL (6-SPD)';
            document.getElementById('btn-toggle-trans').className = 'mode-badge manual';
            window.gameInstance.transmission.rpm = 6800; // High RPM redline
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot3_manual_trans.png') });

        // Capture Screenshot 4: City & Traffic Overview
        console.log('Capturing Screenshot 4: City Sunset & Traffic Overview');
        await page.evaluate(() => {
            window.gameInstance.switchCamera(); // Bonnet
            window.gameInstance.switchCamera(); // Chase 1
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot4_sunset_city.png') });

        // Record Gameplay Video Frames (60 frames = 3 seconds at 20fps)
        console.log('Recording frames for gameplay.mp4...');
        for (let frameIdx = 0; frameIdx < 60; frameIdx++) {
            await page.evaluate((idx) => {
                const dt = 0.016;
                window.gameInstance.car.steerInput = Math.sin(idx * 0.1) * 0.4;
                window.gameInstance.car.throttleInput = 1.0;
                const driveForce = window.gameInstance.transmission.update(dt);
                window.gameInstance.car.update(dt, driveForce);
                window.gameInstance.traffic.update(dt, window.gameInstance.car.position);
            }, frameIdx);
            const frameNum = String(frameIdx).padStart(3, '0');
            await page.screenshot({ path: path.join(frameDir, `frame_${frameNum}.png`) });
        }

        console.log('Encoding MP4 video with ffmpeg...');
        const mp4Path = path.join(__dirname, '..', 'gameplay.mp4');
        execSync(`ffmpeg -y -framerate 20 -i "${frameDir}/frame_%03d.png" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`);

        console.log('Media generation completed successfully!');
    } catch (e) {
        console.error('Error generating media:', e);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.close();
        if (fs.existsSync(frameDir)) {
            fs.rmSync(frameDir, { recursive: true, force: true });
        }
        process.exit(0);
    }
});
