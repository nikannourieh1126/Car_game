/* HUD & UI Controller Module */
class HUD {
    constructor(game) {
        this.game = game;

        // HUD Elements
        this.btnToggleTrans = document.getElementById('btn-toggle-trans');
        this.btnCameraSwitch = document.getElementById('btn-camera-switch');
        this.btnShiftUp = document.getElementById('btn-shift-up');
        this.btnShiftDown = document.getElementById('btn-shift-down');
        this.manualControls = document.getElementById('manual-controls');

        this.rpmValueEl = document.getElementById('rpm-value');
        this.rpmArcEl = document.getElementById('rpm-arc');
        this.speedValueEl = document.getElementById('speed-value');
        this.speedArcEl = document.getElementById('speed-arc');
        this.gearDisplayEl = document.getElementById('gear-display');
        this.trafficCountEl = document.getElementById('traffic-count');

        // Minimap Canvas
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

        // Touch Steering & Pedals State
        this.touchAccel = false;
        this.touchBrake = false;
        this.touchSteer = 0;

        this.initEventListeners();
    }

    initEventListeners() {
        // Transmission Toggle
        if (this.btnToggleTrans) {
            this.btnToggleTrans.addEventListener('click', () => {
                const mode = this.game.transmission.toggleMode();
                if (mode === 'MANUAL') {
                    this.btnToggleTrans.textContent = 'MANUAL (6-SPD)';
                    this.btnToggleTrans.classList.remove('auto');
                    this.btnToggleTrans.classList.add('manual');
                    this.manualControls.classList.remove('hidden');
                } else {
                    this.btnToggleTrans.textContent = 'AUTO (PRND)';
                    this.btnToggleTrans.classList.remove('manual');
                    this.btnToggleTrans.classList.add('auto');
                    this.manualControls.classList.add('hidden');
                }
            });
        }

        // Camera Switch
        if (this.btnCameraSwitch) {
            this.btnCameraSwitch.addEventListener('click', () => {
                this.game.switchCamera();
            });
        }

        // Gear Shift Up / Down
        if (this.btnShiftUp) {
            this.btnShiftUp.addEventListener('click', () => {
                this.game.transmission.shiftUp();
            });
        }
        if (this.btnShiftDown) {
            this.btnShiftDown.addEventListener('click', () => {
                this.game.transmission.shiftDown();
            });
        }

        // Touch Controls setup for mobile touchscreen
        this.initTouchControls();
    }

    initTouchControls() {
        const pedalAccel = document.getElementById('pedal-accel');
        const pedalBrake = document.getElementById('pedal-brake');
        const wheelContainer = document.getElementById('touch-steering-container');

        if (pedalAccel) {
            pedalAccel.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchAccel = true; });
            pedalAccel.addEventListener('touchend', (e) => { e.preventDefault(); this.touchAccel = false; });
            pedalAccel.addEventListener('mousedown', () => { this.touchAccel = true; });
            pedalAccel.addEventListener('mouseup', () => { this.touchAccel = false; });
        }

        if (pedalBrake) {
            pedalBrake.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchBrake = true; });
            pedalBrake.addEventListener('touchend', (e) => { e.preventDefault(); this.touchBrake = false; });
            pedalBrake.addEventListener('mousedown', () => { this.touchBrake = true; });
            pedalBrake.addEventListener('mouseup', () => { this.touchBrake = false; });
        }

        if (wheelContainer) {
            let dragging = false;
            let startX = 0;

            const handleMove = (clientX) => {
                const rect = wheelContainer.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const deltaX = clientX - centerX;
                this.touchSteer = THREE.MathUtils.clamp(deltaX / (rect.width / 2), -1.0, 1.0);

                const wheelVisual = document.getElementById('touch-wheel');
                if (wheelVisual) {
                    wheelVisual.style.transform = `rotate(${this.touchSteer * 90}deg)`;
                }
            };

            wheelContainer.addEventListener('touchstart', (e) => {
                dragging = true;
                handleMove(e.touches[0].clientX);
            });
            window.addEventListener('touchmove', (e) => {
                if (dragging && e.touches.length > 0) handleMove(e.touches[0].clientX);
            });
            window.addEventListener('touchend', () => {
                dragging = false;
                this.touchSteer = 0;
                const wheelVisual = document.getElementById('touch-wheel');
                if (wheelVisual) wheelVisual.style.transform = 'rotate(0deg)';
            });

            // Mouse fallback for browser testing
            wheelContainer.addEventListener('mousedown', (e) => { dragging = true; handleMove(e.clientX); });
            window.addEventListener('mousemove', (e) => { if (dragging) handleMove(e.clientX); });
            window.addEventListener('mouseup', () => {
                if (dragging) {
                    dragging = false;
                    this.touchSteer = 0;
                    const wheelVisual = document.getElementById('touch-wheel');
                    if (wheelVisual) wheelVisual.style.transform = 'rotate(0deg)';
                }
            });
        }
    }

    update(car, transmission, traffic) {
        const speedKmh = car.getSpeedKmH();
        const rpm = Math.round(transmission.rpm);
        const gearName = transmission.getGearName();

        // Speedometer & Tachometer Digital Text
        if (this.speedValueEl) this.speedValueEl.textContent = speedKmh;
        if (this.rpmValueEl) this.rpmValueEl.textContent = rpm;
        if (this.gearDisplayEl) this.gearDisplayEl.textContent = gearName;
        if (this.trafficCountEl && traffic) this.trafficCountEl.textContent = traffic.vehicles.length;

        // Circular Gauge Arc calculations (Max arc perimeter = 264)
        if (this.rpmArcEl) {
            const rpmPercent = Math.min(1.0, rpm / transmission.maxRpm);
            const dashOffset = 264 * (1 - rpmPercent * 0.75); // 270 deg gauge arc
            this.rpmArcEl.style.strokeDashoffset = dashOffset;

            // Redline warning color change
            if (rpm > 6500) {
                this.rpmArcEl.style.stroke = '#ff0055';
            } else {
                this.rpmArcEl.style.stroke = '#ff9800';
            }
        }

        if (this.speedArcEl) {
            const speedPercent = Math.min(1.0, speedKmh / 260); // 0 to 260 km/h scale
            const dashOffset = 264 * (1 - speedPercent * 0.75);
            this.speedArcEl.style.strokeDashoffset = dashOffset;
        }

        // Draw Mini-Map Radar
        this.renderMinimap(car, traffic);
    }

    renderMinimap(car, traffic) {
        if (!this.minimapCtx) return;

        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;
        const scale = 0.6; // Radar zoom factor

        ctx.clearRect(0, 0, w, h);

        // Dark Radar background grid
        ctx.fillStyle = 'rgba(10, 18, 32, 0.9)';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 25, 0, Math.PI * 2);
        ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2);
        ctx.stroke();

        // Draw AI Traffic vehicles on Radar
        if (traffic && traffic.vehicles) {
            ctx.fillStyle = '#ff9800'; // Orange dots for AI traffic
            traffic.vehicles.forEach(npc => {
                const relX = (npc.mesh.position.x - car.position.x) * scale;
                const relZ = (npc.mesh.position.z - car.position.z) * scale;

                const mapX = w / 2 + relX;
                const mapY = h / 2 + relZ;

                if (mapX >= 5 && mapX <= w - 5 && mapY >= 5 && mapY <= h - 5) {
                    ctx.beginPath();
                    ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        // Draw Player Car Icon (Cyan Arrow) in Center
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-car.rotation);

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 5);
        ctx.lineTo(0, 3);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
