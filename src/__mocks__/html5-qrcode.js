// Manual mock so tests never touch a real camera.
export const Html5QrcodeScannerState = {
  UNKNOWN: 0,
  NOT_STARTED: 1,
  SCANNING: 2,
  PAUSED: 3,
};

export class Html5Qrcode {
  static instances = [];
  static startError = null;

  constructor(elementId) {
    this.elementId = elementId;
    this.isScanning = false;
    this.onScanSuccess = null;
    Html5Qrcode.instances.push(this);
  }

  getState() {
    return this.isScanning
      ? Html5QrcodeScannerState.SCANNING
      : Html5QrcodeScannerState.NOT_STARTED;
  }

  async start(cameraConfig, scanConfig, onScanSuccess) {
    if (Html5Qrcode.startError) throw Html5Qrcode.startError;
    this.cameraConfig = cameraConfig;
    this.onScanSuccess = onScanSuccess;
    this.isScanning = true;
  }

  async stop() {
    this.isScanning = false;
  }

  clear() {}
}
