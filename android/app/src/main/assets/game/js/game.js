/* Main WebGL Engine & Visual Effects Manager */
class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.canvas = document.getElementById('webgl-canvas');

        this.initThree();
        this.initEnvironmentMap();
        this.initScene();
        this.initCameraModes();
        this.initGameEntities();
        this.initEventListeners();

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a101d); // Sunset Dusk Sky Tint
        this.scene.fog = new THREE.FogExp2(0x0a101d, 0.0030);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    }

    initEnvironmentMap() {
        // Create dynamic Canvas Environment Cube Map for metallic reflections
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Sky & Neon City reflection gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.0, '#020b18');
        grad.addColorStop(0.4, '#1a2942');
        grad.addColorStop(0.7, '#e0663b'); // Golden sunset horizon
        grad.addColorStop(1.0, '#0a0d14');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        // Neon City skyline reflections on canvas
        ctx.fillStyle = '#00e5ff';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(i * 26, 280 + Math.random() * 50, 18, 150);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.envMap = texture;
    }

    initScene() {
        // Directional Golden Sunlight with soft shadows
        this.sunLight = new THREE.DirectionalLight(0xffdf9e, 2.2);
        this.sunLight.position.set(140, 160, 90);
        this.sunLight.castShadow = true;

        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 450;
        const d = 110;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;

        this.scene.add(this.sunLight);

        // Hemisphere & Ambient Fill Lights
        const hemiLight = new THREE.HemisphereLight(0x759cc9, 0x141824, 0.9);
        this.scene.add(hemiLight);
    }

    initCameraModes() {
        this.cameraModes = ['CHASE 1', 'CHASE 2', 'COCKPIT', 'BONNET'];
        this.currentCameraIndex = 0;
        this.baseFov = 60;
    }

    initGameEntities() {
        // Instantiate City with Environment Reflection Map
        this.city = new City(this.scene, this.envMap);

        // Instantiate Supercar with Environment Reflection Map
        this.car = new Car(this.scene, this.envMap);

        // Instantiate Transmission System
        this.transmission = new Transmission(this.car);

        // Instantiate AI Traffic System
        this.traffic = new TrafficSystem(this.scene, this.city);

        // Instantiate Gamepad Manager
        this.gamepadManager = new GamepadManager(this);

        // Instantiate HUD Manager
        this.hud = new HUD(this);
    }

    initEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.keys = {};
        window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    }

    switchCamera() {
        this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameraModes.length;
        const modeBtn = document.getElementById('btn-camera-switch');
        if (modeBtn) modeBtn.textContent = this.cameraModes[this.currentCameraIndex];
    }

    updateCamera() {
        const carPos = this.car.position;
        const carRot = this.car.rotation;
        const speedKmh = this.car.getSpeedKmH();

        const forward = new THREE.Vector3(Math.sin(carRot), 0, Math.cos(carRot));

        let targetCamPos = new THREE.Vector3();
        let targetLookAt = carPos.clone().add(new THREE.Vector3(0, 1.2, 0));

        switch (this.cameraModes[this.currentCameraIndex]) {
            case 'CHASE 1':
                targetCamPos = carPos.clone().sub(forward.clone().multiplyScalar(7.8)).add(new THREE.Vector3(0, 2.6, 0));
                targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(4.5)).add(new THREE.Vector3(0, 1.1, 0));
                break;
            case 'CHASE 2':
                targetCamPos = carPos.clone().sub(forward.clone().multiplyScalar(5.2)).add(new THREE.Vector3(0, 1.7, 0));
                targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(5.5)).add(new THREE.Vector3(0, 0.95, 0));
                break;
            case 'COCKPIT':
                targetCamPos = carPos.clone().add(new THREE.Vector3(-0.38 * Math.cos(carRot), 0.98, 0.28 * Math.sin(carRot)));
                targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(12.0)).add(new THREE.Vector3(0, 0.88, 0));
                break;
            case 'BONNET':
                targetCamPos = carPos.clone().add(forward.clone().multiplyScalar(1.25)).add(new THREE.Vector3(0, 0.88, 0));
                targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(16.0)).add(new THREE.Vector3(0, 0.82, 0));
                break;
        }

        // Speed FOV Dilation (FOV widens with high speed)
        const speedFovOffset = Math.min(18, (speedKmh / 220) * 18);
        this.camera.fov = this.baseFov + speedFovOffset;
        this.camera.updateProjectionMatrix();

        // Smooth Camera Lerp
        this.camera.position.lerp(targetCamPos, 0.14);
        this.camera.lookAt(targetLookAt);
    }

    processInputs() {
        let throttle = 0;
        let brake = 0;
        let steer = 0;

        const gpInputs = this.gamepadManager.pollInputs();
        if (gpInputs.active) {
            throttle = gpInputs.throttle;
            brake = gpInputs.brake;
            steer = gpInputs.steer;
        } else {
            if (this.keys['w'] || this.keys['arrowup']) throttle = 1.0;
            if (this.keys['s'] || this.keys['arrowdown']) brake = 1.0;
            if (this.keys['a'] || this.keys['arrowleft']) steer = -1.0;
            if (this.keys['d'] || this.keys['arrowright']) steer = 1.0;

            if (this.hud) {
                if (this.hud.touchAccel) throttle = Math.max(throttle, 1.0);
                if (this.hud.touchBrake) brake = Math.max(brake, 1.0);
                if (this.hud.touchSteer !== 0) steer = this.hud.touchSteer;
            }
        }

        this.car.throttleInput = throttle;
        this.car.brakeInput = brake;
        this.car.steerInput = steer;
    }

    animate() {
        requestAnimationFrame(this.animate);

        const dt = Math.min(this.clock.getDelta(), 0.1);

        this.processInputs();

        const driveForce = this.transmission.update(dt);

        this.car.update(dt, driveForce);

        this.traffic.update(dt, this.car.position);

        this.updateCamera();

        this.hud.update(this.car, this.transmission, this.traffic);

        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
