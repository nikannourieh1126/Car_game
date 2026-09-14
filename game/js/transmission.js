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

        // Clutch state
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
            this.rpm = Math.max(this.idleRpm, this.rpm * 0.65);
        }
    }

    shiftDown() {
        if (this.currentGear > -1) {
            this.currentGear--;
            this.rpm = Math.min(this.maxRpm, this.rpm * 1.35);
        }
    }

    update(dt) {
        const speedMps = Math.abs(this.car.speed);
        const speedKmh = this.car.getSpeedKmH();

        const activeRatio = (this.currentGear === -1) ? this.reverseRatio : (this.gearRatios[Math.max(0, this.currentGear)] || 1.0);

        const tireRadius = 0.40; // meters
        const wheelRpm = (speedMps / (2 * Math.PI * tireRadius)) * 60;
        const calculatedRpm = wheelRpm * activeRatio * this.finalDrive;

        if (this.mode === 'AUTO') {
            if (this.car.brakeInput > 0 && speedKmh < 2 && this.car.throttleInput === 0) {
                if (this.car.brakeInput > 0.5 && speedKmh < 0.5) {
                    this.currentGear = -1;
                }
            } else if (this.car.throttleInput > 0 && this.currentGear === -1 && speedKmh < 1) {
                this.currentGear = 1;
            }

            if (this.currentGear >= 1 && this.currentGear < 6 && this.rpm > this.shiftUpRpm) {
                this.shiftUp();
            } else if (this.currentGear > 1 && this.rpm < this.shiftDownRpm && speedKmh > 5) {
                this.shiftDown();
            }
        }

        if (this.currentGear === 0) {
            if (this.car.throttleInput > 0) {
                this.rpm += this.car.throttleInput * 12000 * dt;
            } else {
                this.rpm -= 4000 * dt;
            }
        } else {
            const targetRpm = Math.max(this.idleRpm, calculatedRpm);
            if (this.car.throttleInput > 0) {
                this.rpm += (targetRpm + this.car.throttleInput * 2500 - this.rpm) * Math.min(1.0, dt * 10.0);
            } else {
                this.rpm += (targetRpm - this.rpm) * Math.min(1.0, dt * 6.0);
            }
        }

        this.rpm = THREE.MathUtils.clamp(this.rpm, this.idleRpm, this.maxRpm);

        let driveForce = 0;
        if (this.currentGear !== 0) {
            const gearFactor = activeRatio * this.finalDrive * 0.35;
            const rpmNormalized = this.rpm / this.maxRpm;
            const torqueMultiplier = Math.sin(rpmNormalized * Math.PI);

            if (this.currentGear === -1) {
                driveForce = - (this.car.throttleInput || (this.mode === 'AUTO' ? this.car.brakeInput : 0)) * this.car.enginePower * gearFactor * 18.0;
            } else {
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
