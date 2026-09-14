/* Transmission & Gearbox Engine Module */
class Transmission {
    constructor(car) {
        this.car = car;
        this.mode = 'AUTO'; // 'AUTO' or 'MANUAL'

        // Gears: -1: Reverse, 0: Neutral, 1-6: Forward Gears
        this.currentGear = 1;

        // Engine RPM parameters
        this.rpm = 800;
        this.idleRpm = 800;
        this.maxRpm = 7500;
        this.shiftUpRpm = 6200;
        this.shiftDownRpm = 2200;

        // Gear Ratios for 6-Speed Sports Transmission
        this.gearRatios = [0, 3.82, 2.36, 1.68, 1.31, 1.00, 0.79]; // Gear 0..6
        this.reverseRatio = 3.65;
        this.finalDrive = 3.55;

        // Clutch state (0 = fully disengaged, 1 = fully engaged)
        this.clutch = 1.0;
        this.isStalled = false;
    }

    setMode(newMode) {
        this.mode = newMode;
        if (this.mode === 'AUTO') {
            this.currentGear = 1;
        }
    }

    toggleMode() {
        this.setMode(this.mode === 'AUTO' ? 'MANUAL' : 'AUTO');
        return this.mode;
    }

    shiftUp() {
        if (this.currentGear < 6) {
            this.currentGear++;
            // Temporary drop in RPM when shifting up
            this.rpm = Math.max(this.idleRpm, this.rpm * 0.65);
        }
    }

    shiftDown() {
        if (this.currentGear > -1) {
            this.currentGear--;
            // Blip RPM up when shifting down (rev matching)
            this.rpm = Math.min(this.maxRpm, this.rpm * 1.35);
        }
    }

    update(dt) {
        const speedMps = Math.abs(this.car.speed);
        const speedKmh = this.car.getSpeedKmH();

        // Calculate Engine RPM based on current gear and wheel speed
        const activeRatio = (this.currentGear === -1) ? this.reverseRatio : (this.gearRatios[Math.max(0, this.currentGear)] || 1.0);

        // Wheel RPM to Engine RPM formula: RPM = (speed_m_s / tire_perimeter) * 60 * gear_ratio * final_drive
        const tireRadius = 0.38; // meters
        const wheelRpm = (speedMps / (2 * Math.PI * tireRadius)) * 60;
        const calculatedRpm = wheelRpm * activeRatio * this.finalDrive;

        // Automatic Transmission Shift Logic
        if (this.mode === 'AUTO') {
            if (this.car.brakeInput > 0 && speedKmh < 2 && this.car.throttleInput === 0) {
                // Stopped / Reverse logic in Auto
                if (this.car.brakeInput > 0.5 && speedKmh < 0.5) {
                    this.currentGear = -1; // Reverse gear when holding brake at standstill
                }
            } else if (this.car.throttleInput > 0 && this.currentGear === -1 && speedKmh < 1) {
                this.currentGear = 1; // Auto switch back to forward Drive gear
            }

            // Auto gear shifting up/down based on RPM
            if (this.currentGear >= 1 && this.currentGear < 6 && this.rpm > this.shiftUpRpm) {
                this.shiftUp();
            } else if (this.currentGear > 1 && this.rpm < this.shiftDownRpm && speedKmh > 5) {
                this.shiftDown();
            }
        }

        // Engine RPM calculation
        if (this.currentGear === 0) {
            // Neutral gear: Rev engine freely with throttle
            if (this.car.throttleInput > 0) {
                this.rpm += this.car.throttleInput * 12000 * dt;
            } else {
                this.rpm -= 4000 * dt;
            }
        } else {
            // In gear: blend calculated RPM with throttle input
            const targetRpm = Math.max(this.idleRpm, calculatedRpm);
            if (this.car.throttleInput > 0) {
                this.rpm += (targetRpm + this.car.throttleInput * 2500 - this.rpm) * Math.min(1.0, dt * 10.0);
            } else {
                this.rpm += (targetRpm - this.rpm) * Math.min(1.0, dt * 6.0);
            }
        }

        // Clamp RPM
        this.rpm = THREE.MathUtils.clamp(this.rpm, this.idleRpm, this.maxRpm);

        // Drive Force output to drive wheels
        let driveForce = 0;
        if (this.currentGear !== 0) {
            const gearFactor = activeRatio * this.finalDrive * 0.35;
            // Torque curve simulation: Peak torque around 4500 RPM
            const rpmNormalized = this.rpm / this.maxRpm;
            const torqueMultiplier = Math.sin(rpmNormalized * Math.PI); // Smooth torque arc

            if (this.currentGear === -1) {
                // Reverse direction
                driveForce = - (this.car.throttleInput || (this.mode === 'AUTO' ? this.car.brakeInput : 0)) * this.car.enginePower * gearFactor * 18.0;
            } else {
                // Forward direction
                driveForce = this.car.throttleInput * this.car.enginePower * gearFactor * torqueMultiplier * 20.0;
            }
        }

        return driveForce;
    }

    getGearName() {
        if (this.mode === 'AUTO') {
            if (this.currentGear === -1) return 'R';
            if (this.currentGear === 0) return 'N';
            if (this.car.speed === 0 && this.car.throttleInput === 0) return 'P';
            return `D${this.currentGear}`;
        } else {
            if (this.currentGear === -1) return 'R';
            if (this.currentGear === 0) return 'N';
            return `M${this.currentGear}`;
        }
    }
}
