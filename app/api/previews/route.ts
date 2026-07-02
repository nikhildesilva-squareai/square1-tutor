import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/previews
 * Fetch link preview metadata (title, description, image, favicon)
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check if preview already cached
    const { data: cached } = await supabase
      .from("link_previews")
      .select("*")
      .eq("url", url)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({
        preview: cached,
        cached: true,
      });
    }

    // Fetch URL and extract metadata
    let preview = {
      url,
      title: null as string | null,
      description: null as string | null,
      image_url: null as string | null,
      image_alt: null as string | null,
      favicon_url: null as string | null,
      domain: new URL(url).hostname,
      og_type: "website",
      og_locale: "en_US",
    };

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Square1AI-LinkPreview/1.0",
        },
        timeout: 5000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Extract Open Graph and meta tags
      const titleMatch = html.match(/<meta property="og:title"\s+content="([^"]+)"/);
      const descMatch = html.match(/<meta property="og:description"\s+content="([^"]+)"/);
      const imageMatch = html.match(/<meta property="og:image"\s+content="([^"]+)"/);
      const imageAltMatch = html.match(/<meta property="og:image:alt"\s+content="([^"]+)"/);
      const typeMatch = html.match(/<meta property="og:type"\s+content="([^"]+)"/);
      const localeMatch = html.match(/<meta property="og:locale"\s+content="([^"]+)"/);
      const faviconMatch = html.match(/<link\s+rel="icon"\s+href="([^"]+)"/);
      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/);

      preview.title = titleMatch?.[1] || titleTagMatch?.[1] || null;
      preview.description = descMatch?.[1] || null;
      preview.image_url = imageMatch?.[1] || null;
      preview.image_alt = imageAltMatch?.[1] || null;
      preview.favicon_url = faviconMatch?.[1] || null;
      preview.og_type = typeMatch?.[1] || "website";
      preview.og_locale = localeMatch?.[1] || "en_US";
    } catch (error) {
      console.error("Error fetching preview:", error);
      // Store failed fetch attempt
      const { error: insertError } = await supabase
        .from("link_previews")
        .insert({
          ...preview,
          failed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error caching failed preview:", insertError);
      }

      return NextResponse.json({
        preview: null,
        error: "Could not fetch preview",
      });
    }

    // Cache preview in database
    const { data: cached_preview, error: insertError } = await supabase
      .from("link_previews")
      .insert(preview)
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("Error caching preview:", insertError);
    }

    return NextResponse.json({
      preview: cached_preview || preview,
      cached: false,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/previews?url=https://example.com
 * Get cached link preview (or fetch if not cached)
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL query parameter required" },
        { status: 400 }
      );
    }

    // Check cache
    const { data: cached } = await supabase
      .from("link_previews")
      .select("*")
      .eq("url", url)
      .maybeSingle();

    if (cached) {
      return NextResponse.json({
        preview: cached,
        cached: true,
      });
    }

    // Fetch if not cached
    const fetchResponse = await fetch(new URL(req.url).origin + "/api/previews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await fetchResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
