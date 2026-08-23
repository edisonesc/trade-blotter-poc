import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStorage } from "./token-storage";

vi.mock("./token-storage", () => ({
  tokenStorage: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "Error",
    json: () => Promise.resolve(body),
  } as Response;
}

describe("api client request()", () => {
  let ApiError: typeof import("./client").ApiError;
  let request: typeof import("./client").request;
  let setUnauthorizedHandler: typeof import("./client").setUnauthorizedHandler;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    ({ ApiError, request, setUnauthorizedHandler } = await import("./client"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("omits the Authorization header when there is no token", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { ok: true }));

    await request("/ping");

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect((options?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("adds a Bearer Authorization header when a token is present", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue("token-123");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { ok: true }));

    await request("/ping");

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect((options?.headers as Record<string, string>).Authorization).toBe(
      "Bearer token-123",
    );
  });

  it("returns the parsed JSON body on success", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { foo: "bar" }));

    await expect(request("/thing")).resolves.toEqual({ foo: "bar" });
  });

  it("returns undefined for a 204 No Content response", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue(jsonResponse(204, null));

    await expect(request("/thing")).resolves.toBeUndefined();
  });

  it("throws an ApiError with a joined message when body.message is an array", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(400, { message: ["field is required", "field2 is required"] }),
    );

    await expect(request("/thing")).rejects.toMatchObject({
      status: 400,
      message: "field is required, field2 is required",
    });
  });

  it("throws an ApiError with the raw message when body.message is a string", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue(jsonResponse(404, { message: "not found" }));

    await expect(request("/thing")).rejects.toMatchObject({
      status: 404,
      message: "not found",
    });
  });

  it("falls back to statusText when the error body has no message", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, {}));

    await expect(request("/thing")).rejects.toMatchObject({
      status: 500,
      message: "Error",
    });
  });

  it("falls back to statusText when the error body cannot be parsed as JSON", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Error",
      json: () => Promise.reject(new Error("invalid json")),
    } as Response);

    await expect(request("/thing")).rejects.toMatchObject({
      status: 500,
      message: "Error",
    });
  });

  it("triggers the unauthorized handler on a 401 when a token was sent", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue("token-123");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: "unauthorized" }));

    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(request("/thing")).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not trigger the unauthorized handler on a 401 when no token was sent", async () => {
    vi.mocked(tokenStorage.getToken).mockReturnValue(null);
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { message: "unauthorized" }));

    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(request("/thing")).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });
});
