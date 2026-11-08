// Samsung Smart TV Tizen Platform Adapter for MasterTV
// Registers Tizen remote control keys and normalizes TV keydown events
// Strictly ASCII comments only as per project guidelines

export const TIZEN_KEYS = {
  RETURN: 10009,
  ENTER: 13,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  PLAY: 415,
  PAUSE: 19,
  PLAY_PAUSE: 10252,
  STOP: 413,
  FAST_FORWARD: 417,
  REWIND: 412,
  CHANNEL_UP: 427,
  CHANNEL_DOWN: 428,
  RED: 403,
  GREEN: 404,
  YELLOW: 405,
  BLUE: 406,
  VOLUME_UP: 447,
  VOLUME_DOWN: 448,
  VOLUME_MUTE: 449,
};

// Check if running inside Samsung Smart TV Tizen environment
export function isSamsungTizenTV(): boolean {
  if (typeof window === 'undefined') return false;
  const isTizenObject = Boolean((window as unknown as { tizen?: unknown }).tizen);
  const isUserAgent = /Tizen|SmartTV|Samsung/i.test(navigator.userAgent);
  return isTizenObject || isUserAgent;
}

// Register Samsung Smart TV remote control keys
export function initTizenRemoteKeys(): void {
  if (typeof window === 'undefined') return;

  try {
    const tizenObj = (window as unknown as { tizen?: { tvinputdevice?: { registerKey: (k: string) => void } } }).tizen;
    if (tizenObj && tizenObj.tvinputdevice) {
      const keysToRegister = [
        'MediaPlayPause',
        'MediaPlay',
        'MediaPause',
        'MediaStop',
        'MediaFastForward',
        'MediaRewind',
        'ColorF0Red',
        'ColorF1Green',
        'ColorF2Yellow',
        'ColorF3Blue',
        'ChannelUp',
        'ChannelDown',
        'VolumeUp',
        'VolumeDown',
        'VolumeMute',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      ];

      keysToRegister.forEach((keyName) => {
        try {
          tizenObj.tvinputdevice?.registerKey(keyName);
        } catch {
          // Ignore unsupported key registrations
        }
      });
    }
  } catch {
    // Non-Tizen environment safe fallback
  }

  // Global handler for Tizen Return (Back) key (code 10009)
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.keyCode === TIZEN_KEYS.RETURN || e.key === 'XF86Back') {
      // Dispatch a synthetic 'tizen-back' event for open components to handle
      const backEvt = new CustomEvent('tizen-back', { cancelable: true });
      const wasPrevented = !window.dispatchEvent(backEvt);

      // If an active modal or player handled the event, stop default behavior
      if (wasPrevented || e.defaultPrevented) {
        e.preventDefault();
        return;
      }

      // If at top level and back is pressed again, prompt or cleanly exit app
      try {
        const tizenApp = (window as unknown as { tizen?: { application?: { getCurrentApplication: () => { exit: () => void } } } }).tizen;
        if (tizenApp?.application) {
          e.preventDefault();
          tizenApp.application.getCurrentApplication().exit();
        }
      } catch {
        // Fallback
      }
    }
  });
}

