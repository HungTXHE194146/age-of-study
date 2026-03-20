-- Migration: Add best_xp to student_node_progress table
ALTER TABLE student_node_progress ADD COLUMN IF NOT EXISTS best_xp INTEGER DEFAULT 0;
