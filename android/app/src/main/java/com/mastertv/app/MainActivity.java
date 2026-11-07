package com.mastertv.app;

import android.media.AudioManager;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

// MasterTV Android Main Activity with hardware acceleration, TV Box D-Pad and audio stream routing
// All comments in this file strictly follow ASCII rules
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Route volume buttons directly to media audio stream (fixes TV Box mute and volume control)
        setVolumeControlStream(AudioManager.STREAM_MUSIC);

        // Keep screen active during TV playback
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Enable WebView debugging for remote diagnostics
        WebView.setWebContentsDebuggingEnabled(true);

        // Optimize WebView performance for video streaming and TV remote navigation
        try {
            WebView webView = this.bridge.getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);

                // Enable remote control focus for Android TV and TV Boxes
                webView.setFocusable(true);
                webView.setFocusableInTouchMode(true);
                webView.requestFocus();
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Ensure DPAD and OK events are passed into WebView
        WebView webView = this.bridge.getWebView();
        if (webView != null && !webView.hasFocus()) {
            webView.requestFocus();
        }
        return super.dispatchKeyEvent(event);
    }
}
