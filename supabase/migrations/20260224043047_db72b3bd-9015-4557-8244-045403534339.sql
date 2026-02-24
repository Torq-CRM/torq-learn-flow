
-- Add unique constraint for upsert on training_progress
ALTER TABLE public.training_progress
ADD CONSTRAINT training_progress_location_video_unique UNIQUE (location_id, video_id);

-- Seed training subjects
INSERT INTO training_subjects (title, summary, sort_order, is_active) VALUES
  ('CRM Fundamentals', 'Learn the core features of your CRM and how to navigate the platform effectively.', 1, true),
  ('Lead Management', 'Master lead capture, pipeline management, and follow-up automation workflows.', 2, true),
  ('Communication Tools', 'Set up SMS, email, and calling integrations for seamless client communication.', 3, true);

-- Seed training videos
INSERT INTO training_videos (subject_id, title, description, video_url, sort_order) VALUES
  ((SELECT id FROM training_subjects WHERE title = 'CRM Fundamentals'), 'Platform Overview', 'A walkthrough of the main dashboard and navigation.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
  ((SELECT id FROM training_subjects WHERE title = 'CRM Fundamentals'), 'Account Setup', 'How to configure your account settings and preferences.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
  ((SELECT id FROM training_subjects WHERE title = 'Lead Management'), 'Adding Your First Lead', 'Step-by-step guide to creating and managing leads.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
  ((SELECT id FROM training_subjects WHERE title = 'Lead Management'), 'Pipeline Stages', 'Understand and customize your sales pipeline stages.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
  ((SELECT id FROM training_subjects WHERE title = 'Communication Tools'), 'SMS Setup', 'Configure your SMS integration for automated messaging.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
  ((SELECT id FROM training_subjects WHERE title = 'Communication Tools'), 'Email Templates', 'Create and manage reusable email templates.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2);
