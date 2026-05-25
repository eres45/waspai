import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { siteRepository } from "lib/db/repository";
import { z } from "zod";
import { nanoid } from "nanoid";

const RESERVED_SLUGS = new Set([
  "www",
  "admin",
  "api",
  "site",
  "status",
  "landing",
  "auth",
  "main",
  "dev",
  "prod",
  "staging",
  "test",
  "mail",
  "blog",
  "ping",
]);

const DeploySchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(300, "Description is too long").optional(),
  html: z.string().optional(),
  slug: z
    .string()
    .max(50, "Slug is too long")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .optional(),
  projectId: z.string().uuid().optional(),
  files: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string(),
      }),
    )
    .optional(),
});

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || "site"}-${randomSuffix}`;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check site size limit (2MB for rawHtml or combined file content)
    const rawHtml = body.html || "";
    let totalBytes = Buffer.byteLength(rawHtml, "utf-8");
    if (body.files && Array.isArray(body.files)) {
      totalBytes = body.files.reduce((acc: number, f: any) => {
        return acc + Buffer.byteLength(f.content || "", "utf-8");
      }, 0);
    }

    if (totalBytes > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Site payload exceeds the 2MB limit" },
        { status: 400 },
      );
    }

    const data = DeploySchema.parse(body);

    let slug = data.slug;
    if (slug) {
      if (RESERVED_SLUGS.has(slug)) {
        return NextResponse.json(
          {
            error: `The subdomain "${slug}" is reserved. Please choose a different name.`,
          },
          { status: 400 },
        );
      }

      // Check collision
      const existing = await siteRepository.getSiteBySlug(slug);
      if (existing && existing.authorId !== session.user.id) {
        return NextResponse.json(
          {
            error: `The subdomain "${slug}" is already taken by another user.`,
          },
          { status: 409 },
        );
      }
    } else {
      // Auto-generate slug
      let attempts = 0;
      while (attempts < 5) {
        slug = generateSlug(data.title);
        const existing = await siteRepository.getSiteBySlug(slug);
        if (!existing) break;
        attempts++;
      }
      if (!slug) {
        slug = `site-${nanoid(6).toLowerCase()}`;
      }
    }

    // Double check reserved check on generated slugs just in case
    if (RESERVED_SLUGS.has(slug)) {
      slug = `${slug}-${nanoid(4).toLowerCase()}`;
    }

    const defaultHtml =
      data.html ||
      data.files?.find(
        (f) => f.path === "index.html" || f.path === "/index.html",
      )?.content ||
      "";

    // Deploy main site record
    const deployedSite = await siteRepository.createSite({
      slug,
      title: data.title,
      description: data.description,
      htmlContent: defaultHtml,
      authorId: session.user.id,
      projectId: data.projectId,
    });

    // Deploy associated site files
    if (data.files && data.files.length > 0) {
      await siteRepository.upsertSiteFiles(deployedSite.id, data.files);
    } else {
      // Default fallback
      await siteRepository.upsertSiteFiles(deployedSite.id, [
        { path: "index.html", content: defaultHtml },
      ]);
    }

    const host = request.headers.get("host") ?? "waspai.in";
    // Construct the live URL. If we are running in dev, use the localhost suffix.
    const baseDomain = host.includes("localhost")
      ? "localhost:3000"
      : "waspai.in";
    const liveUrl = `https://${slug}.${baseDomain}`;

    return NextResponse.json(
      {
        id: deployedSite.id,
        slug: deployedSite.slug,
        url: liveUrl,
        title: deployedSite.title,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.issues },
        { status: 400 },
      );
    }
    console.error("[Deploy Site API] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
