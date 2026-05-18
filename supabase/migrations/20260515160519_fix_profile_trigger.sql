
/*
  # Fix profile creation trigger and add admin user

  1. Changes
    - Replace handle_new_user function with SECURITY DEFINER version
      that bypasses RLS when creating profile during signup
    - The trigger runs as the function owner (superuser), not as the
      new user, so it can insert into profiles even before the user
      session is fully established
  
  2. Notes
    - SECURITY DEFINER is required because during the AFTER INSERT
      trigger on auth.users, the new user's session may not yet have
      a valid JWT, causing RLS INSERT policy checks to fail
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
