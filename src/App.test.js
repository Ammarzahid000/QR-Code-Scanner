import { act, render, screen } from "@testing-library/react";
import App from "./App";

test("renders the scanner page", async () => {
  render(<App />);
  await act(async () => {});

  expect(
    screen.getByRole("heading", { name: /qr code scanner/i })
  ).toBeInTheDocument();
  expect(await screen.findByText(/point your camera/i)).toBeInTheDocument();
});
