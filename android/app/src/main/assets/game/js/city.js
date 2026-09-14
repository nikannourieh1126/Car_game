/* City Generator Module - 3D Urban Environment */
class City {
    constructor(scene) {
        this.scene = scene;
        this.blockSize = 80;
        this.roadWidth = 16;
        this.gridSize = 6; // 6x6 blocks
        this.buildings = [];
        this.streetLamps = [];
        this.trafficLights = [];
        this.lanes = [];

        this.initMaterials();
        this.generateCity();
    }

    initMaterials() {
        // High quality asphalt road material
        this.roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x1d212a,
            roughness: 0.8,
            metalness: 0.1
        });

        // Sidewalk material
        this.sidewalkMaterial = new THREE.MeshStandardMaterial({
            color: 0x7a8391,
            roughness: 0.9,
            metalness: 0.05
        });

        // Building glass/facade materials
        this.facadeMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x213247, roughness: 0.2, metalness: 0.8 }), // Modern Blue Glass
            new THREE.MeshStandardMaterial({ color: 0x2b2e36, roughness: 0.4, metalness: 0.5 }), // Dark Steel
            new THREE.MeshStandardMaterial({ color: 0x48515c, roughness: 0.7, metalness: 0.2 }), // Concrete Block
            new THREE.MeshStandardMaterial({ color: 0x1c2b3d, roughness: 0.1, metalness: 0.9 })  // Mirror Highrise
        ];

        // Emissive Window & Neon Materials
        this.windowEmissiveMaterial = new THREE.MeshBasicMaterial({ color: 0xfff3ad });
        this.neonMaterialCyan = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        this.neonMaterialMagenta = new THREE.MeshBasicMaterial({ color: 0xff0055 });

        // Street Line material
        this.yellowLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        this.whiteLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    }

    generateCity() {
        const halfSize = (this.gridSize * (this.blockSize + this.roadWidth)) / 2;
        const totalWorldSize = halfSize * 2.5;

        // Ground base plane
        const groundGeo = new THREE.PlaneGeometry(totalWorldSize, totalWorldSize);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x11151c, roughness: 0.95 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Generate Road Grid and Blocks
        const step = this.blockSize + this.roadWidth;
        const start = - (this.gridSize / 2) * step;

        for (let ix = 0; ix <= this.gridSize; ix++) {
            for (let iz = 0; iz <= this.gridSize; iz++) {
                const x = start + ix * step;
                const z = start + iz * step;

                // Create Intersection / Road segment
                this.createRoadSegment(x, z, step);

                // Create Building Block inside grid cell
                if (ix < this.gridSize && iz < this.gridSize) {
                    const blockX = x + (this.blockSize + this.roadWidth) / 2;
                    const blockZ = z + (this.blockSize + this.roadWidth) / 2;
                    this.createBuildingBlock(blockX, blockZ, this.blockSize);
                }
            }
        }

        // Store Lane Paths for Traffic AI
        this.generateTrafficLanes(start, step);
    }

    createRoadSegment(x, z, step) {
        // Road mesh
        const roadGeo = new THREE.PlaneGeometry(step, this.roadWidth);

        // Horizontal road
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

        // Center Yellow Lines
        const lineGeo = new THREE.PlaneGeometry(step - this.roadWidth, 0.3);
        const lineH = new THREE.Mesh(lineGeo, this.yellowLineMaterial);
        lineH.rotation.x = -Math.PI / 2;
        lineH.position.set(x + step / 2, 0.02, z);
        this.scene.add(lineH);

        const lineV = new THREE.Mesh(lineGeo, this.yellowLineMaterial);
        lineV.rotation.x = -Math.PI / 2;
        lineV.rotation.z = Math.PI / 2;
        lineV.position.set(x, 0.02, z + step / 2);
        this.scene.add(lineV);

        // Street lamps at corners
        this.createStreetLamp(x + this.roadWidth / 2 + 2, z + this.roadWidth / 2 + 2);
    }

    createBuildingBlock(centerX, centerZ, size) {
        // Sidewalk Base
        const sidewalkGeo = new THREE.BoxGeometry(size, 0.3, size);
        const sidewalk = new THREE.Mesh(sidewalkGeo, this.sidewalkMaterial);
        sidewalk.position.set(centerX, 0.15, centerZ);
        sidewalk.receiveShadow = true;
        this.scene.add(sidewalk);

        // Subdivide block into 2x2 or 3x3 buildings
        const subCount = 2;
        const subSize = (size - 6) / subCount;
        const startOffset = -size / 2 + subSize / 2 + 3;

        for (let bx = 0; bx < subCount; bx++) {
            for (let bz = 0; bz < subCount; bz++) {
                const bX = centerX + startOffset + bx * (subSize + 2);
                const bZ = centerZ + startOffset + bz * (subSize + 2);

                const height = 25 + Math.random() * 85; // 25m to 110m tall skyscrapers
                const mat = this.facadeMaterials[Math.floor(Math.random() * this.facadeMaterials.length)];

                const bGeo = new THREE.BoxGeometry(subSize, height, subSize);
                const building = new THREE.Mesh(bGeo, mat);
                building.position.set(bX, height / 2 + 0.3, bZ);
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);

                // Add glowing windows on building faces
                this.addBuildingWindows(building, subSize, height);

                // Add neon signage to tall buildings
                if (height > 60 && Math.random() > 0.4) {
                    this.addNeonSign(bX, height + 1, bZ, subSize);
                }

                // Add roof props
                this.addRoofProps(bX, height + 0.3, bZ, subSize);

                this.buildings.push(building);
            }
        }
    }

    addBuildingWindows(building, width, height) {
        const windowGeo = new THREE.PlaneGeometry(1.2, 2.0);
        const floors = Math.floor(height / 4);
        const columns = Math.floor(width / 3);

        const windowsGroup = new THREE.Group();

        for (let f = 1; f < floors; f++) {
            for (let c = 0; c < columns; c++) {
                if (Math.random() > 0.3) { // 70% lit windows
                    const win = new THREE.Mesh(windowGeo, this.windowEmissiveMaterial);
                    const localX = (c - columns / 2 + 0.5) * 2.5;
                    const localY = (f - floors / 2) * 3.8;

                    // Front face
                    const winFront = win.clone();
                    winFront.position.set(localX, localY, width / 2 + 0.05);
                    windowsGroup.add(winFront);

                    // Back face
                    const winBack = win.clone();
                    winBack.position.set(localX, localY, -width / 2 - 0.05);
                    winBack.rotation.y = Math.PI;
                    windowsGroup.add(winBack);
                }
            }
        }

        building.add(windowsGroup);
    }

    addNeonSign(x, y, z, width) {
        const isCyan = Math.random() > 0.5;
        const mat = isCyan ? this.neonMaterialCyan : this.neonMaterialMagenta;
        const signGeo = new THREE.BoxGeometry(width * 0.7, 3, 0.5);
        const sign = new THREE.Mesh(signGeo, mat);
        sign.position.set(x, y + 1.5, z);
        this.scene.add(sign);
    }

    addRoofProps(x, y, z, width) {
        // Helipad or AC units
        const acGeo = new THREE.BoxGeometry(2, 2, 2);
        const acMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set(x + (Math.random() - 0.5) * (width - 4), y + 1, z + (Math.random() - 0.5) * (width - 4));
        this.scene.add(ac);
    }

    createStreetLamp(x, z) {
        const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 7);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, 3.5, z);
        this.scene.add(pole);

        // Lamp head light source
        const light = new THREE.PointLight(0xffea9f, 0.8, 25);
        light.position.set(x, 6.8, z);
        this.scene.add(light);

        this.streetLamps.push(light);
    }

    generateTrafficLanes(start, step) {
        // Store lane coordinates for traffic AI navigation
        for (let i = 0; i <= this.gridSize; i++) {
            const coord = start + i * step;
            // Horizontal lane (Eastbound & Westbound)
            this.lanes.push({ type: 'H', z: coord - 4, dir: 1 });  // East
            this.lanes.push({ type: 'H', z: coord + 4, dir: -1 }); // West

            // Vertical lane (Northbound & Southbound)
            this.lanes.push({ type: 'V', x: coord - 4, dir: 1 });  // North
            this.lanes.push({ type: 'V', x: coord + 4, dir: -1 }); // South
        }
    }
}
