import { createClient } from "@/lib/supabase/server";
import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

interface ModerationResult {
  flagged: boolean;
  confidence: number;
  reason: "spam" | "harassment" | "misinformation" | "offtopic" | "other" | null;
  explanation: string;
}

/**
 * Analyze a message for policy violations using Claude
 * Returns moderation verdict with confidence score
 */
export async function analyzeMessageWithClaude(
  messageContent: string
): Promise<ModerationResult> {
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 500,
      system: `You are a content moderation assistant. Analyze the given message for policy violations.

Classify violations into these categories:
- spam: Commercial spam, promotional content, link farming
- harassment: Bullying, insults, personal attacks, threats
- misinformation: False claims, conspiracy theories, misleading information
- offtopic: Content unrelated to the community's purpose
- other: Other policy violations

Respond with JSON only:
{
  "flagged": boolean,
  "confidence": number (0-1),
  "reason": "spam" | "harassment" | "misinformation" | "offtopic" | "other" | null,
  "explanation": "brief explanation"
}`,
      messages: [
        {
          role: "user",
          content: `Moderate this message:\n\n${messageContent}`,
        },
      ],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Claude response");
    }

    const result = JSON.parse(jsonMatch[0]) as ModerationResult;
    return result;
  } catch (error) {
    console.error("Error analyzing message with Claude:", error);
    // Default to no flag on error to avoid false positives
    return {
      flagged: false,
      confidence: 0,
      reason: null,
      explanation: "Analysis failed",
    };
  }
}

/**
 * Create a moderation flag for a message
 */
export async function createModerationFlag(
  communityId: string,
  messageId: string,
  authorId: string,
  flagReason: string,
  aiConfidence?: number,
  aiExplanation?: string,
  flaggedByUserId?: string
) {
  const supabase = await createClient();

  const { error } = await supabase.from("moderation_flags").insert({
    community_id: communityId,
    message_id: messageId,
    author_id: authorId,
    flag_reason: flagReason,
    ai_confidence: aiConfidence,
    ai_explanation: aiExplanation,
    flagged_by_user_id: flaggedByUserId,
    status: "pending",
  });

  if (error) {
    console.error("Error creating moderation flag:", error);
    throw error;
  }
}

/**
 * Auto-moderate a new message
 * Analyzes with Claude and creates flag if needed
 */
export async function autoModerateMessage(
  communityId: string,
  messageId: string,
  messageContent: string,
  authorId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get moderation settings for community
  const { data: settings } = await supabase
    .from("community_moderation_settings")
    .select("auto_flag_enabled, auto_delete_on_confidence, banned_user_ids, banned_keywords")
    .eq("community_id", communityId)
    .maybeSingle();

  if (!settings?.auto_flag_enabled) {
    return false; // Auto-moderation disabled
  }

  // Check banned keywords
  if (settings.banned_keywords?.length > 0) {
    const hasBannedKeyword = settings.banned_keywords.some((keyword: string) =>
      messageContent.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasBannedKeyword) {
      await createModerationFlag(
        communityId,
        messageId,
        authorId,
        "spam",
        1.0,
        "Contains banned keyword"
      );
      return true;
    }
  }

  // Analyze with Claude
  const analysis = await analyzeMessageWithClaude(messageContent);

  if (analysis.flagged) {
    const shouldAutoDelete =
      settings.auto_delete_on_confidence &&
      analysis.confidence >= settings.auto_delete_on_confidence;

    await createModerationFlag(
      communityId,
      messageId,
      authorId,
      analysis.reason || "other",
      analysis.confidence,
      analysis.explanation
    );

    // Auto-delete if confidence threshold exceeded
    if (shouldAutoDelete) {
      const { error: deleteError } = await supabase
        .from("community_messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId);

      if (deleteError) {
        console.error("Error auto-deleting message:", deleteError);
      }

      return true;
    }
  }

  return false;
}

/**
 * Get pending flags for a community
 */
export async function getPendingFlags(
  communityId: string,
  limit: number = 50,
  offset: number = 0
) {
  const supabase = await createClient();

  const { data: flags, error, count } = await supabase
    .from("moderation_flags")
    .select(
      `
      id,
      message_id,
      author_id,
      flag_reason,
      ai_confidence,
      ai_explanation,
      status,
      created_at,
      community_messages(id, content, created_at),
      community_profiles!author_id(id, avatar_url, bio)
    `,
      { count: "exact" }
    )
    .eq("community_id", communityId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching pending flags:", error);
    throw error;
  }

  return { flags, count };
}

/**
 * Review a moderation flag
 */
export async function reviewFlag(
  flagId: string,
  reviewerProfileId: string,
  action: "approved" | "deleted" | "warned_author" | "dismissed",
  notes?: string
) {
  const supabase = await createClient();

  // Get flag details
  const { data: flag, error: fetchError } = await supabase
    .from("moderation_flags")
    .select("message_id, community_id")
    .eq("id", flagId)
    .maybeSingle();

  if (fetchError || !flag) {
    throw new Error("Flag not found");
  }

  // Update flag
  const { error: updateError } = await supabase
    .from("moderation_flags")
    .update({
      status: "reviewed",
      reviewer_id: reviewerProfileId,
      reviewer_action: action,
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", flagId);

  if (updateError) {
    throw updateError;
  }

  // If deleted, soft-delete the message
  if (action === "deleted") {
    const { error: messageError } = await supabase
      .from("community_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", flag.message_id);

    if (messageError) {
      console.error("Error deleting message:", messageError);
    }
  }

  // Log activity
  await supabase.from("moderation_activity_log").insert({
    community_id: flag.community_id,
    flag_id: flagId,
    actor_id: reviewerProfileId,
    action: "reviewed",
    details: { reviewer_action: action },
  });
}

/**
 * Escalate a flag to Square 1 admins
 */
export async function escalateFlag(
  flagId: string,
  reviewerProfileId: string,
  reason?: string
) {
  const supabase = await createClient();

  const { data: flag } = await supabase
    .from("moderation_flags")
    .select("community_id")
    .eq("id", flagId)
    .maybeSingle();

  if (!flag) {
    throw new Error("Flag not found");
  }

  const { error } = await supabase
    .from("moderation_flags")
    .update({
      escalated_to_square1: true,
      escalated_at: new Date().toISOString(),
    })
    .eq("id", flagId);

  if (error) {
    throw error;
  }

  await supabase.from("moderation_activity_log").insert({
    community_id: flag.community_id,
    flag_id: flagId,
    actor_id: reviewerProfileId,
    action: "escalated",
    details: { reason },
  });
}
