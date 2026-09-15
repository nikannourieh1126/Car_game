/* NFS ProStreet-Style 3D Tuner Supercar & Particle Physics */
class Car {
    constructor(scene, envMap) {
        this.scene = scene;
        this.envMap = envMap;

        // Kinematics
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0;
        this.acceleration = 0;
        this.steeringAngle = 0;
        this.maxSteeringAngle = 0.58;
        this.rotation = 0;

        // Specs
        this.wheelbase = 2.75;
        this.mass = 1380;
        this.enginePower = 520; // High-power ProStreet Tuner
        this.brakeForce = 580;
        this.dragCoefficient = 0.28;
        this.rollingFriction = 9.5;

        // Visual Meshes & Effects
        this.wheels = [];
        this.steeringWheel = null;
        this.brakeLightMat = null;
        this.smokeParticles = [];

        // Input state
        this.throttleInput = 0;
        this.brakeInput = 0;
        this.steerInput = 0;

        this.buildTunerSupercar();
    }

    createLiveryTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Dark Metallic Gloss Base Paint
        ctx.fillStyle = '#181a20';
        ctx.fillRect(0, 0, 1024, 1024);

        // Yellow/Gold ProStreet Racing Stripes & Vinyl Flames
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(100, 0);
        ctx.lineTo(350, 0);
        ctx.lineTo(250, 1024);
        ctx.lineTo(0, 1024);
        ctx.fill();

        ctx.fillStyle = '#e60000';
        ctx.beginPath();
        ctx.moveTo(280, 0);
        ctx.lineTo(450, 0);
        ctx.lineTo(380, 1024);
        ctx.lineTo(210, 1024);
        ctx.fill();

        // Sponsor Decals
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.fillText('RYAN COOPER', 520, 300);
        ctx.font = 'bold 36px Arial';
        ctx.fillText('CASTROL SYNTEC', 520, 380);
        ctx.fillText('BRIDGESTONE', 520, 440);
        ctx.fillText('SPARCO #23', 520, 500);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    buildTunerSupercar() {
        this.mesh = new THREE.Group();

        const liveryTexture = this.createLiveryTexture();

        // ProStreet Tuner Body Paint Shader
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            map: liveryTexture,
            metalness: 0.85,
            roughness: 0.18,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            envMap: this.envMap,
            envMapIntensity: 1.6
        });

        // Carbon Fiber Material
        const carbonMat = new THREE.MeshStandardMaterial({
            color: 0x111115,
            metalness: 0.85,
            roughness: 0.25,
            envMap: this.envMap
        });

        // Glass Material
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x0a101d,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.85,
            transparent: true,
            opacity: 0.85,
            envMap: this.envMap
        });

        // Satin Gold Alloy Rim Material
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xddc088,
            metalness: 0.95,
            roughness: 0.2,
            envMap: this.envMap
        });

        // Lower Chassis Body
        const chassisGeo = new THREE.BoxGeometry(2.1, 0.55, 4.6);
        const chassis = new THREE.Mesh(chassisGeo, bodyMaterial);
        chassis.position.y = 0.48;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        this.mesh.add(chassis);

        // Sloped Nose Hood
        const noseGeo = new THREE.BoxGeometry(2.0, 0.32, 1.2);
        const nose = new THREE.Mesh(noseGeo, bodyMaterial);
        nose.position.set(0, 0.42, 2.1);
        nose.rotation.x = -0.15;
        nose.castShadow = true;
        this.mesh.add(nose);

        // Cockpit Canopy
        const cabinGeo = new THREE.BoxGeometry(1.52, 0.52, 2.3);
        const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
        cabin.position.set(0, 0.95, -0.15);
        cabin.castShadow = true;
        this.mesh.add(cabin);

        // Windshield
        const windshieldGeo = new THREE.PlaneGeometry(1.42, 0.85);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.rotation.x = Math.PI / 3.2;
        windshield.position.set(0, 0.92, 0.85);
        this.mesh.add(windshield);

        // Rear Large GT Racing Wing (ProStreet Style)
        const wingGeo = new THREE.BoxGeometry(2.1, 0.08, 0.5);
        const wing = new THREE.Mesh(wingGeo, carbonMat);
        wing.position.set(0, 1.25, -2.15);
        wing.castShadow = true;
        this.mesh.add(wing);

        const pillarGeo = new THREE.BoxGeometry(0.08, 0.32, 0.2);
        const leftPillar = new THREE.Mesh(pillarGeo, carbonMat);
        leftPillar.position.set(-0.65, 1.05, -2.15);
        this.mesh.add(leftPillar);

        const rightPillar = leftPillar.clone();
        rightPillar.position.set(0.65, 1.05, -2.15);
        this.mesh.add(rightPillar);

        // Quad Chrome Exhaust Pipes
        const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 12);
        exhaustGeo.rotateX(Math.PI / 2);
        const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95 });

        [-0.45, -0.3, 0.3, 0.45].forEach(x => {
            const ex = new THREE.Mesh(exhaustGeo, exhaustMat);
            ex.position.set(x, 0.32, -2.32);
            this.mesh.add(ex);
        });

        // Interior Dashboard & Steering Wheel
        this.buildCockpitInterior(carbonMat);

        // Wheels
        this.createWheels(rimMat);

        // Headlights & Brake Lights
        this.createHeadlights();
        this.createBrakeLights();

        // Tire Smoke Particle System Group
        this.smokeGroup = new THREE.Group();
        this.scene.add(this.smokeGroup);

        this.scene.add(this.mesh);
    }

    buildCockpitInterior(carbonMat) {
        const dashGeo = new THREE.BoxGeometry(1.4, 0.32, 0.55);
        const dashMat = new THREE.MeshStandardMaterial({ color: 0x121215, roughness: 0.8 });
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set(0, 0.78, 0.5);
        this.mesh.add(dash);

        const rimGeo = new THREE.TorusGeometry(0.22, 0.025, 12, 24);
        this.steeringWheel = new THREE.Mesh(rimGeo, carbonMat);
        this.steeringWheel.position.set(-0.38, 0.80, 0.28);
        this.steeringWheel.rotation.x = Math.PI / 5;
        this.mesh.add(this.steeringWheel);
    }

    createWheels(rimMat) {
        const tireGeo = new THREE.CylinderGeometry(0.40, 0.40, 0.32, 24);
        tireGeo.rotateZ(Math.PI / 2);
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });

        const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.33, 16);
        rimGeo.rotateZ(Math.PI / 2);

        const positions = [
            { name: 'FL', x: -0.98, y: 0.40, z: 1.4 },
            { name: 'FR', x: 0.98, y: 0.40, z: 1.4 },
            { name: 'RL', x: -0.98, y: 0.40, z: -1.4 },
            { name: 'RR', x: 0.98, y: 0.40, z: -1.4 }
        ];

        positions.forEach(pos => {
            const wheelContainer = new THREE.Group();
            wheelContainer.position.set(pos.x, pos.y, pos.z);

            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.castShadow = true;
            wheelContainer.add(tire);

            const rim = new THREE.Mesh(rimGeo, rimMat);
            wheelContainer.add(rim);

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

    spawnTireSmoke() {
        // Thick NFS ProStreet white tire smoke clouds
        const smokeGeo = new THREE.SphereGeometry(0.35 + Math.random() * 0.25, 8, 8);
        const smokeMat = new THREE.MeshBasicMaterial({
            color: 0xdddddd,
            transparent: true,
            opacity: 0.55
        });

        [-0.9, 0.9].forEach(x => {
            const smoke = new THREE.Mesh(smokeGeo, smokeMat);
            // Spawn smoke behind rear wheels
            const worldPos = this.position.clone().add(
                new THREE.Vector3(x * Math.cos(this.rotation) - 1.4 * Math.sin(this.rotation),
                                  0.2,
                                  x * Math.sin(this.rotation) - 1.4 * Math.cos(this.rotation))
            );
            smoke.position.copy(worldPos);
            this.smokeGroup.add(smoke);

            this.smokeParticles.push({
                mesh: smoke,
                life: 1.0,
                scaleSpeed: 1.8,
                fadeSpeed: 1.2
            });
        });
    }

    updateSmoke(dt) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.life -= dt * p.fadeSpeed;
            p.mesh.scale.addScalar(dt * p.scaleSpeed);
            p.mesh.material.opacity = p.life * 0.5;
            p.mesh.position.y += dt * 0.8;

            if (p.life <= 0) {
                this.smokeGroup.remove(p.mesh);
                this.smokeParticles.splice(i, 1);
            }
        }
    }

    update(dt, engineDriveForce) {
        const targetSteer = this.steerInput * this.maxSteeringAngle;
        this.steeringAngle += (targetSteer - this.steeringAngle) * Math.min(1.0, dt * 9.0);

        this.wheels.forEach(w => {
            if (w.isFront) {
                w.group.rotation.y = this.steeringAngle;
            }
            w.mesh.rotation.x += (this.speed / 0.40) * dt;
        });

        if (this.steeringWheel) {
            this.steeringWheel.rotation.z = -this.steeringAngle * 2.8;
        }

        let netForce = engineDriveForce;

        if (this.brakeInput > 0) {
            const brakeDir = Math.sign(this.speed);
            netForce -= brakeDir * this.brakeInput * this.brakeForce * 15;
            this.brakeLightMat.emissive.setHex(0xff0022);
            this.brakeLightMat.color.setHex(0xff4444);

            // Spawn smoke on heavy braking at high speed
            if (Math.abs(this.speed) > 12) {
                this.spawnTireSmoke();
            }
        } else {
            this.brakeLightMat.emissive.setHex(0x330000);
            this.brakeLightMat.color.setHex(0x770000);
        }

        // Spawn tire smoke on launch acceleration
        if (this.throttleInput > 0.8 && Math.abs(this.speed) < 15) {
            this.spawnTireSmoke();
        }

        this.updateSmoke(dt);

        const drag = 0.5 * 1.225 * this.dragCoefficient * 2.2 * Math.pow(this.speed, 2) * Math.sign(this.speed);
        const friction = this.rollingFriction * Math.sign(this.speed);

        netForce -= (drag + friction);

        this.acceleration = netForce / this.mass;
        this.speed += this.acceleration * dt;

        if (Math.abs(this.speed) < 0.05 && this.throttleInput === 0 && this.brakeInput === 0) {
            this.speed = 0;
        }

        if (Math.abs(this.speed) > 0.01) {
            const angularVelocity = (this.speed / this.wheelbase) * Math.sin(this.steeringAngle);
            this.rotation += angularVelocity * dt;
        }

        const lateralG = (this.speed * (this.speed / this.wheelbase) * Math.sin(this.steeringAngle)) / 9.81;
        this.mesh.rotation.z = THREE.MathUtils.clamp(-lateralG * 0.09, -0.12, 0.12);

        this.position.x += Math.sin(this.rotation) * this.speed * dt;
        this.position.z += Math.cos(this.rotation) * this.speed * dt;

        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
    }

    getSpeedKmH() {
        return Math.round(Math.abs(this.speed) * 3.6);
    }
}
