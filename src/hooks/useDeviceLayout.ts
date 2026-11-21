// Reactive Device Layout Hook for Mobile, Tablet and Desktop detection
// Preserves Desktop and Android TV / TV Box layouts untouched
// Strictly ASCII comments only

import { useState, useEffect } from 'react';

export interface DeviceLayoutState {
  width: number;
  height: number;
  isLandscape: boolean;
  isTouchDevice: boolean;
  isCapacitorNative: boolean;
  isMobile: boolean;
  isTabletPortrait: boolean;
  isTabletLandscape: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

function computeDeviceLayout(): DeviceLayoutState {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 720,
      isLandscape: true,
      isTouchDevice: false,
      isCapacitorNative: false,
      isMobile: false,
      isTabletPortrait: false,
      isTabletLandscape: false,
      isTablet: false,
      isDesktop: true,
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
  const isCapacitorNative = Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());

  // Phone portrait (< 768px) or phone landscape (touch device with short height < 500px)
  const isMobile = width < 768 || (isTouchDevice && isLandscape && height < 500 && width < 960);

  // Tablet portrait (768px..1023px)
  const isTabletPortrait = !isMobile && width >= 768 && width < 1024;

  // Tablet landscape (touch device 1024px..1280px)
  const isTabletLandscape = !isMobile && isTouchDevice && width >= 1024 && width <= 1280;

  const isTablet = isTabletPortrait || isTabletLandscape;
  const isDesktop = !isMobile && !isTablet;

  return {
    width,
    height,
    isLandscape,
    isTouchDevice,
    isCapacitorNative,
    isMobile,
    isTabletPortrait,
    isTabletLandscape,
    isTablet,
    isDesktop,
  };
}

export function useDeviceLayout(): DeviceLayoutState {
  const [layout, setLayout] = useState<DeviceLayoutState>(() => computeDeviceLayout());

  useEffect(() => {
    const handleResize = () => {
      setLayout(computeDeviceLayout());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return layout;
}
