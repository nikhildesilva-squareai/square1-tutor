-- Message Search & Media Gallery (Issues #14 & #15)

-- Full-text search index for messages
CREATE TABLE message_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  content_ts TSVECTOR NOT NULL, -- PostgreSQL full-text search vector
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_message_search UNIQUE(message_id)
);

CREATE INDEX idx_message_search_content ON message_search_index USING GIN(content_ts);
CREATE INDEX idx_message_search_message_id ON message_search_index(message_id);

-- Search history (track recent searches per user)
CREATE TABLE user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT DEFAULT 'all', -- 'all', 'text', 'files', 'links'
  result_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_user_community UNIQUE(user_id, community_id, query)
);

CREATE INDEX idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX idx_user_search_history_community_id ON user_search_history(community_id);
CREATE INDEX idx_user_search_history_created_at ON user_search_history(created_at DESC);

-- Media gallery view (aggregates files and links)
CREATE TABLE media_gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'file', 'link'

  -- For files (attachment_id)
  attachment_id UUID REFERENCES message_attachments(id) ON DELETE CASCADE,

  -- For links (link_preview_id)
  link_preview_id UUID REFERENCES link_previews(id) ON DELETE CASCADE,

  -- Source message
  message_id UUID NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
  posted_by_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,

  -- Metadata
  title TEXT NOT NULL, -- filename or link title
  description TEXT, -- link description
  thumbnail_url TEXT, -- thumbnail for images
  media_url TEXT NOT NULL, -- file URL or link URL
  media_type TEXT, -- image, document, video, audio, link
  file_size INT, -- in bytes, for files

  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_item_type CHECK (item_type IN ('file', 'link')),
  CONSTRAINT check_media_type CHECK (media_type IN ('image', 'document', 'video', 'audio', 'link'))
);

CREATE INDEX idx_media_gallery_community_id ON media_gallery_items(community_id);
CREATE INDEX idx_media_gallery_item_type ON media_gallery_items(item_type);
CREATE INDEX idx_media_gallery_media_type ON media_gallery_items(media_type);
CREATE INDEX idx_media_gallery_posted_by ON media_gallery_items(posted_by_id);
CREATE INDEX idx_media_gallery_posted_at ON media_gallery_items(posted_at DESC);
CREATE INDEX idx_media_gallery_attachment_id ON media_gallery_items(attachment_id);
CREATE INDEX idx_media_gallery_link_preview_id ON media_gallery_items(link_preview_id);

-- Gallery view statistics (track views/likes)
CREATE TABLE media_gallery_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id UUID NOT NULL REFERENCES media_gallery_items(id) ON DELETE CASCADE,
  viewed_by_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_gallery_view UNIQUE(gallery_item_id, viewed_by_id)
);

CREATE INDEX idx_media_gallery_views_item_id ON media_gallery_views(gallery_item_id);
CREATE INDEX idx_media_gallery_views_user_id ON media_gallery_views(viewed_by_id);

-- Update trigger for media_gallery_items
CREATE OR REPLACE FUNCTION update_media_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_gallery_update_trigger
BEFORE UPDATE ON media_gallery_items
FOR EACH ROW
EXECUTE FUNCTION update_media_gallery_updated_at();

-- Full-text search trigger for messages
CREATE OR REPLACE FUNCTION update_message_search_index()
RETURNS TRIGGER AS $$
BEGIN
  -- Create/update search index on message insert/update
  INSERT INTO message_search_index (message_id, content_ts)
  VALUES (NEW.id, to_tsvector('english', COALESCE(NEW.content, '')))
  ON CONFLICT (message_id) DO UPDATE
  SET content_ts = to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_search_index_trigger
AFTER INSERT OR UPDATE ON community_messages
FOR EACH ROW
EXECUTE FUNCTION update_message_search_index();

-- Auto-create gallery items when attachments added
CREATE OR REPLACE FUNCTION create_gallery_item_on_attachment()
RETURNS TRIGGER AS $$
DECLARE
  message_record RECORD;
  media_type_val TEXT;
BEGIN
  -- Determine media type from file type
  media_type_val := CASE
    WHEN NEW.file_type LIKE 'image/%' THEN 'image'
    WHEN NEW.file_type LIKE 'video/%' THEN 'video'
    WHEN NEW.file_type LIKE 'audio/%' THEN 'audio'
    ELSE 'document'
  END;

  -- Get message details
  SELECT m.community_id, m.posted_by_id, m.created_at
  INTO message_record
  FROM community_messages m
  WHERE m.id = NEW.message_id;

  -- Create gallery item
  INSERT INTO media_gallery_items (
    community_id, item_type, attachment_id, message_id, posted_by_id,
    title, description, thumbnail_url, media_url, media_type,
    file_size, posted_at
  ) VALUES (
    message_record.community_id,
    'file',
    NEW.id,
    NEW.message_id,
    message_record.posted_by_id,
    COALESCE(NEW.original_filename, 'Untitled file'),
    NULL,
    NEW.thumbnail_url,
    NEW.file_url,
    media_type_val,
    NEW.file_size,
    message_record.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_item_on_attachment_trigger
AFTER INSERT ON message_attachments
FOR EACH ROW
WHEN (NEW.upload_status = 'completed')
EXECUTE FUNCTION create_gallery_item_on_attachment();

-- Auto-create gallery items when links added
CREATE OR REPLACE FUNCTION create_gallery_item_on_link()
RETURNS TRIGGER AS $$
DECLARE
  message_record RECORD;
  preview_record RECORD;
BEGIN
  -- Get message details
  SELECT m.community_id, m.posted_by_id, m.created_at
  INTO message_record
  FROM community_messages m
  WHERE m.id = NEW.message_id;

  -- Get preview details if exists
  SELECT lp.* INTO preview_record
  FROM link_previews lp
  WHERE lp.id = NEW.preview_id;

  -- Create gallery item
  INSERT INTO media_gallery_items (
    community_id, item_type, link_preview_id, message_id, posted_by_id,
    title, description, thumbnail_url, media_url, media_type, posted_at
  ) VALUES (
    message_record.community_id,
    'link',
    NEW.preview_id,
    NEW.message_id,
    message_record.posted_by_id,
    COALESCE(preview_record.title, NEW.url),
    preview_record.description,
    preview_record.image_url,
    NEW.url,
    'link',
    message_record.created_at
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_item_on_link_trigger
AFTER INSERT ON message_links
FOR EACH ROW
EXECUTE FUNCTION create_gallery_item_on_link();

-- RLS Policies
ALTER TABLE message_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_gallery_views ENABLE ROW LEVEL SECURITY;

-- Public can search in public communities
CREATE POLICY "Public search in communities"
  ON message_search_index FOR SELECT
  USING (
    message_id IN (
      SELECT cm.id FROM community_messages cm
      JOIN communities c ON c.id = cm.community_id
      WHERE c.visibility = 'public'
    )
  );

-- Members can search in their communities
CREATE POLICY "Members search in communities"
  ON message_search_index FOR SELECT
  USING (
    message_id IN (
      SELECT cm.id FROM community_messages cm
      JOIN communities c ON c.id = cm.community_id
      JOIN community_members cmem ON cmem.community_id = c.id
      WHERE cmem.user_id = auth.uid()
    )
  );

-- Users can view their search history
CREATE POLICY "Users view own search history"
  ON user_search_history FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert search history
CREATE POLICY "Users insert search history"
  ON user_search_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Public gallery in public communities
CREATE POLICY "Public gallery in communities"
  ON media_gallery_items FOR SELECT
  USING (
    community_id IN (
      SELECT id FROM communities WHERE visibility = 'public'
    )
  );

-- Members gallery in communities
CREATE POLICY "Members gallery in communities"
  ON media_gallery_items FOR SELECT
  USING (
    community_id IN (
      SELECT cm.community_id FROM community_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

-- Users can view gallery views
CREATE POLICY "Users view gallery views"
  ON media_gallery_views FOR SELECT
  USING (viewed_by_id = auth.uid() OR gallery_item_id IN (
    SELECT id FROM media_gallery_items
    WHERE community_id IN (
      SELECT cm.community_id FROM community_members cm
      WHERE cm.user_id = auth.uid()
    )
  ));

-- Users can insert gallery views
CREATE POLICY "Users insert gallery views"
  ON media_gallery_views FOR INSERT
  WITH CHECK (viewed_by_id = auth.uid());
