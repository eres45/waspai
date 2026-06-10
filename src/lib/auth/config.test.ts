import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAuthConfig } from "./config";

// Mock experimental_taintUniqueValue since it's not available in test environment
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    experimental_taintUniqueValue: vi.fn(),
  };
});

let originalEnv: Record<string, string | undefined>;
describe("Auth Config", () => {
  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.unstubAllEnvs();

    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_FORCE_ACCOUNT_SELECTION;
    delete process.env.MICROSOFT_CLIENT_ID;
    delete process.env.MICROSOFT_CLIENT_SECRET;
    delete process.env.MICROSOFT_TENANT_ID;
    delete process.env.MICROSOFT_FORCE_ACCOUNT_SELECTION;
    delete process.env.DISABLE_EMAIL_SIGN_IN;
    delete process.env.DISABLE_SIGN_UP;
  });

  afterEach(() => {
    process.env = { ...originalEnv } as any;
    vi.unstubAllEnvs();
  });

  describe("getAuthConfig", () => {
    it("should return default config when no environment variables are set", () => {
      const config = getAuthConfig();

      expect(config).toEqual({
        emailAndPasswordEnabled: false,
        signUpEnabled: false,
        socialAuthenticationProviders: {
          github: undefined,
          google: undefined,
        },
      });
    });

    it("should always have emailAndPasswordEnabled and signUpEnabled as false", () => {
      vi.stubEnv("DISABLE_EMAIL_SIGN_IN", "0");
      vi.stubEnv("DISABLE_SIGN_UP", "0");

      const config = getAuthConfig();
      expect(config.emailAndPasswordEnabled).toBe(false);
      expect(config.signUpEnabled).toBe(false);
    });

    it("should include GitHub config when credentials are provided", () => {
      vi.stubEnv("GITHUB_CLIENT_ID", "github-client-id");
      vi.stubEnv("GITHUB_CLIENT_SECRET", "github-client-secret");

      const config = getAuthConfig();
      expect(config.socialAuthenticationProviders.github).toEqual({
        clientId: "github-client-id",
        clientSecret: "github-client-secret",
        disableSignUp: false,
      });
    });

    it("should include Google config when credentials are provided", () => {
      vi.stubEnv("GOOGLE_CLIENT_ID", "google-client-id");
      vi.stubEnv("GOOGLE_CLIENT_SECRET", "google-client-secret");
      vi.stubEnv("GOOGLE_FORCE_ACCOUNT_SELECTION", "true");

      const config = getAuthConfig();
      expect(config.socialAuthenticationProviders.google).toEqual({
        clientId: "google-client-id",
        clientSecret: "google-client-secret",
        prompt: "select_account",
        disableSignUp: false,
      });
    });

    it("should filter out Microsoft config even if credentials are provided", () => {
      vi.stubEnv("GITHUB_CLIENT_ID", "github-client-id");
      vi.stubEnv("GITHUB_CLIENT_SECRET", "github-client-secret");
      vi.stubEnv("MICROSOFT_CLIENT_ID", "microsoft-client-id");
      vi.stubEnv("MICROSOFT_CLIENT_SECRET", "microsoft-client-secret");

      const config = getAuthConfig();
      expect(config.socialAuthenticationProviders.github).toBeDefined();
      expect(
        (config.socialAuthenticationProviders as any).microsoft,
      ).toBeUndefined();
    });
  });
});
