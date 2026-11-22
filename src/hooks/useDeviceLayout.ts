// Adaptive Device Layout Hook using width, height, orientation, pointer and split-screen
// Preserves Web Desktop and Android TV / TV Box layouts untouched
// Strictly ASCII comments only

import { useState, useEffect } from 'react';

export type DeviceLayoutMode =
  | 'mobilePortrait'
  | 'mobileLandscape'
  | 'tabletPortrait'
  | 'tabletLandscape'
  | 'desktopOrTV';

export interface DeviceLayoutState {
  width: number;
  height: number;
  isLandscape: boolean;
  isTouchDevice: boolean;
  isCapacitorNative: boolean;
  mode: DeviceLayoutMode;
  isMobilePortrait: boolean;
  isMobileLandscape: boolean;
  isTabletPortrait: boolean;
  isTabletLandscape: boolean;
  isDesktopOrTV: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  useTwoColumnLiveTV: boolean;
  useStackedLiveTV: boolean;
  showMobileBottomNav: boolean;
  useCompactLiveHeader: boolean;
}

function computeDeviceLayout(): DeviceLayoutState {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 720,
      isLandscape: true,
      isTouchDevice: false,
      isCapacitorNative: false,
      mode: 'desktopOrTV',
      isMobilePortrait: false,
      isMobileLandscape: false,
      isTabletPortrait: false,
      isTabletLandscape: false,
      isDesktopOrTV: true,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      useTwoColumnLiveTV: true,
      useStackedLiveTV: false,
      showMobileBottomNav: false,
      useCompactLiveHeader: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isLandscape = width > height;

  const isTouchDevice =
    (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) ||
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  const isCapacitorNative = Boolean(
    cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()
  );

  let mode: DeviceLayoutMode;

  if (!isLandscape && width < 600) {
    // Phone in portrait or narrow split-screen pane
    mode = 'mobilePortrait';
  } else if (isTouchDevice && isLandscape && height < 460 && width < 960) {
    // Phone in landscape (short viewport height)
    mode = 'mobileLandscape';
  } else if (!isLandscape && width >= 600 && width < 1024) {
    // Tablet in portrait (e.g. Samsung Galaxy Tab A9 ~600..800dp portrait)
    mode = 'tabletPortrait';
  } else if (
    isLandscape &&
    width >= 720 &&
    height >= 440 &&
    ((isTouchDevice && width < 1280) || (!isTouchDevice && width < 1024))
  ) {
    // Tablet in landscape (e.g. Samsung Galaxy Tab A9 ~800..1000dp landscape)
    mode = 'tabletLandscape';
  } else if (width < 720) {
    // Very small resizable window / split-screen fallback
    mode = isLandscape ? 'mobileLandscape' : 'mobilePortrait';
  } else {
    // Desktop browser or Android TV / TV Box
    mode = 'desktopOrTV';
  }

  const isMobilePortrait = mode === 'mobilePortrait';
  const isMobileLandscape = mode === 'mobileLandscape';
  const isTabletPortrait = mode === 'tabletPortrait';
  const isTabletLandscape = mode === 'tabletLandscape';
  const isDesktopOrTV = mode === 'desktopOrTV';

  const isMobile = isMobilePortrait || isMobileLandscape;
  const isTablet = isTabletPortrait || isTabletLandscape;
  const isDesktop = isDesktopOrTV;

  // Two-column Live TV (Left channel list + Right player) for Tablet Landscape and Desktop/TV
  const useTwoColumnLiveTV = isTabletLandscape || isDesktopOrTV;
  // Stacked Live TV (Top 16:9 player + Compact info + Bottom channel list) for Portrait Phone/Tablet
  const useStackedLiveTV = isMobilePortrait || isTabletPortrait;
  // Bottom navigation bar only on Portrait Phone & Portrait Tablet (hidden on Landscape & Desktop)
  const showMobileBottomNav = isMobilePortrait || isTabletPortrait;
  // Compact Live TV header with Back button for Phone Portrait, Tablet Portrait and Tablet Landscape
  const useCompactLiveHeader = isMobilePortrait || isTabletPortrait || isTabletLandscape;

  return {
    width,
    height,
    isLandscape,
    isTouchDevice,
    isCapacitorNative,
    mode,
    isMobilePortrait,
    isMobileLandscape,
    isTabletPortrait,
    isTabletLandscape,
    isDesktopOrTV,
    isMobile,
    isTablet,
    isDesktop,
    useTwoColumnLiveTV,
    useStackedLiveTV,
    showMobileBottomNav,
    useCompactLiveHeader,
  };
}

export function useDeviceLayout(): DeviceLayoutState {
  const [layout, setLayout] = useState<DeviceLayoutState>(() => computeDeviceLayout());

  useEffect(() => {
    let rafId = 0;
    const handleResize = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        setLayout(computeDeviceLayout());
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return layout;
}
