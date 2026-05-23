-- 1. Alter Listings Table to support campus location scoping
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'Aligarh Muslim University';

-- 2. Create Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id, seller_id)
);

-- 3. Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies

-- Conversations RLS
CREATE POLICY "Users can view conversations they are part of"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can initiate conversations they are part of"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages RLS
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT buyer_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT seller_id FROM conversations WHERE id = conversation_id
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT buyer_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT seller_id FROM conversations WHERE id = conversation_id
    )
  );

-- 6. Triggers for Automatic Timestamps

-- Trigger to update updated_at on conversations updates
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to update parent conversation's updated_at on a new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message_update_conversation
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();
