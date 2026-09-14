/* HTML5 Gamepad & Controller API Integration Module */
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
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let activeGp = null;

        if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
            activeGp = gamepads[this.gamepadIndex];
        } else {
            // Find first connected gamepad
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

        // Standard Gamepad Axis Mapping:
        // Axis 0: Left Stick X (-1 Left to +1 Right)
        // Axis 1: Left Stick Y
        // Axis 2 or Axis 5: Triggers / Right Stick
        const deadzone = 0.12;

        // Steering (Left Stick X)
        let steerAxis = activeGp.axes[0] || 0;
        if (Math.abs(steerAxis) < deadzone) steerAxis = 0;

        // Accelerate & Brake
        // Button 7 (RT / R2) or Button 0 (A / Cross) for Throttle
        let throttle = 0;
        if (activeGp.buttons[7]) throttle = activeGp.buttons[7].value;
        if (throttle < 0.05 && activeGp.buttons[0] && activeGp.buttons[0].pressed) throttle = 1.0;

        // Button 6 (LT / L2) or Button 1 (B / Circle) for Brake
        let brake = 0;
        if (activeGp.buttons[6]) brake = activeGp.buttons[6].value;
        if (brake < 0.05 && activeGp.buttons[1] && activeGp.buttons[1].pressed) brake = 1.0;

        // Button presses for Shift Up / Down & Mode & Camera
        // Button 5 (RB / R1) - Shift Up
        this.checkButtonPress(activeGp, 5, () => {
            if (this.game && this.game.transmission) this.game.transmission.shiftUp();
        });

        // Button 4 (LB / L1) - Shift Down
        this.checkButtonPress(activeGp, 4, () => {
            if (this.game && this.game.transmission) this.game.transmission.shiftDown();
        });

        // Button 8 (Select / View / Back) - Toggle Transmission Mode
        this.checkButtonPress(activeGp, 8, () => {
            if (this.game && this.game.hud) {
                const btn = document.getElementById('btn-toggle-trans');
                if (btn) btn.click();
            }
        });

        // Button 3 (Y / Triangle) or Button 9 (Start) - Switch Camera
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
