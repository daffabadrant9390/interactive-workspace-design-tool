import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "./ui-store";

beforeEach(() => {
  localStorage.clear();
  useUiStore.setState({ theme: "dark", currency: "USD" });
  document.documentElement.removeAttribute("data-theme");
});

describe("useUiStore", () => {
  it("defaults to dark theme and USD", () => {
    const state = useUiStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.currency).toBe("USD");
  });

  it("setTheme updates the store and the <html> data-theme attribute", () => {
    useUiStore.getState().setTheme("light");
    expect(useUiStore.getState().theme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("toggleTheme flips between dark and light", () => {
    expect(useUiStore.getState().theme).toBe("dark");
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe("light");
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe("dark");
  });

  it("setCurrency switches between USD and IDR", () => {
    useUiStore.getState().setCurrency("IDR");
    expect(useUiStore.getState().currency).toBe("IDR");
    useUiStore.getState().setCurrency("USD");
    expect(useUiStore.getState().currency).toBe("USD");
  });
});
