# QR Code Scanner

A small web app that scans QR codes with your device's camera, right in the browser. Built with [React](https://react.dev/) and [html5-qrcode](https://github.com/mebjas/html5-qrcode).

## Features

- Starts the rear camera automatically and stops it after a successful scan.
- Shows web addresses (`http` and `https`) as clickable links that open in a new tab.
- Shows any other result, including `javascript:` URLs, as plain text so it can't be clicked by accident.
- **Copy** button for the scanned text and a **Scan again** button for the next code.
- Clear messages when the camera is blocked, missing or already in use.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- A device with a camera

### Install and run

```bash
git clone https://github.com/zuni-developer/QR-Code-Scanner.git
cd QR-Code-Scanner
npm install
npm start
```

Then open <http://localhost:3000> and allow camera access when the browser asks.

> **Camera access needs a secure context.** Browsers only allow it on `https://` pages or on `localhost`. If you deploy the app, serve it over HTTPS.

### Scripts

| Command         | What it does                                       |
| --------------- | -------------------------------------------------- |
| `npm start`     | Runs the app in development mode on port 3000      |
| `npm test`      | Runs the tests in watch mode                       |
| `npm run build` | Creates an optimised production build in `build/`  |

## How it works

`QRScanner.js` creates one `Html5Qrcode` instance and runs all start and stop calls through a queue so they never overlap. That keeps the camera from being left on, including under React's StrictMode double mount in development. The tests mock `html5-qrcode`, so they run without a camera.
