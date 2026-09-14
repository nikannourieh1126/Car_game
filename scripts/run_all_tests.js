const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== RUNNING FULL AUTOMATED SYSTEM SUITE ===');

try {
    console.log('\n--- Test 1: 3D WebGL Core Engine ---');
    execSync('node scripts/verify_step1.js', { stdio: 'inherit' });

    console.log('\n--- Test 2: Dual Transmission & HUD Mechanics ---');
    execSync('node scripts/verify_step2.js', { stdio: 'inherit' });

    console.log('\n--- Test 3: AI Traffic System & Gamepad API ---');
    execSync('node scripts/verify_step3.js', { stdio: 'inherit' });

    console.log('\n--- Test 4: Android APK Artifact Integrity ---');
    const apkPath = path.join(__dirname, '..', 'CityCarDriving3D.apk');
    if (fs.existsSync(apkPath) && fs.statSync(apkPath).size > 20000) {
        console.log(`APK Verified: ${apkPath} (${fs.statSync(apkPath).size} bytes)`);
    } else {
        throw new Error('APK artifact missing or invalid!');
    }

    console.log('\n--- Test 5: Media Artifacts Verification ---');
    const mp4Path = path.join(__dirname, '..', 'gameplay.mp4');
    const screenshot1 = path.join(__dirname, '..', 'screenshots', 'screenshot1_chase_cam.png');
    if (fs.existsSync(mp4Path) && fs.existsSync(screenshot1)) {
        console.log('Media Artifacts (gameplay.mp4 & screenshots) verified successfully!');
    } else {
        throw new Error('Media artifacts missing!');
    }

    console.log('\nALL SYSTEM TESTS PASSED SUCCESSFULLY! 🚀');
} catch (err) {
    console.error('\nTEST SUITE FAILED:', err.message);
    process.exit(1);
}
