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

    const videoDir = path.join(__dirname, '..', 'video_tmp');
    if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
    }

    let browser;
    try {
        browser = await chromium.launch({
            executablePath: '/usr/bin/google-chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-gpu-sandbox', '--enable-unsafe-swiftshader']
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } }
        });
        const page = await context.newPage();

        await page.goto('http://localhost:8088');
        await page.waitForTimeout(1500);

        console.log('Capturing Screenshot 1: High-Graphics Supercar Exterior Chase');
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot1_chase_cam.png') });

        console.log('Driving & capturing Screenshot 2: Cockpit Interior');
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
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot2_cockpit_view.png') });

        console.log('Capturing Screenshot 3: Manual Transmission & Tachometer Redline');
        await page.evaluate(() => {
            window.gameInstance.transmission.setMode('MANUAL');
            document.getElementById('manual-controls').classList.remove('hidden');
            document.getElementById('btn-toggle-trans').textContent = 'MANUAL (6-SPD)';
            document.getElementById('btn-toggle-trans').className = 'mode-badge manual';
            window.gameInstance.transmission.rpm = 6900;
        });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot3_manual_trans.png') });

        console.log('Capturing Screenshot 4: City Horizon Sunset & Traffic AI');
        await page.evaluate(() => {
            window.gameInstance.switchCamera(); // Bonnet
            window.gameInstance.switchCamera(); // Chase 1
        });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot4_sunset_city.png') });

        // Simulate dynamic driving action for video recording
        await page.evaluate(async () => {
            for (let i = 0; i < 120; i++) {
                const dt = 0.016;
                window.gameInstance.car.steerInput = Math.sin(i * 0.1) * 0.45;
                window.gameInstance.car.throttleInput = 1.0;
                const driveForce = window.gameInstance.transmission.update(dt);
                window.gameInstance.car.update(dt, driveForce);
                window.gameInstance.traffic.update(dt, window.gameInstance.car.position);
                await new Promise(r => setTimeout(r, 20));
            }
        });

        await context.close(); // Save recorded video

        // Convert webm to mp4
        const videoFiles = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
        if (videoFiles.length > 0) {
            const rawWebm = path.join(videoDir, videoFiles[0]);
            const mp4Path = path.join(__dirname, '..', 'gameplay.mp4');
            console.log('Converting webm to gameplay.mp4 with ffmpeg...');
            execSync(`ffmpeg -y -i "${rawWebm}" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`);
        }

        console.log('Media generation completed successfully!');
    } catch (e) {
        console.error('Error generating media:', e);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.close();
        if (fs.existsSync(videoDir)) {
            fs.rmSync(videoDir, { recursive: true, force: true });
        }
        process.exit(0);
    }
});
