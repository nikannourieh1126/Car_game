package com.citycardriving.game;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView webView;
    private float steerAxis = 0f;
    private float throttleVal = 0f;
    private float brakeVal = 0f;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        hideSystemUI();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Native Gamepad JavaScript Bridge
        webView.addJavascriptInterface(new WebAppInterface(), "AndroidGamepad");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
            }
        });

        webView.loadUrl("file:///android_asset/game/index.html");
    }

    public class WebAppInterface {
        @JavascriptInterface
        public float getSteer() { return steerAxis; }

        @JavascriptInterface
        public float getThrottle() { return throttleVal; }

        @JavascriptInterface
        public float getBrake() { return brakeVal; }
    }

    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((event.getSource() & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD ||
            (event.getSource() & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK) {
            if (keyCode == KeyEvent.KEYCODE_BUTTON_A) throttleVal = 1.0f;
            if (keyCode == KeyEvent.KEYCODE_BUTTON_B) brakeVal = 1.0f;
            if (keyCode == KeyEvent.KEYCODE_BUTTON_R1) webView.evaluateJavascript("if(window.gameInstance) window.gameInstance.transmission.shiftUp();", null);
            if (keyCode == KeyEvent.KEYCODE_BUTTON_L1) webView.evaluateJavascript("if(window.gameInstance) window.gameInstance.transmission.shiftDown();", null);
            if (keyCode == KeyEvent.KEYCODE_BUTTON_Y) webView.evaluateJavascript("if(window.gameInstance) window.gameInstance.switchCamera();", null);
            if (keyCode == KeyEvent.KEYCODE_BUTTON_SELECT) webView.evaluateJavascript("if(window.gameInstance) window.gameInstance.transmission.toggleMode();", null);
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if ((event.getSource() & InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD ||
            (event.getSource() & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK) {
            if (keyCode == KeyEvent.KEYCODE_BUTTON_A) throttleVal = 0.0f;
            if (keyCode == KeyEvent.KEYCODE_BUTTON_B) brakeVal = 0.0f;
            return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    @Override
    public boolean onGenericMotionEvent(MotionEvent event) {
        if ((event.getSource() & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK &&
            event.getAction() == MotionEvent.ACTION_MOVE) {
            steerAxis = event.getAxisValue(MotionEvent.AXIS_X);
            float rTrigger = event.getAxisValue(MotionEvent.AXIS_RTRIGGER);
            float lTrigger = event.getAxisValue(MotionEvent.AXIS_LTRIGGER);
            if (rTrigger > 0.05f) throttleVal = rTrigger;
            if (lTrigger > 0.05f) brakeVal = lTrigger;
            return true;
        }
        return super.onGenericMotionEvent(event);
    }
}
