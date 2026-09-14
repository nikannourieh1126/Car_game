/* Main WebGL Game Renderer & Manager */
class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.canvas = document.getElementById('webgl-canvas');

        this.initThree();
        this.initScene();
        this.initCameraModes();
        this.initGameEntities();
        this.initEventListeners();

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        // WebGL Renderer setup
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
        this.renderer.toneMappingExposure = 1.1;

        // Scene creation
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0c1322); // Dusk / Evening sky tint
        this.scene.fog = new THREE.FogExp2(0x0c1322, 0.0035);

        // Perspective Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    }

    initScene() {
        // Directional Sun Light with Shadows
        this.sunLight = new THREE.DirectionalLight(0xffeaad, 1.8);
        this.sunLight.position.set(120, 150, 80);
        this.sunLight.castShadow = true;

        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 400;
        const d = 100;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;

        this.scene.add(this.sunLight);

        // Ambient & Hemisphere Lights
        const hemiLight = new THREE.HemisphereLight(0x7090b0, 0x111622, 0.8);
        this.scene.add(hemiLight);
    }

    initCameraModes() {
        this.cameraModes = ['CHASE 1', 'CHASE 2', 'COCKPIT', 'BONNET'];
        this.currentCameraIndex = 0;
    }

    initGameEntities() {
        // Instantiate City
        this.city = new City(this.scene);

        // Instantiate Player Car
        this.car = new Car(this.scene);

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

        // Keyboard Controls Fallback
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

        const forward = new THREE.Vector3(Math.sin(carRot), 0, Math.cos(carRot));
        const up = new THREE.Vector3(0, 1, 0);

        let targetCamPos = new THREE.Vector3();
        let targetLookAt = carPos.clone().add(new THREE.Vector3(0, 1.2, 0));

        switch (this.cameraModes[this.currentCameraIndex]) {
            case 'CHASE 1':
                // Far chase camera
                targetCamPos = carPos.clone().sub(forward.clone().multiplyScalar(7.5)).add(new THREE.Vector3(0, 2.8, 0));
                targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(4.0)).add(new THREE.Vector3(0, 1.2, 0));
                break;
            case 'CHASE 2':
                // Close sport camera
                targetCamPos = carPos.clone().sub(forward.clone().multiplyScalar(5.0)).add(new THREE.Vector3(0, 1.8, 0));
                targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(5.0)).add(new THREE.Vector3(0, 1.0, 0));
                break;
            case 'COCKPIT':
                // Interior driver seat view
                targetCamPos = carPos.clone().add(new THREE.Vector3(-0.4 * Math.cos(carRot), 1.0, 0.3 * Math.sin(carRot)));
                targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(10.0)).add(new THREE.Vector3(0, 0.9, 0));
                break;
            case 'BONNET':
                // Front bonnet / hood view
                targetCamPos = carPos.clone().add(forward.clone().multiplyScalar(1.2)).add(new THREE.Vector3(0, 0.9, 0));
                targetLookAt = carPos.clone().add(forward.clone().multiplyScalar(15.0)).add(new THREE.Vector3(0, 0.8, 0));
                break;
        }

        // Smooth camera lerp movement
        this.camera.position.lerp(targetCamPos, 0.12);
        this.camera.lookAt(targetLookAt);
    }

    processInputs() {
        let throttle = 0;
        let brake = 0;
        let steer = 0;

        // Process Gamepad Inputs first if active
        const gpInputs = this.gamepadManager.pollInputs();
        if (gpInputs.active) {
            throttle = gpInputs.throttle;
            brake = gpInputs.brake;
            steer = gpInputs.steer;
        } else {
            // Keyboard Inputs
            if (this.keys['w'] || this.keys['arrowup']) throttle = 1.0;
            if (this.keys['s'] || this.keys['arrowdown']) brake = 1.0;
            if (this.keys['a'] || this.keys['arrowleft']) steer = -1.0;
            if (this.keys['d'] || this.keys['arrowright']) steer = 1.0;

            // Combine with Touch inputs from HUD
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

        // Process Player Input
        this.processInputs();

        // Update Transmission & Engine Force
        const driveForce = this.transmission.update(dt);

        // Update Car Kinematics
        this.car.update(dt, driveForce);

        // Update AI Traffic Simulation
        this.traffic.update(dt, this.car.position);

        // Update Camera Position
        this.updateCamera();

        // Update HUD Gauges & MiniMap
        this.hud.update(this.car, this.transmission, this.traffic);

        // Render Scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Instantiate Game on Page Load
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
