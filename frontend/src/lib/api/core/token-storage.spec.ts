import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "./token-storage";

describe("tokenStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(tokenStorage.getToken()).toBeNull();
  });

  it("stores and retrieves a token", () => {
    tokenStorage.setToken("abc123");
    expect(tokenStorage.getToken()).toBe("abc123");
  });

  it("overwrites a previously stored token", () => {
    tokenStorage.setToken("first");
    tokenStorage.setToken("second");
    expect(tokenStorage.getToken()).toBe("second");
  });

  it("clears the stored token", () => {
    tokenStorage.setToken("abc123");
    tokenStorage.clearToken();
    expect(tokenStorage.getToken()).toBeNull();
  });
});
