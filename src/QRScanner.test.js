import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Html5Qrcode } from "html5-qrcode";
import QRScanner, { describeCameraError, isWebUrl } from "./QRScanner";

const latestScanner = () =>
  Html5Qrcode.instances[Html5Qrcode.instances.length - 1];

// Lets the scanner's queued start/stop calls finish inside act().
const flush = () => act(async () => {});

const renderScanner = async () => {
  const utils = render(<QRScanner />);
  await flush();
  return utils;
};

const scan = async (text) => {
  await act(async () => {
    latestScanner().onScanSuccess(text);
  });
  await flush();
};

beforeEach(() => {
  Html5Qrcode.instances = [];
  Html5Qrcode.startError = null;
});

describe("QRScanner", () => {
  test("starts the rear camera on mount", async () => {
    await renderScanner();

    expect(await screen.findByText(/point your camera/i)).toBeInTheDocument();
    expect(latestScanner().isScanning).toBe(true);
    expect(latestScanner().cameraConfig).toEqual({ facingMode: "environment" });
  });

  test("shows a web URL as a link and stops the camera", async () => {
    await renderScanner();
    await screen.findByText(/point your camera/i);

    await scan("https://example.com/hello");

    const link = await screen.findByRole("link", {
      name: "https://example.com/hello",
    });
    expect(link).toHaveAttribute("href", "https://example.com/hello");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await waitFor(() => expect(latestScanner().isScanning).toBe(false));
  });

  test("shows non-web results as plain text, never as a link", async () => {
    await renderScanner();
    await screen.findByText(/point your camera/i);

    await scan("javascript:alert(1)");

    expect(await screen.findByText("javascript:alert(1)")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("Scan again clears the result and restarts the camera", async () => {
    await renderScanner();
    await screen.findByText(/point your camera/i);
    await scan("hello world");

    const button = await screen.findByRole("button", { name: /scan again/i });
    await act(async () => {
      userEvent.click(button);
    });

    await screen.findByText(/point your camera/i);
    expect(screen.queryByText("hello world")).not.toBeInTheDocument();
    expect(latestScanner().isScanning).toBe(true);
  });

  test("shows an error and a start button when the camera is denied", async () => {
    Html5Qrcode.startError = "Error getting userMedia, error = NotAllowedError";
    jest.spyOn(console, "error").mockImplementation(() => {});
    await renderScanner();

    expect(await screen.findByRole("alert")).toHaveTextContent(/denied/i);
    expect(
      screen.getByRole("button", { name: /start scanning/i })
    ).toBeInTheDocument();
    console.error.mockRestore();
  });

  test("stops the camera when unmounted", async () => {
    const { unmount } = await renderScanner();
    const scanner = latestScanner();
    expect(scanner.isScanning).toBe(true);

    unmount();
    await flush();

    expect(scanner.isScanning).toBe(false);
  });
});

describe("isWebUrl", () => {
  test.each([
    ["https://example.com", true],
    ["http://example.com/path?q=1", true],
    ["javascript:alert(1)", false],
    ["data:text/html,<b>hi</b>", false],
    ["just some text", false],
    ["", false],
  ])("%s -> %s", (input, expected) => {
    expect(isWebUrl(input)).toBe(expected);
  });
});

describe("describeCameraError", () => {
  test.each([
    ["Error getting userMedia, error = NotAllowedError", /denied/i],
    [new Error("NotFoundError: no camera"), /no camera/i],
    ["NotReadableError: Device in use", /in use/i],
    ["something else", /could not start/i],
  ])("%s", (input, expected) => {
    expect(describeCameraError(input)).toMatch(expected);
  });
});
