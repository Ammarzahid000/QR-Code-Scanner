import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const qrCodeScannerRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    qrCodeScannerRef.current = html5QrCode;

    const startScanner = () => {
      if (isScannerRunning) return; // Prevent starting if already running

      // Start scanning the QR code
      html5QrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScanResult(decodedText);
            stopScanner(); // Stop scanner after successful scan
          },
          (error) => {
            // Stop logging errors continuously
            if (errorTimeoutRef.current) {
              clearTimeout(errorTimeoutRef.current); // Clear previous timeout
            }

            errorTimeoutRef.current = setTimeout(() => {
              console.warn("QR code scanning error", error);
            }, 2000); // Log error every 2 seconds if it persists
          }
        )
        .then(() => {
          setIsScannerRunning(true); // Update state after starting
        })
        .catch((err) => {
          console.error("Error starting QR code scanner", err);
        });
    };

    const stopScanner = () => {
      if (!isScannerRunning) return; // Prevent stopping if not running

      html5QrCode
        .stop()
        .then(() => {
          setIsScannerRunning(false); // Update state after stopping
          console.log("Scanner stopped");
        })
        .catch((err) => {
          console.error("Error stopping QR code scanner", err);
        });
    };

    startScanner();

    // Cleanup function to stop the scanner on unmount
    return () => {
      stopScanner();
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.clear(); // Clear the scanner
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current); // Clear any existing error timeout
      }
    };
  }, [isScannerRunning]); // Dependency array to avoid multiple starts

  return (
    <div>
      <h1>QR Code Scanner</h1>
      <div id="qr-reader" style={{ width: "300px", height: "300px" }}></div>
      {scanResult && (
        <div>
          <h2>Scanned Result</h2>
          <a href={scanResult} target="_blank" rel="noopener noreferrer">
            {scanResult}
          </a>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
