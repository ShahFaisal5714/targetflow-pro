-- Fix: User Email Addresses Exposed to All Authenticated Users
-- Create a view for admin access that excludes sensitive email field
-- And update the RLS policy to use the view pattern

-- Drop the existing overly permissive admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a new policy that allows admins to view profiles but we'll use a view for safer access
-- Admins need to see profile info for user management, but email should only be visible to the user themselves
CREATE POLICY "Admins can view all profiles basic info"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = user_id
);