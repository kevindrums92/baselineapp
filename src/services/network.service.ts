import { Network } from '@capacitor/network';
import { isNative } from '@/shared/utils/platform';

export type NetworkListener = (isOnline: boolean) => void;

/**
 * Get current network status (unified API for web + native)
 */
export async function getNetworkStatus(): Promise<boolean> {
  if (isNative()) {
    const status = await Network.getStatus();
    return status.connected;
  }
  return navigator.onLine;
}

/**
 * Add network change listener (unified API for web + native)
 */
export function addNetworkListener(callback: NetworkListener): () => void {
  if (isNative()) {
    // Native: Use Capacitor Network plugin
    let listenerHandle: any = null;

    Network.addListener('networkStatusChange', (status) => {
      callback(status.connected);
    }).then((handle) => {
      listenerHandle = handle;
    });

    // Return cleanup function
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  } else {
    // Web: Use browser events
    const onOnline = () => callback(true);
    const onOffline = () => callback(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
}
