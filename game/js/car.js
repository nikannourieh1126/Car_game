/* 3D Player Sports Car & Vehicle Physics Engine */
class Car {
    constructor(scene) {
        this.scene = scene;

        // Kinematics and Physics variables
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0; // Speed in m/s (km/h = speed * 3.6)
        this.acceleration = 0;
        this.steeringAngle = 0;
        this.maxSteeringAngle = 0.55; // Radians (~31 degrees)
        this.rotation = 0; // Yaw angle

        // Vehicle specifications
        this.wheelbase = 2.7; // Meters
        this.mass = 1450; // kg
        this.enginePower = 380; // Horsepower equivalent force
        this.brakeForce = 450;
        this.dragCoefficient = 0.32;
        this.rollingFriction = 12.0;

        // Visual Meshes
        this.wheels = [];
        this.headlights = [];
        this.brakeLights = [];
        this.steeringWheel = null;

        // Controls input state
        this.throttleInput = 0; // 0 to 1
        this.brakeInput = 0;    // 0 to 1
        this.steerInput = 0;    // -1 to 1

        this.buildCarMesh();
    }

    buildCarMesh() {
        this.mesh = new THREE.Group();

        // Metallic Body Shader Material with physical clearcoat
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xd61c1c, // Crimson Red Sports Metallic
            metalness: 0.85,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });

        // Carbon fiber / Black accents
        const darkMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.3
        });

        // Tinted Glass
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x111522,
            metalness: 0.1,
            roughness: 0.1,
            transmission: 0.8,
            transparent: true
        });

        // Main Body Chassis Lower
        const chassisGeo = new THREE.BoxGeometry(2.0, 0.7, 4.4);
        const chassis = new THREE.Mesh(chassisGeo, bodyMaterial);
        chassis.position.y = 0.55;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        this.mesh.add(chassis);

        // Sports Roof / Cockpit Cabin
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.55, 2.2);
        const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
        cabin.position.set(0, 1.05, -0.2);
        cabin.castShadow = true;
        this.mesh.add(cabin);

        // Windshield Glass
        const windshieldGeo = new THREE.PlaneGeometry(1.5, 0.7);
        const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
        windshield.rotation.x = Math.PI / 4;
        windshield.position.set(0, 1.0, 0.85);
        this.mesh.add(windshield);

        // Side Windows
        const sideWinGeo = new THREE.PlaneGeometry(1.9, 0.5);
        const leftWin = new THREE.Mesh(sideWinGeo, glassMaterial);
        leftWin.rotation.y = Math.PI / 2;
        leftWin.position.set(-0.81, 1.05, -0.2);
        this.mesh.add(leftWin);

        const rightWin = leftWin.clone();
        rightWin.rotation.y = -Math.PI / 2;
        rightWin.position.set(0.81, 1.05, -0.2);
        this.mesh.add(rightWin);

        // Interior Dashboard & Steering Wheel (for Cockpit View)
        this.buildCockpitInterior();

        // Front Grille & Splitter
        const grilleGeo = new THREE.BoxGeometry(1.8, 0.25, 0.2);
        const grille = new THREE.Mesh(grilleGeo, darkMaterial);
        grille.position.set(0, 0.35, 2.2);
        this.mesh.add(grille);

        // Rear Spoiler
        const spoilerWingGeo = new THREE.BoxGeometry(1.9, 0.08, 0.4);
        const spoilerWing = new THREE.Mesh(spoilerWingGeo, darkMaterial);
        spoilerWing.position.set(0, 1.15, -2.0);
        this.mesh.add(spoilerWing);

        // Wheels Assembly
        this.createWheels(darkMaterial);

        // Headlights (3D Mesh + SpotLights)
        this.createHeadlights();

        // Rear Brake Lights
        this.createBrakeLights();

        this.scene.add(this.mesh);
    }

    buildCockpitInterior() {
        const dashGeo = new THREE.BoxGeometry(1.4, 0.3, 0.5);
        const dashMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set(0, 0.8, 0.5);
        this.mesh.add(dash);

        // Steering Wheel Mesh
        const rimGeo = new THREE.TorusGeometry(0.2, 0.025, 12, 24);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5 });
        this.steeringWheel = new THREE.Mesh(rimGeo, rimMat);
        this.steeringWheel.position.set(-0.4, 0.82, 0.32);
        this.steeringWheel.rotation.x = Math.PI / 6;
        this.mesh.add(this.steeringWheel);
    }

    createWheels(darkMaterial) {
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 24);
        wheelGeo.rotateZ(Math.PI / 2);

        const positions = [
            { name: 'FL', x: -0.95, y: 0.38, z: 1.3 },
            { name: 'FR', x: 0.95, y: 0.38, z: 1.3 },
            { name: 'RL', x: -0.95, y: 0.38, z: -1.3 },
            { name: 'RR', x: 0.95, y: 0.38, z: -1.3 }
        ];

        positions.forEach(pos => {
            const wheelContainer = new THREE.Group();
            wheelContainer.position.set(pos.x, pos.y, pos.z);

            const wheelMesh = new THREE.Mesh(wheelGeo, darkMaterial);
            wheelMesh.castShadow = true;
            wheelContainer.add(wheelMesh);

            this.mesh.add(wheelContainer);
            this.wheels.push({ group: wheelContainer, mesh: wheelMesh, isFront: pos.name.startsWith('F') });
        });
    }

    createHeadlights() {
        const headGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const leftHead = new THREE.Mesh(headGeo, headMat);
        leftHead.position.set(-0.7, 0.5, 2.21);
        this.mesh.add(leftHead);

        const rightHead = leftHead.clone();
        rightHead.position.set(0.7, 0.5, 2.21);
        this.mesh.add(rightHead);

        // Dynamic High-beam Spotlights
        const spotLeft = new THREE.SpotLight(0xffffff, 2.5, 45, Math.PI / 6, 0.4, 1);
        spotLeft.position.set(-0.7, 0.5, 2.25);
        spotLeft.target.position.set(-0.7, 0, 20);
        this.mesh.add(spotLeft);
        this.mesh.add(spotLeft.target);

        const spotRight = spotLeft.clone();
        spotRight.position.set(0.7, 0.5, 2.25);
        spotRight.target.position.set(0.7, 0, 20);
        this.mesh.add(spotRight);
        this.mesh.add(spotRight.target);
    }

    createBrakeLights() {
        const brakeGeo = new THREE.BoxGeometry(0.4, 0.12, 0.1);
        this.brakeLightMat = new THREE.MeshStandardMaterial({
            color: 0x880000,
            emissive: 0x220000,
            roughness: 0.3
        });

        const leftBrake = new THREE.Mesh(brakeGeo, this.brakeLightMat);
        leftBrake.position.set(-0.7, 0.6, -2.21);
        this.mesh.add(leftBrake);

        const rightBrake = leftBrake.clone();
        rightBrake.position.set(0.7, 0.6, -2.21);
        this.mesh.add(rightBrake);
    }

    update(dt, engineDriveForce) {
        // Smooth Steering angle transition
        const targetSteer = this.steerInput * this.maxSteeringAngle;
        this.steeringAngle += (targetSteer - this.steeringAngle) * Math.min(1.0, dt * 8.0);

        // Apply Front Wheels Visual Rotation (Steering)
        this.wheels.forEach(w => {
            if (w.isFront) {
                w.group.rotation.y = this.steeringAngle;
            }
            // Rolling rotation proportional to speed
            w.mesh.rotation.x += (this.speed / 0.38) * dt;
        });

        // Rotate Steering Wheel in Cockpit
        if (this.steeringWheel) {
            this.steeringWheel.rotation.z = -this.steeringAngle * 2.5;
        }

        // Vehicle Dynamics / Forces
        let netForce = engineDriveForce;

        // Braking Force
        if (this.brakeInput > 0) {
            const brakeDir = Math.sign(this.speed);
            netForce -= brakeDir * this.brakeInput * this.brakeForce * 15;
            this.brakeLightMat.emissive.setHex(0xff0000);
            this.brakeLightMat.color.setHex(0xff3333);
        } else {
            this.brakeLightMat.emissive.setHex(0x220000);
            this.brakeLightMat.color.setHex(0x880000);
        }

        // Aerodynamic Drag & Friction
        const drag = 0.5 * 1.225 * this.dragCoefficient * 2.2 * Math.pow(this.speed, 2) * Math.sign(this.speed);
        const friction = this.rollingFriction * Math.sign(this.speed);

        netForce -= (drag + friction);

        // Acceleration = Force / Mass
        this.acceleration = netForce / this.mass;
        this.speed += this.acceleration * dt;

        // Prevent micro jitter near zero speed
        if (Math.abs(this.speed) < 0.05 && this.throttleInput === 0 && this.brakeInput === 0) {
            this.speed = 0;
        }

        // Steering Yaw / Turning Circle (Ackermann Kinematics Model)
        if (Math.abs(this.speed) > 0.01) {
            const angularVelocity = (this.speed / this.wheelbase) * Math.sin(this.steeringAngle);
            this.rotation += angularVelocity * dt;
        }

        // Body roll / Lean on hard cornering
        const lateralG = (this.speed * (this.speed / this.wheelbase) * Math.sin(this.steeringAngle)) / 9.81;
        this.mesh.rotation.z = THREE.MathUtils.clamp(-lateralG * 0.08, -0.1, 0.1);

        // Update Position based on Heading Angle
        this.position.x += Math.sin(this.rotation) * this.speed * dt;
        this.position.z += Math.cos(this.rotation) * this.speed * dt;

        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
    }

    getSpeedKmH() {
        return Math.round(Math.abs(this.speed) * 3.6);
    }
}
