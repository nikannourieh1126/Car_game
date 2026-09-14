/* High-Fidelity 3D City Environment & Architecture */
class City {
    constructor(scene, envMap) {
        this.scene = scene;
        this.envMap = envMap;
        this.blockSize = 85;
        this.roadWidth = 18;
        this.gridSize = 6; // 6x6 urban blocks
        this.buildings = [];
        this.streetLamps = [];
        this.lanes = [];

        this.initMaterials();
        this.generateCity();
    }

    initMaterials() {
        // High quality wet-look asphalt road with environmental reflections
        this.roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x181c24,
            roughness: 0.35,
            metalness: 0.4,
            envMap: this.envMap,
            envMapIntensity: 0.8
        });

        // Sidewalk paving material
        this.sidewalkMaterial = new THREE.MeshStandardMaterial({
            color: 0x6e7888,
            roughness: 0.7,
            metalness: 0.1
        });

        // High-rise Glass Curtain Wall Materials
        this.facadeMaterials = [
            new THREE.MeshPhysicalMaterial({ color: 0x162c46, roughness: 0.1, metalness: 0.9, envMap: this.envMap, envMapIntensity: 1.8 }), // Reflective Sapphire Glass
            new THREE.MeshPhysicalMaterial({ color: 0x1e222b, roughness: 0.2, metalness: 0.8, envMap: this.envMap, envMapIntensity: 1.5 }), // Dark Platinum Steel
            new THREE.MeshPhysicalMaterial({ color: 0x3d4754, roughness: 0.4, metalness: 0.4, envMap: this.envMap }),                       // Textured Concrete
            new THREE.MeshPhysicalMaterial({ color: 0x0f1d2e, roughness: 0.05, metalness: 0.95, envMap: this.envMap, envMapIntensity: 2.2 }) // Gold Mirror Glass
        ];

        // Emissive Window & Neon Sign Materials
        this.windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffea88 });
        this.neonCyan = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        this.neonMagenta = new THREE.MeshBasicMaterial({ color: 0xff0066 });
        this.neonGold = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

        // Road markings
        this.yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        this.whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    }

    generateCity() {
        const step = this.blockSize + this.roadWidth;
        const halfSize = (this.gridSize * step) / 2;
        const totalSize = halfSize * 2.5;

        // Ground base plane
        const groundGeo = new THREE.PlaneGeometry(totalSize, totalSize);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x0e1218, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Generate Road Grid
        const start = - (this.gridSize / 2) * step;

        for (let ix = 0; ix <= this.gridSize; ix++) {
            for (let iz = 0; iz <= this.gridSize; iz++) {
                const x = start + ix * step;
                const z = start + iz * step;

                this.createRoadSegment(x, z, step);

                if (ix < this.gridSize && iz < this.gridSize) {
                    const blockX = x + step / 2;
                    const blockZ = z + step / 2;
                    this.createSkyscraperBlock(blockX, blockZ, this.blockSize);
                }
            }
        }

        this.generateTrafficLanes(start, step);
    }

    createRoadSegment(x, z, step) {
        // Horizontal road
        const roadGeo = new THREE.PlaneGeometry(step, this.roadWidth);
        const roadH = new THREE.Mesh(roadGeo, this.roadMaterial);
        roadH.rotation.x = -Math.PI / 2;
        roadH.position.set(x + step / 2, 0, z);
        roadH.receiveShadow = true;
        this.scene.add(roadH);

        // Vertical road
        const roadV = new THREE.Mesh(roadGeo, this.roadMaterial);
        roadV.rotation.x = -Math.PI / 2;
        roadV.rotation.z = Math.PI / 2;
        roadV.position.set(x, 0, z + step / 2);
        roadV.receiveShadow = true;
        this.scene.add(roadV);

        // Double Yellow Center Lines
        const lineGeo = new THREE.PlaneGeometry(step - this.roadWidth, 0.35);
        const lineH = new THREE.Mesh(lineGeo, this.yellowLineMat);
        lineH.rotation.x = -Math.PI / 2;
        lineH.position.set(x + step / 2, 0.02, z);
        this.scene.add(lineH);

        const lineV = new THREE.Mesh(lineGeo, this.yellowLineMat);
        lineV.rotation.x = -Math.PI / 2;
        lineV.rotation.z = Math.PI / 2;
        lineV.position.set(x, 0.02, z + step / 2);
        this.scene.add(lineV);

        // Pedestrian Crosswalk Markings at Intersections
        this.createCrosswalk(x, z);

        // Streetlamp with Volumetric Halo Light
        this.createStreetLamp(x + this.roadWidth / 2 + 2.5, z + this.roadWidth / 2 + 2.5);
    }

    createCrosswalk(x, z) {
        const stripeGeo = new THREE.PlaneGeometry(0.8, 3.5);
        for (let i = -3; i <= 3; i++) {
            const stripe = new THREE.Mesh(stripeGeo, this.whiteLineMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(x + i * 1.8, 0.02, z + this.roadWidth / 2 + 1.2);
            this.scene.add(stripe);
        }
    }

    createSkyscraperBlock(centerX, centerZ, size) {
        // Sidewalk Base
        const sidewalkGeo = new THREE.BoxGeometry(size, 0.35, size);
        const sidewalk = new THREE.Mesh(sidewalkGeo, this.sidewalkMaterial);
        sidewalk.position.set(centerX, 0.17, centerZ);
        sidewalk.receiveShadow = true;
        this.scene.add(sidewalk);

        // Subdivide block into 2x2 highrises
        const subCount = 2;
        const subSize = (size - 8) / subCount;
        const startOffset = -size / 2 + subSize / 2 + 4;

        for (let bx = 0; bx < subCount; bx++) {
            for (let bz = 0; bz < subCount; bz++) {
                const bX = centerX + startOffset + bx * (subSize + 2);
                const bZ = centerZ + startOffset + bz * (subSize + 2);

                const height = 35 + Math.random() * 95; // 35m to 130m skyscrapers
                const mat = this.facadeMaterials[Math.floor(Math.random() * this.facadeMaterials.length)];

                const bGeo = new THREE.BoxGeometry(subSize, height, subSize);
                const building = new THREE.Mesh(bGeo, mat);
                building.position.set(bX, height / 2 + 0.35, bZ);
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);

                // Add glowing windows
                this.addBuildingWindows(building, subSize, height);

                // Add neon billboards to tall towers
                if (height > 65) {
                    this.addNeonBillboard(bX, height, bZ, subSize);
                }

                this.buildings.push(building);
            }
        }
    }

    addBuildingWindows(building, width, height) {
        const windowGeo = new THREE.PlaneGeometry(1.3, 2.2);
        const floors = Math.floor(height / 4.2);
        const columns = Math.floor(width / 3.2);

        const windowsGroup = new THREE.Group();

        for (let f = 1; f < floors; f++) {
            for (let c = 0; c < columns; c++) {
                if (Math.random() > 0.25) { // 75% lit windows
                    const win = new THREE.Mesh(windowGeo, this.windowMaterial);
                    const localX = (c - columns / 2 + 0.5) * 2.8;
                    const localY = (f - floors / 2) * 4.0;

                    const winFront = win.clone();
                    winFront.position.set(localX, localY, width / 2 + 0.05);
                    windowsGroup.add(winFront);

                    const winBack = win.clone();
                    winBack.position.set(localX, localY, -width / 2 - 0.05);
                    winBack.rotation.y = Math.PI;
                    windowsGroup.add(winBack);
                }
            }
        }

        building.add(windowsGroup);
    }

    addNeonBillboard(x, y, z, width) {
        const mats = [this.neonCyan, this.neonMagenta, this.neonGold];
        const mat = mats[Math.floor(Math.random() * mats.length)];

        const boardGeo = new THREE.BoxGeometry(width * 0.8, 3.5, 0.6);
        const board = new THREE.Mesh(boardGeo, mat);
        board.position.set(x, y + 1.8, z);
        this.scene.add(board);
    }

    createStreetLamp(x, z) {
        const poleGeo = new THREE.CylinderGeometry(0.18, 0.24, 7.5);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, metalness: 0.85 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, 3.75, z);
        this.scene.add(pole);

        // Point light source with warm color
        const light = new THREE.PointLight(0xffe89e, 1.2, 30);
        light.position.set(x, 7.2, z);
        this.scene.add(light);

        this.streetLamps.push(light);
    }

    generateTrafficLanes(start, step) {
        for (let i = 0; i <= this.gridSize; i++) {
            const coord = start + i * step;
            this.lanes.push({ type: 'H', z: coord - 4.5, dir: 1 });
            this.lanes.push({ type: 'H', z: coord + 4.5, dir: -1 });
            this.lanes.push({ type: 'V', x: coord - 4.5, dir: 1 });
            this.lanes.push({ type: 'V', x: coord + 4.5, dir: -1 });
        }
    }
}
