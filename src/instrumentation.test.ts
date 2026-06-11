import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { onRequestError } from "./instrumentation";

// Mock the error-repository.rest module
const insertErrorMock = vi.fn();
vi.mock("./lib/db/pg/repositories/error-repository.rest", () => ({
  errorRepositoryRest: {
    insertError: (...args: any[]) => insertErrorMock(...args),
  },
}));

describe("instrumentation - onRequestError", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    insertErrorMock.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should not log error if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const error = new Error("Test error");
    const request = { path: "/test", method: "GET", headers: new Headers() };
    const context = { routerKind: "app" as const, routeType: "route" as const };

    await onRequestError(error, request, context);

    expect(insertErrorMock).not.toHaveBeenCalled();
  });

  it("should log error if Supabase credentials are provided", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const error = new Error("Database issue");
    error.stack = "Error stack trace";
    const request = {
      path: "/api/chat",
      method: "POST",
      headers: new Headers(),
    };
    const context = { routerKind: "app" as const, routeType: "route" as const };

    await onRequestError(error, request, context);

    expect(insertErrorMock).toHaveBeenCalledWith({
      errorName: "Error",
      errorMessage: "Database issue",
      errorStack: "Error stack trace",
      path: "/api/chat",
      method: "POST",
      statusCode: 500,
      metadata: {
        routerKind: "app",
        routeType: "route",
        digest: null,
      },
    });
  });

  it("should handle error status/statusCode if present on error object", async () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

    const error = new Error("Not Found") as any;
    error.status = 404;
    const request = {
      path: "/not-found",
      method: "GET",
      headers: new Headers(),
    };
    const context = {
      routerKind: "app" as const,
      routeType: "render" as const,
    };

    await onRequestError(error, request, context);

    expect(insertErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
      }),
    );
  });
});
