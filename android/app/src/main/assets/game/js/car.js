/* Ultra-High-Fidelity 3D Supercar & Dynamics Engine */
class Car {
    constructor(scene, envMap) {
        this.scene = scene;
        this.envMap = envMap;

        // Kinematics and Physics
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0; // m/s
        this.acceleration = 0;
        this.steeringAngle = 0;
        this.maxSteeringAngle = 0.58;
        this.rotation = 0;

        // Specs
        this.wheelbase = 2.75;
        this.mass = 1420;
        this.enginePower = 480; // Supercar power
        this.brakeForce = 550;
        this.dragCoefficient = 0.29;
        this.rollingFriction = 10.0;

        // Visuals & Effects
        this.wheels = [];
        this.calipers = [];
        this.headlights = [];
        this.spotlights = [];
        this.brakeLightMesh = null;
        this.brakeLightMat = null;
        this.steeringWheel = null;
        this.exhaustParticles = [];
        this.skidMarks = [];

        // Input state
        this.throttleInput = 0;
        this.brakeInput = 0;
        this.steerInput = 0;

        this.buildSupercarMesh();
    }

    buildSupercarMesh() {
        this.mesh = new THREE.Group();

        // Ultra-High Quality Paint Shader
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xee1122, // Italian Crimson Red Metallic
            metalness: 0.90,
            roughness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            envMap: this.envMap,
            envMapIntensity: 1.5,
            reflectivity: 0.95
        });

        // Carbon Fiber Material
        const carbonMat = new THREE.MeshStandardMaterial({
            color: 0x111115,
            metalness: 0.8,
            roughness: 0.25,
            envMap: this.envMap
        });

        // Glass Material with Reflections
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x050a15,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.85,
            transparent: true,
            opacity: 0.85,
            envMap: this.envMap,
            envMapIntensity: 2.0
        });

        // Gold/Alloy Rim Material
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xddc088, // Satin Gold Alloy
            metalness: 0.95,
            roughness: 0.2,
            envMap: this.envMap
        });

        // Brembo Red Caliper Material
        const caliperMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.5,
            roughness: 0.3
        });

        // Brake Rotor Disc Material
        const discMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.3
        });

        // 1. Aerodynamic Sleek Lower Chassis Body
        const chassisGeo = new THREE.BoxGeometry(2.1, 0.55, 4.6);
        const chassis = new THREE.Mesh(chassisGeo, bodyMaterial);
        chassis.position.y = 0.48;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        this.mesh.add(chassis);

        // Front Hood Nose Slope
        const noseGeo = new THREE.BoxGeometry(2.0, 0.3, 1.2);
        const nose = new THREE.Mesh(noseGeo, bodyMaterial);
        nose.position.set(0, 0.42, 2.1);
        nose.rotation.x = -0.15;
        nose.castShadow = true;
        this.mesh.add(nose);

        // 2. Cockpit Canopy & Roof
        const cabinGeo = new THREE.BoxGeometry(1.5, 0.52, 2.3);
        const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
        cabin.position.set(0, 0.95, -0.15);
        cabin.castShadow = true;
        this.mesh.add(cabin);

        // Slanted Windshield
        const windshieldGeo = new THREE.PlaneGeometry(1.42, 0.85);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.rotation.x = Math.PI / 3.2;
        windshield.position.set(0, 0.92, 0.85);
        this.mesh.add(windshield);

        // Side Glass Windows
        const sideWinGeo = new THREE.PlaneGeometry(1.9, 0.48);
        const leftWin = new THREE.Mesh(sideWinGeo, glassMat);
        leftWin.rotation.y = Math.PI / 2;
        leftWin.position.set(-0.76, 0.96, -0.15);
        this.mesh.add(leftWin);

        const rightWin = leftWin.clone();
        rightWin.rotation.y = -Math.PI / 2;
        rightWin.position.set(0.76, 0.96, -0.15);
        this.mesh.add(rightWin);

        // 3. Carbon Fiber Front Splitter & Side Skirts
        const splitterGeo = new THREE.BoxGeometry(2.15, 0.08, 0.5);
        const splitter = new THREE.Mesh(splitterGeo, carbonMat);
        splitter.position.set(0, 0.18, 2.35);
        this.mesh.add(splitter);

        const skirtGeo = new THREE.BoxGeometry(0.12, 0.12, 3.2);
        const leftSkirt = new THREE.Mesh(skirtGeo, carbonMat);
        leftSkirt.position.set(-1.08, 0.22, 0);
        this.mesh.add(leftSkirt);

        const rightSkirt = leftSkirt.clone();
        rightSkirt.position.set(1.08, 0.22, 0);
        this.mesh.add(rightSkirt);

        // 4. Rear Carbon Fiber GT Wing & Quad Exhaust Pipes
        const wingMainGeo = new THREE.BoxGeometry(2.0, 0.06, 0.45);
        const wingMain = new THREE.Mesh(wingMainGeo, carbonMat);
        wingMain.position.set(0, 1.22, -2.15);
        this.mesh.add(wingMain);

        const pillarGeo = new THREE.BoxGeometry(0.08, 0.3, 0.2);
        const leftPillar = new THREE.Mesh(pillarGeo, carbonMat);
        leftPillar.position.set(-0.6, 1.05, -2.15);
        this.mesh.add(leftPillar);

        const rightPillar = leftPillar.clone();
        rightPillar.position.set(0.6, 1.05, -2.15);
        this.mesh.add(rightPillar);

        // Quad Exhausts
        const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12);
        exhaustGeo.rotateX(Math.PI / 2);
        const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 });

        [-0.45, -0.3, 0.3, 0.45].forEach(x => {
            const ex = new THREE.Mesh(exhaustGeo, exhaustMat);
            ex.position.set(x, 0.32, -2.32);
            this.mesh.add(ex);
        });

        // 5. Cockpit Interior Dashboard & Steering Wheel
        this.buildCockpitInterior(carbonMat);

        // 6. High-Detail Wheels with Rotors & Calipers
        this.createDetailedWheels(rimMat, discMat, caliperMat);

        // 7. Headlights & Spotlights
        this.createHeadlights();

        // 8. Rear Emissive Brake Lights
        this.createBrakeLights();

        this.scene.add(this.mesh);
    }

    buildCockpitInterior(carbonMat) {
        const dashGeo = new THREE.BoxGeometry(1.4, 0.32, 0.55);
        const dashMat = new THREE.MeshStandardMaterial({ color: 0x121215, roughness: 0.8 });
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set(0, 0.78, 0.5);
        this.mesh.add(dash);

        // Digital HUD display screen on dash
        const screenGeo = new THREE.PlaneGeometry(0.4, 0.2);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(-0.35, 0.82, 0.22);
        screen.rotation.x = -Math.PI / 6;
        this.mesh.add(screen);

        // Sport Steering Wheel Mesh with Gold Hub
        const rimGeo = new THREE.TorusGeometry(0.22, 0.025, 12, 24);
        const hubGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12);
        hubGeo.rotateX(Math.PI / 2);

        this.steeringWheel = new THREE.Group();
        const rimMesh = new THREE.Mesh(rimGeo, carbonMat);
        const hubMesh = new THREE.Mesh(hubGeo, carbonMat);

        this.steeringWheel.add(rimMesh);
        this.steeringWheel.add(hubMesh);

        this.steeringWheel.position.set(-0.38, 0.80, 0.28);
        this.steeringWheel.rotation.x = Math.PI / 5;
        this.mesh.add(this.steeringWheel);
    }

    createDetailedWheels(rimMat, discMat, caliperMat) {
        const tireGeo = new THREE.CylinderGeometry(0.40, 0.40, 0.32, 24);
        tireGeo.rotateZ(Math.PI / 2);
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });

        const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.33, 16);
        rimGeo.rotateZ(Math.PI / 2);

        const discGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 16);
        discGeo.rotateZ(Math.PI / 2);

        const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);

        const wheelPositions = [
            { name: 'FL', x: -0.98, y: 0.40, z: 1.4 },
            { name: 'FR', x: 0.98, y: 0.40, z: 1.4 },
            { name: 'RL', x: -0.98, y: 0.40, z: -1.4 },
            { name: 'RR', x: 0.98, y: 0.40, z: -1.4 }
        ];

        wheelPositions.forEach(pos => {
            const wheelContainer = new THREE.Group();
            wheelContainer.position.set(pos.x, pos.y, pos.z);

            // Tire
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.castShadow = true;
            wheelContainer.add(tire);

            // Satin Gold Alloy Rim
            const rim = new THREE.Mesh(rimGeo, rimMat);
            wheelContainer.add(rim);

            // Brake Disc
            const disc = new THREE.Mesh(discGeo, discMat);
            wheelContainer.add(disc);

            // Red Caliper
            const caliper = new THREE.Mesh(caliperGeo, caliperMat);
            caliper.position.set(0, 0.12, 0);
            wheelContainer.add(caliper);

            this.mesh.add(wheelContainer);
            this.wheels.push({ group: wheelContainer, mesh: tire, isFront: pos.name.startsWith('F') });
        });
    }

    createHeadlights() {
        const headGeo = new THREE.BoxGeometry(0.4, 0.15, 0.1);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const leftHead = new THREE.Mesh(headGeo, headMat);
        leftHead.position.set(-0.72, 0.48, 2.31);
        this.mesh.add(leftHead);

        const rightHead = leftHead.clone();
        rightHead.position.set(0.72, 0.48, 2.31);
        this.mesh.add(rightHead);

        // Volumetric Spotlight Cones
        const spotLeft = new THREE.SpotLight(0xffffff, 3.5, 55, Math.PI / 5, 0.3, 1);
        spotLeft.position.set(-0.72, 0.48, 2.35);
        spotLeft.target.position.set(-0.72, 0, 25);
        this.mesh.add(spotLeft);
        this.mesh.add(spotLeft.target);

        const spotRight = spotLeft.clone();
        spotRight.position.set(0.72, 0.48, 2.35);
        spotRight.target.position.set(0.72, 0, 25);
        this.mesh.add(spotRight);
        this.mesh.add(spotRight.target);
    }

    createBrakeLights() {
        const brakeGeo = new THREE.BoxGeometry(0.5, 0.14, 0.1);
        this.brakeLightMat = new THREE.MeshStandardMaterial({
            color: 0x770000,
            emissive: 0x330000,
            roughness: 0.2
        });

        const leftBrake = new THREE.Mesh(brakeGeo, this.brakeLightMat);
        leftBrake.position.set(-0.72, 0.58, -2.31);
        this.mesh.add(leftBrake);

        const rightBrake = leftBrake.clone();
        rightBrake.position.set(0.72, 0.58, -2.31);
        this.mesh.add(rightBrake);
    }

    update(dt, engineDriveForce) {
        // Smooth Steering angle
        const targetSteer = this.steerInput * this.maxSteeringAngle;
        this.steeringAngle += (targetSteer - this.steeringAngle) * Math.min(1.0, dt * 9.0);

        // Front wheels visual rotation (Steering)
        this.wheels.forEach(w => {
            if (w.isFront) {
                w.group.rotation.y = this.steeringAngle;
            }
            w.mesh.rotation.x += (this.speed / 0.40) * dt;
        });

        // Rotate Steering Wheel inside Cockpit
        if (this.steeringWheel) {
            this.steeringWheel.rotation.z = -this.steeringAngle * 2.8;
        }

        // Net Forces
        let netForce = engineDriveForce;

        // Braking Force & Emissive Glow
        if (this.brakeInput > 0) {
            const brakeDir = Math.sign(this.speed);
            netForce -= brakeDir * this.brakeInput * this.brakeForce * 15;
            this.brakeLightMat.emissive.setHex(0xff0022);
            this.brakeLightMat.color.setHex(0xff4444);
        } else {
            this.brakeLightMat.emissive.setHex(0x330000);
            this.brakeLightMat.color.setHex(0x770000);
        }

        // Drag & Rolling Friction
        const drag = 0.5 * 1.225 * this.dragCoefficient * 2.2 * Math.pow(this.speed, 2) * Math.sign(this.speed);
        const friction = this.rollingFriction * Math.sign(this.speed);

        netForce -= (drag + friction);

        // Kinematics
        this.acceleration = netForce / this.mass;
        this.speed += this.acceleration * dt;

        if (Math.abs(this.speed) < 0.05 && this.throttleInput === 0 && this.brakeInput === 0) {
            this.speed = 0;
        }

        // Ackermann Yaw Turning
        if (Math.abs(this.speed) > 0.01) {
            const angularVelocity = (this.speed / this.wheelbase) * Math.sin(this.steeringAngle);
            this.rotation += angularVelocity * dt;
        }

        // Dynamic Lateral Body Roll / Suspension Compression
        const lateralG = (this.speed * (this.speed / this.wheelbase) * Math.sin(this.steeringAngle)) / 9.81;
        this.mesh.rotation.z = THREE.MathUtils.clamp(-lateralG * 0.09, -0.12, 0.12);

        // Update Position
        this.position.x += Math.sin(this.rotation) * this.speed * dt;
        this.position.z += Math.cos(this.rotation) * this.speed * dt;

        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
    }

    getSpeedKmH() {
        return Math.round(Math.abs(this.speed) * 3.6);
    }
}
