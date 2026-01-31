-- Fix SkillTopic.id type mismatch: change from text to uuid
-- This migration fixes the foreign key constraint issue where SkillTopic.id was text
-- but foreign keys were expecting uuid type.

-- Step 1: Drop all foreign key constraints that reference SkillTopic.id
ALTER TABLE "SkillItem" DROP CONSTRAINT IF EXISTS "SkillItem_skillTopicId_fkey";
ALTER TABLE "SkillTopicMarketValue" DROP CONSTRAINT IF EXISTS "SkillTopicMarketValue_skillTopicId_fkey";
ALTER TABLE "SkillTopicPivot" DROP CONSTRAINT IF EXISTS "SkillTopicPivot_fromTopicId_fkey";
ALTER TABLE "SkillTopicPivot" DROP CONSTRAINT IF EXISTS "SkillTopicPivot_toTopicId_fkey";
ALTER TABLE "BrandNarrative" DROP CONSTRAINT IF EXISTS "BrandNarrative_skillTopicId_fkey";

-- Step 2: Convert SkillTopic.id from text to uuid
-- This assumes existing IDs are valid UUIDs stored as text
-- If there are any invalid UUIDs, this will fail and need manual cleanup first
ALTER TABLE "SkillTopic" 
  ALTER COLUMN "id" TYPE uuid USING "id"::uuid;

-- Step 3: Recreate all foreign key constraints
ALTER TABLE "SkillItem" 
  ADD CONSTRAINT "SkillItem_skillTopicId_fkey" 
  FOREIGN KEY ("skillTopicId") 
  REFERENCES "SkillTopic"("id") 
  ON DELETE CASCADE;

ALTER TABLE "SkillTopicMarketValue" 
  ADD CONSTRAINT "SkillTopicMarketValue_skillTopicId_fkey" 
  FOREIGN KEY ("skillTopicId") 
  REFERENCES "SkillTopic"("id") 
  ON DELETE CASCADE;

ALTER TABLE "SkillTopicPivot" 
  ADD CONSTRAINT "SkillTopicPivot_fromTopicId_fkey" 
  FOREIGN KEY ("fromTopicId") 
  REFERENCES "SkillTopic"("id") 
  ON DELETE CASCADE;

ALTER TABLE "SkillTopicPivot" 
  ADD CONSTRAINT "SkillTopicPivot_toTopicId_fkey" 
  FOREIGN KEY ("toTopicId") 
  REFERENCES "SkillTopic"("id") 
  ON DELETE CASCADE;

ALTER TABLE "BrandNarrative" 
  ADD CONSTRAINT "BrandNarrative_skillTopicId_fkey" 
  FOREIGN KEY ("skillTopicId") 
  REFERENCES "SkillTopic"("id") 
  ON DELETE CASCADE;
