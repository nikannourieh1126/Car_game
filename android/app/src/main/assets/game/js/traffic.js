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
            0x3a7bd5, // Sapphire Blue
            0xe74c3c, // Crimson Red
            0x2ecc71, // Emerald Green
            0xf1c40f, // Canary Yellow
            0x9b59b6, // Deep Purple
            0x34495e, // Metallic Slate
            0xe67e22, // Sunset Orange
            0xecf0f1  // Pearl White
        ];

        this.windowMaterial = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.1, metalness: 0.8 });
    }

    spawnTraffic() {
        const lanes = this.city.lanes;
        if (!lanes || lanes.length === 0) return;

        for (let i = 0; i < this.maxVehicles; i++) {
            const lane = lanes[Math.floor(Math.random() * lanes.length)];
            const color = this.carColors[Math.floor(Math.random() * this.carColors.length)];

            const vehicleMesh = this.createNpcCarMesh(color);

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
            metalness: 0.7,
            roughness: 0.2
        });

        // Chassis
        const chassisGeo = new THREE.BoxGeometry(1.95, 0.65, 4.3);
        const chassis = new THREE.Mesh(chassisGeo, bodyMat);
        chassis.position.y = 0.5;
        chassis.castShadow = true;
        carGroup.add(chassis);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(1.5, 0.52, 2.2);
        const cabin = new THREE.Mesh(cabinGeo, bodyMat);
        cabin.position.set(0, 1.02, -0.2);
        carGroup.add(cabin);

        // Windows
        const winGeo = new THREE.BoxGeometry(1.48, 0.48, 2.1);
        const win = new THREE.Mesh(winGeo, this.windowMaterial);
        win.position.set(0, 1.03, -0.2);
        carGroup.add(win);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5 });

        const wheelPositions = [
            [-0.92, 0.36, 1.25], [0.92, 0.36, 1.25],
            [-0.92, 0.36, -1.25], [0.92, 0.36, -1.25]
        ];

        wheelPositions.forEach(p => {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(p[0], p[1], p[2]);
            carGroup.add(w);
        });

        // Lights
        const headGeo = new THREE.BoxGeometry(0.3, 0.12, 0.08);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftHead = new THREE.Mesh(headGeo, headMat);
        leftHead.position.set(-0.65, 0.5, 2.16);
        carGroup.add(leftHead);

        const rightHead = leftHead.clone();
        rightHead.position.set(0.65, 0.5, 2.16);
        carGroup.add(rightHead);

        const tailGeo = new THREE.BoxGeometry(0.3, 0.12, 0.08);
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
        const leftTail = new THREE.Mesh(tailGeo, tailMat);
        leftTail.position.set(-0.65, 0.5, -2.16);
        carGroup.add(leftTail);

        const rightTail = leftTail.clone();
        rightTail.position.set(0.65, 0.5, -2.16);
        carGroup.add(rightTail);

        return carGroup;
    }

    update(dt, playerPos) {
        this.vehicles.forEach(npc => {
            let moveDist = npc.speed * dt;

            const distToPlayer = npc.mesh.position.distanceTo(playerPos);
            if (distToPlayer < 8.0) {
                npc.speed = Math.max(0, npc.speed - dt * 25.0);
            } else {
                npc.speed = Math.min(npc.targetSpeed, npc.speed + dt * 5.0);
            }

            if (npc.lane.type === 'H') {
                npc.mesh.position.x += npc.lane.dir * npc.speed * dt;
            } else {
                npc.mesh.position.z += npc.lane.dir * npc.speed * dt;
            }

            const currentDist = npc.mesh.position.distanceTo(playerPos);
            if (currentDist > 220) {
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
