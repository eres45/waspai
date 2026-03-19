import { vi } from "vitest";

// Set dummy env vars for Supabase to prevent initialization errors
process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";

// Mock Supabase Server globally to prevent environment variable errors during tests
vi.mock("@/lib/supabase-server", () => ({
  supabaseServer: new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === "from") {
          return vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            onConflictDoUpdate: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: "mock-id" }]),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
          });
        }
        return vi.fn();
      },
    },
  ),
}));

// Mock server-only to prevent errors in non-next environments
vi.mock("server-only", () => ({}));
