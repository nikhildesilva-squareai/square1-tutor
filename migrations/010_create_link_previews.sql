-- Link Preview Cache (for sharing link metadata)
CREATE TABLE link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  image_alt TEXT DEFAULT NULL,
  favicon_url TEXT DEFAULT NULL,
  domain TEXT NOT NULL,
  og_type TEXT DEFAULT 'website', -- 'website', 'article', 'video', 'image'
  og_locale TEXT DEFAULT 'en_US',
  failed_at TIMESTAMPTZ DEFAULT NULL, -- Track failed preview fetches
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_og_type CHECK (og_type IN ('website', 'article', 'video', 'image'))
);

CREATE INDEX idx_link_previews_url ON link_previews(url);
CREATE INDEX idx_link_previews_domain ON link_previews(domain);
CREATE INDEX idx_link_previews_created_at ON link_previews(created_at DESC);

-- Message Links (track which URLs are in which messages)
CREATE TABLE message_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  preview_id UUID REFERENCES link_previews(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_message_link UNIQUE(message_id, url)
);

CREATE INDEX idx_message_links_message_id ON message_links(message_id);
CREATE INDEX idx_message_links_preview_id ON message_links(preview_id);

-- Update trigger for link previews
CREATE OR REPLACE FUNCTION update_link_previews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER link_previews_update_trigger
BEFORE UPDATE ON link_previews
FOR EACH ROW
EXECUTE FUNCTION update_link_previews_updated_at();

-- File Upload Metadata (beyond message_attachments)
ALTER TABLE message_attachments ADD COLUMN IF NOT EXISTS
  upload_status TEXT DEFAULT 'completed', -- 'uploading', 'completed', 'failed'
ADD COLUMN IF NOT EXISTS
  thumbnail_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS
  original_filename TEXT DEFAULT NULL;

CREATE INDEX idx_message_attachments_upload_status ON message_attachments(upload_status) WHERE upload_status != 'completed';

-- RLS Policies
ALTER TABLE link_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_links ENABLE ROW LEVEL SECURITY;

-- Public can view link previews
CREATE POLICY "Public view link previews"
  ON link_previews FOR SELECT
  USING (true);

-- Service role can manage previews
CREATE POLICY "Service role manages previews"
  ON link_previews FOR ALL
  USING (auth.role() = 'service_role');

-- Public can view message links
CREATE POLICY "Public view message links"
  ON message_links FOR SELECT
  USING (true);

-- Service role can manage message links
CREATE POLICY "Service role manages message links"
  ON message_links FOR ALL
  USING (auth.role() = 'service_role');
