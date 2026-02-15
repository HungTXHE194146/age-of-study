-- Allow students to view active classes (needed for join code validation)
CREATE POLICY "Students can view active classes"
  ON classes FOR SELECT
  USING (
    status = 'active' AND
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'student')
  );
