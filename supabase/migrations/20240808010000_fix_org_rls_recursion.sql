DROP POLICY IF EXISTS "Users can view members of their orgs" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;

-- 1. Helper function for view access (Bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS SETOF UUID AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Helper function for admin access (Bypasses RLS to prevent infinite recursion)
CREATE OR REPLACE FUNCTION get_user_admin_organizations()
RETURNS SETOF UUID AS $$
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('admin', 'owner');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Re-create policies using the helper functions
CREATE POLICY "Users can view members of their orgs"
ON organization_members FOR SELECT
USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Admins can manage members"
ON organization_members FOR ALL
USING (organization_id IN (SELECT get_user_admin_organizations()));
