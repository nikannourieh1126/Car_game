/* Dynamic AI Traffic System Module */
class TrafficSystem {
    constructor(scene, city) {
        this.scene = scene;
        this.city = city;
        this.vehicles = [];
        this.maxVehicles = 24;

        this.initMaterials();
        this.spawnTraffic();
    }

    initMaterials() {
        this.carColors = [
            0x3a7bd5, // Blue Sedan
            0xe74c3c, // Red Hatchback
            0x2ecc71, // Green SUV
            0xf1c40f, // Yellow Taxi
            0x9b59b6, // Purple Coupe
            0x34495e, // Dark Gray Sedan
            0xe67e22, // Orange Crossover
            0xecf0f1  // White Pearl
        ];

        this.windowMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    }

    spawnTraffic() {
        const lanes = this.city.lanes;
        if (!lanes || lanes.length === 0) return;

        for (let i = 0; i < this.maxVehicles; i++) {
            const lane = lanes[Math.floor(Math.random() * lanes.length)];
            const color = this.carColors[Math.floor(Math.random() * this.carColors.length)];

            const vehicleMesh = this.createNpcCarMesh(color);

            // Random initial position along lane
            let posX = 0, posZ = 0, rotY = 0;
            const dist = (Math.random() - 0.5) * 350;

            if (lane.type === 'H') {
                posX = dist;
                posZ = lane.z;
                rotY = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
            } else {
                posX = lane.x;
                posZ = dist;
                rotY = lane.dir > 0 ? 0 : Math.PI;
            }

            vehicleMesh.position.set(posX, 0, posZ);
            vehicleMesh.rotation.y = rotY;

            this.scene.add(vehicleMesh);

            this.vehicles.push({
                mesh: vehicleMesh,
                lane: lane,
                speed: 8 + Math.random() * 8, // 28 to 58 km/h
                targetSpeed: 8 + Math.random() * 8,
                length: 4.2
            });
        }
    }

    createNpcCarMesh(colorHex) {
        const carGroup = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.6,
            roughness: 0.3
        });

        // Chassis Lower
        const chassisGeo = new THREE.BoxGeometry(1.9, 0.65, 4.2);
        const chassis = new THREE.Mesh(chassisGeo, bodyMat);
        chassis.position.y = 0.5;
        chassis.castShadow = true;
        carGroup.add(chassis);

        // Cabin Upper
        const cabinGeo = new THREE.BoxGeometry(1.5, 0.5, 2.1);
        const cabin = new THREE.Mesh(cabinGeo, bodyMat);
        cabin.position.set(0, 1.0, -0.2);
        carGroup.add(cabin);

        // Windows
        const winGeo = new THREE.BoxGeometry(1.48, 0.45, 2.0);
        const win = new THREE.Mesh(winGeo, this.windowMaterial);
        win.position.set(0, 1.01, -0.2);
        carGroup.add(win);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

        const wheelPositions = [
            [-0.9, 0.35, 1.2], [0.9, 0.35, 1.2],
            [-0.9, 0.35, -1.2], [0.9, 0.35, -1.2]
        ];

        wheelPositions.forEach(p => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(p[0], p[1], p[2]);
            carGroup.add(w);
        });

        // Headlights & Tail Lights
        const headGeo = new THREE.BoxGeometry(0.3, 0.12, 0.08);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftHead = new THREE.Mesh(headGeo, headMat);
        leftHead.position.set(-0.65, 0.5, 2.11);
        carGroup.add(leftHead);

        const rightHead = leftHead.clone();
        rightHead.position.set(0.65, 0.5, 2.11);
        carGroup.add(rightHead);

        const tailGeo = new THREE.BoxGeometry(0.3, 0.12, 0.08);
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
        const leftTail = new THREE.Mesh(tailGeo, tailMat);
        leftTail.position.set(-0.65, 0.5, -2.11);
        carGroup.add(leftTail);

        const rightTail = leftTail.clone();
        rightTail.position.set(0.65, 0.5, -2.11);
        carGroup.add(rightTail);

        return carGroup;
    }

    update(dt, playerPos) {
        this.vehicles.forEach(npc => {
            let moveDist = npc.speed * dt;

            // Collision Avoidance / Distance checking with Player car
            const distToPlayer = npc.mesh.position.distanceTo(playerPos);
            if (distToPlayer < 8.0) {
                // Slow down or stop to avoid hitting player
                npc.speed = Math.max(0, npc.speed - dt * 25.0);
            } else {
                // Accelerate back to normal lane speed
                npc.speed = Math.min(npc.targetSpeed, npc.speed + dt * 5.0);
            }

            // Move vehicle along its assigned heading orientation
            if (npc.lane.type === 'H') {
                npc.mesh.position.x += npc.lane.dir * npc.speed * dt;
            } else {
                npc.mesh.position.z += npc.lane.dir * npc.speed * dt;
            }

            // Recycle / Respawn vehicle when too far from player
            const currentDist = npc.mesh.position.distanceTo(playerPos);
            if (currentDist > 220) {
                // Teleport ahead of player in drive direction
                if (npc.lane.type === 'H') {
                    npc.mesh.position.x = playerPos.x + npc.lane.dir * 180 + (Math.random() - 0.5) * 40;
                    npc.mesh.position.z = npc.lane.z;
                } else {
                    npc.mesh.position.x = npc.lane.x;
                    npc.mesh.position.z = playerPos.z + npc.lane.dir * 180 + (Math.random() - 0.5) * 40;
                }
            }
        });
    }
}
