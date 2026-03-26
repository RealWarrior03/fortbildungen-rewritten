ALTER TABLE courses
  ADD COLUMN ad_group VARCHAR(255) NULL AFTER description_en;

UPDATE courses
SET ad_group = LOWER(TRIM(ad_group))
WHERE ad_group IS NOT NULL;

CREATE INDEX idx_courses_ad_group ON courses (ad_group);
