import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

const READER_ID = "qr-reader";

const SCAN_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
};

// scanner.isScanning is set late (after the first video frame), so use the
// library's state instead to know whether the camera is running.
const isRunning = (scanner) => {
  const state = scanner.getState();
  return (
    state === Html5QrcodeScannerState.SCANNING ||
    state === Html5QrcodeScannerState.PAUSED
  );
};

const waitUntil = async (condition, timeoutMs = 3000) => {
  const deadline = Date.now() + timeoutMs;
  while (!condition() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
};

// Only http(s) results are rendered as links. Anything else (for example a
// "javascript:" URL) is shown as plain text so it can't be clicked by accident.
export const isWebUrl = (text) => {
  try {
    const { protocol } = new URL(text);
    return protocol === "http:" || protocol === "https:";
  } catch (e) {
    return false;
  }
};

// html5-qrcode rejects with plain strings as well as Error objects.
export const describeCameraError = (err) => {
  const message = typeof err === "string" ? err : (err && err.message) || "";

  if (/NotAllowed|Permission/i.test(message)) {
    return "Camera access was denied. Allow camera permission in your browser and try again.";
  }
  if (/NotFound|no camera/i.test(message)) {
    return "No camera was found on this device.";
  }
  if (/NotReadable|in use/i.test(message)) {
    return "The camera is already in use by another app or tab.";
  }
  return "Could not start the camera. Camera access requires HTTPS or localhost.";
};

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | starting | scanning
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const scannerRef = useRef(null);
  // Start and stop calls are chained so they never overlap. This also keeps
  // React StrictMode's mount, unmount, mount cycle in development safe.
  const queueRef = useRef(Promise.resolve());

  const enqueue = useCallback((task) => {
    queueRef.current = queueRef.current.then(task);
    return queueRef.current;
  }, []);

  const getScanner = () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(READER_ID);
    }
    return scannerRef.current;
  };

  const stopScanner = useCallback(
    () =>
      enqueue(async () => {
        const scanner = scannerRef.current;
        if (!scanner || !isRunning(scanner)) return;
        try {
          await scanner.stop();
        } catch (err) {
          console.error("Error stopping QR code scanner", err);
        }
        setStatus("idle");
      }),
    [enqueue]
  );

  const startScanner = useCallback(() => {
    setScanResult(null);
    setError(null);
    setCopied(false);
    setStatus("starting");

    return enqueue(async () => {
      const scanner = getScanner();
      if (isRunning(scanner)) {
        setStatus("scanning");
        return;
      }
      try {
        await scanner.start(
          { facingMode: "environment" },
          SCAN_CONFIG,
          (decodedText) => {
            setScanResult(decodedText);
            stopScanner();
          },
          () => {
            // Called for every frame without a QR code, which is normal.
          }
        );
        // start() can resolve before the viewfinder is drawn. Stopping at that
        // point makes the library throw, so wait until it is ready.
        await waitUntil(() => scanner.isScanning);
        setStatus("scanning");
      } catch (err) {
        console.error("Error starting QR code scanner", err);
        setError(describeCameraError(err));
        setStatus("idle");
      }
    });
  }, [enqueue, stopScanner]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(scanResult);
      setCopied(true);
    } catch (err) {
      console.error("Could not copy to clipboard", err);
    }
  };

  const showCamera = status === "starting" || status === "scanning";

  return (
    <div className="scanner">
      <h1>QR Code Scanner</h1>

      <div
        id={READER_ID}
        className="scanner__reader"
        style={{ display: showCamera ? "block" : "none" }}
      ></div>

      {status === "starting" && <p>Starting camera…</p>}
      {status === "scanning" && <p>Point your camera at a QR code.</p>}

      {error && (
        <p className="scanner__error" role="alert">
          {error}
        </p>
      )}

      {scanResult && (
        <div className="scanner__result">
          <h2>Scanned Result</h2>
          {isWebUrl(scanResult) ? (
            <a href={scanResult} target="_blank" rel="noopener noreferrer">
              {scanResult}
            </a>
          ) : (
            <p className="scanner__text">{scanResult}</p>
          )}
          <div className="scanner__actions">
            <button type="button" onClick={copyResult}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {!showCamera && (
        <button type="button" onClick={startScanner}>
          {scanResult ? "Scan again" : "Start scanning"}
        </button>
      )}
    </div>
  );
};

export default QRScanner;
