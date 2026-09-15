/* NFS ProStreet Circuit & City Environment Module */
class City {
    constructor(scene, envMap) {
        this.scene = scene;
        this.envMap = envMap;
        this.blockSize = 85;
        this.roadWidth = 20;
        this.gridSize = 6;
        this.buildings = [];
        this.lanes = [];

        this.initMaterials();
        this.generateCity();
        this.createSkyProps();
    }

    createBillboardTexture(titleText, colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = colorHex;
        ctx.fillRect(0, 0, 512, 256);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px Impact, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(titleText, 256, 120);

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('SYNTEC POWER TECHNOLOGY', 256, 180);

        return new THREE.CanvasTexture(canvas);
    }

    initMaterials() {
        this.roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x1f242e,
            roughness: 0.4,
            metalness: 0.3,
            envMap: this.envMap
        });

        this.sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x667080, roughness: 0.7 });

        this.kerbRedMat = new THREE.MeshBasicMaterial({ color: 0xee2222 });
        this.kerbWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.billboardMatCastrol = new THREE.MeshStandardMaterial({ map: this.createBillboardTexture('Castrol SYNTEC', '#007a3d') });
        this.billboardMatBridgestone = new THREE.MeshStandardMaterial({ map: this.createBillboardTexture('BRIDGESTONE', '#111111') });
        this.billboardMatProgressive = new THREE.MeshStandardMaterial({ map: this.createBillboardTexture('PROGRESSIVE', '#0055b8') });

        this.facadeMaterials = [
            new THREE.MeshPhysicalMaterial({ color: 0x182e44, roughness: 0.1, metalness: 0.9, envMap: this.envMap, envMapIntensity: 1.8 }),
            new THREE.MeshPhysicalMaterial({ color: 0x222630, roughness: 0.2, metalness: 0.8, envMap: this.envMap }),
            new THREE.MeshPhysicalMaterial({ color: 0x3d4856, roughness: 0.4, metalness: 0.4, envMap: this.envMap }),
            new THREE.MeshPhysicalMaterial({ color: 0x102032, roughness: 0.05, metalness: 0.95, envMap: this.envMap, envMapIntensity: 2.2 })
        ];

        this.windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffea88 });
    }

    generateCity() {
        const step = this.blockSize + this.roadWidth;
        const halfSize = (this.gridSize * step) / 2;

        const groundGeo = new THREE.PlaneGeometry(halfSize * 2.5, halfSize * 2.5);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.05;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const start = - (this.gridSize / 2) * step;

        for (let ix = 0; ix <= this.gridSize; ix++) {
            for (let iz = 0; iz <= this.gridSize; iz++) {
                const x = start + ix * step;
                const z = start + iz * step;

                this.createRoadSegment(x, z, step);

                if (ix < this.gridSize && iz < this.gridSize) {
                    const blockX = x + step / 2;
                    const blockZ = z + step / 2;
                    this.createBuildingBlock(blockX, blockZ, this.blockSize);
                }
            }
        }

        this.generateTrafficLanes(start, step);
    }

    createRoadSegment(x, z, step) {
        const roadGeo = new THREE.PlaneGeometry(step, this.roadWidth);
        const roadH = new THREE.Mesh(roadGeo, this.roadMaterial);
        roadH.rotation.x = -Math.PI / 2;
        roadH.position.set(x + step / 2, 0, z);
        roadH.receiveShadow = true;
        this.scene.add(roadH);

        const roadV = new THREE.Mesh(roadGeo, this.roadMaterial);
        roadV.rotation.x = -Math.PI / 2;
        roadV.rotation.z = Math.PI / 2;
        roadV.position.set(x, 0, z + step / 2);
        roadV.receiveShadow = true;
        this.scene.add(roadV);

        // Concrete Kerb Borders (Red/White alternating stripes)
        this.createKerbBorders(x + step / 2, z + this.roadWidth / 2 + 0.5, step - this.roadWidth);
        this.createKerbBorders(x + step / 2, z - this.roadWidth / 2 - 0.5, step - this.roadWidth);

        // Trackside Sponsor Billboards
        if (Math.random() > 0.4) {
            this.createSponsorBillboard(x + step / 2, z + this.roadWidth / 2 + 3.0);
        }
    }

    createKerbBorders(centerX, z, length) {
        const kerbGeo = new THREE.BoxGeometry(2.0, 0.2, 0.6);
        const count = Math.floor(length / 2.0);
        const startX = centerX - length / 2;

        for (let i = 0; i < count; i++) {
            const mat = i % 2 === 0 ? this.kerbRedMat : this.kerbWhiteMat;
            const kerb = new THREE.Mesh(kerbGeo, mat);
            kerb.position.set(startX + i * 2.0, 0.1, z);
            this.scene.add(kerb);
        }
    }

    createSponsorBillboard(x, z) {
        const boardGeo = new THREE.BoxGeometry(12, 5, 0.6);
        const mats = [this.billboardMatCastrol, this.billboardMatBridgestone, this.billboardMatProgressive];
        const mat = mats[Math.floor(Math.random() * mats.length)];

        const board = new THREE.Mesh(boardGeo, mat);
        board.position.set(x, 4.0, z);
        board.castShadow = true;
        this.scene.add(board);

        // Concrete support legs
        const legGeo = new THREE.CylinderGeometry(0.2, 0.25, 4.0);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(x - 4.5, 2.0, z);
        this.scene.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(x + 4.5, 2.0, z);
        this.scene.add(rightLeg);
    }

    createSkyProps() {
        // NFS ProStreet Hot Air Balloon in clear sky
        const balloonGroup = new THREE.Group();

        const balloonGeo = new THREE.SphereGeometry(12, 24, 24);
        const balloonMat = new THREE.MeshStandardMaterial({ color: 0xee3322, metalness: 0.1, roughness: 0.8 });
        const balloon = new THREE.Mesh(balloonGeo, balloonMat);
        balloonGroup.add(balloon);

        const basketGeo = new THREE.BoxGeometry(3, 2.5, 3);
        const basketMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.y = -15;
        balloonGroup.add(basket);

        balloonGroup.position.set(80, 110, -120);
        this.scene.add(balloonGroup);
    }

    createBuildingBlock(centerX, centerZ, size) {
        const sidewalkGeo = new THREE.BoxGeometry(size, 0.35, size);
        const sidewalk = new THREE.Mesh(sidewalkGeo, this.sidewalkMaterial);
        sidewalk.position.set(centerX, 0.17, centerZ);
        sidewalk.receiveShadow = true;
        this.scene.add(sidewalk);

        const subCount = 2;
        const subSize = (size - 8) / subCount;
        const startOffset = -size / 2 + subSize / 2 + 4;

        for (let bx = 0; bx < subCount; bx++) {
            for (let bz = 0; bz < subCount; bz++) {
                const bX = centerX + startOffset + bx * (subSize + 2);
                const bZ = centerZ + startOffset + bz * (subSize + 2);

                const height = 35 + Math.random() * 95;
                const mat = this.facadeMaterials[Math.floor(Math.random() * this.facadeMaterials.length)];

                const bGeo = new THREE.BoxGeometry(subSize, height, subSize);
                const building = new THREE.Mesh(bGeo, mat);
                building.position.set(bX, height / 2 + 0.35, bZ);
                building.castShadow = true;
                building.receiveShadow = true;
                this.scene.add(building);

                this.addBuildingWindows(building, subSize, height);
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
                if (Math.random() > 0.25) {
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

    generateTrafficLanes(start, step) {
        for (let i = 0; i <= this.gridSize; i++) {
            const coord = start + i * step;
            this.lanes.push({ type: 'H', z: coord - 5.0, dir: 1 });
            this.lanes.push({ type: 'H', z: coord + 5.0, dir: -1 });
            this.lanes.push({ type: 'V', x: coord - 5.0, dir: 1 });
            this.lanes.push({ type: 'V', x: coord + 5.0, dir: -1 });
        }
    }
}
