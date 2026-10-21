import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const theme = vi.hoisted(() => ({ mode: "light" }));

vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => theme,
}));

import BrandLoading from "./index";

describe("BrandLoading", () => {
  it.each([
    ["light", "brand/shiban-wordmark.svg"],
    ["dark", "brand/shiban-wordmark-white.svg"],
  ])("shows the %s brand while loading", (mode, expectedLogo) => {
    theme.mode = mode;
    render(<BrandLoading label="Loading" />);

    expect(screen.getByRole("img", { name: "师伴" })).toHaveAttribute(
      "src",
      expect.stringContaining(expectedLogo),
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});
