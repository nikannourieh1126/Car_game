/* HTML5 Gamepad & Native Android Bridge Manager */
class GamepadManager {
    constructor(game) {
        this.game = game;
        this.gamepadIndex = null;
        this.lastButtonState = {};

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad Connected:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
            this.updateBadge(true, e.gamepad.id);
            this.showHint(true);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad Disconnected:', e.gamepad.id);
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                this.updateBadge(false, 'TOUCH / KEYBOARD');
                this.showHint(false);
            }
        });
    }

    updateBadge(connected, name) {
        const badge = document.getElementById('gamepad-badge');
        const nameEl = document.getElementById('gamepad-name');
        if (badge) {
            badge.style.borderColor = connected ? '#4caf50' : 'rgba(255, 255, 255, 0.15)';
        }
        if (nameEl) {
            const shortName = name.length > 20 ? name.substring(0, 18) + '...' : name;
            nameEl.textContent = connected ? `🎮 ${shortName}` : 'TOUCH / KEYBOARD';
        }
    }

    showHint(show) {
        const hintEl = document.getElementById('gamepad-hint');
        if (hintEl) {
            hintEl.style.display = show ? 'block' : 'none';
        }
    }

    pollInputs() {
        // First check Native Android Gamepad Bridge if running inside Android App
        if (window.AndroidGamepad) {
            try {
                const steer = window.AndroidGamepad.getSteer();
                const throttle = window.AndroidGamepad.getThrottle();
                const brake = window.AndroidGamepad.getBrake();
                if (Math.abs(steer) > 0.05 || throttle > 0.05 || brake > 0.05) {
                    this.updateBadge(true, 'Android Gamepad');
                    return { active: true, steer, throttle, brake };
                }
            } catch (e) {
                // Fallback to standard Gamepad API
            }
        }

        // Standard HTML5 Gamepad API fallback
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let activeGp = null;

        if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
            activeGp = gamepads[this.gamepadIndex];
        } else {
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    activeGp = gamepads[i];
                    this.gamepadIndex = i;
                    this.updateBadge(true, activeGp.id);
                    break;
                }
            }
        }

        if (!activeGp) {
            return { active: false, throttle: 0, brake: 0, steer: 0 };
        }

        const deadzone = 0.12;

        let steerAxis = activeGp.axes[0] || 0;
        if (Math.abs(steerAxis) < deadzone) steerAxis = 0;

        let throttle = 0;
        if (activeGp.buttons[7]) throttle = activeGp.buttons[7].value;
        if (throttle < 0.05 && activeGp.buttons[0] && activeGp.buttons[0].pressed) throttle = 1.0;

        let brake = 0;
        if (activeGp.buttons[6]) brake = activeGp.buttons[6].value;
        if (brake < 0.05 && activeGp.buttons[1] && activeGp.buttons[1].pressed) brake = 1.0;

        this.checkButtonPress(activeGp, 5, () => {
            if (this.game && this.game.transmission) this.game.transmission.shiftUp();
        });

        this.checkButtonPress(activeGp, 4, () => {
            if (this.game && this.game.transmission) this.game.transmission.shiftDown();
        });

        this.checkButtonPress(activeGp, 8, () => {
            if (this.game && this.game.hud) {
                const btn = document.getElementById('btn-toggle-trans');
                if (btn) btn.click();
            }
        });

        this.checkButtonPress(activeGp, 3, () => {
            if (this.game) this.game.switchCamera();
        });

        return {
            active: true,
            steer: steerAxis,
            throttle: throttle,
            brake: brake
        };
    }

    checkButtonPress(gp, buttonIdx, callback) {
        if (!gp.buttons[buttonIdx]) return;
        const isPressed = gp.buttons[buttonIdx].pressed;
        const wasPressed = this.lastButtonState[buttonIdx] || false;

        if (isPressed && !wasPressed) {
            callback();
        }
        this.lastButtonState[buttonIdx] = isPressed;
    }
}
