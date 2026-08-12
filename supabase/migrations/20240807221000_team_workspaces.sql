-- Create Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    billing_email TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_tier TEXT DEFAULT 'free',
    seats_total INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create Organization Members table
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create Org Invites
CREATE TABLE organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role org_role NOT NULL DEFAULT 'viewer',
    token TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(organization_id, email)
);

ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Add organization_id to documents
ALTER TABLE documents ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to conversations/chats
ALTER TABLE chats ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- RLS POLICIES

-- 1. Organizations
CREATE POLICY "Users can view their organizations" 
ON organizations FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid())
);

CREATE POLICY "Only admins/owners can update organizations" 
ON organizations FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND role IN ('admin', 'owner'))
);

-- 2. Organization Members (RBAC)
CREATE POLICY "Users can view members of their orgs"
ON organization_members FOR SELECT
USING (
    EXISTS (SELECT 1 FROM organization_members AS om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid())
);

CREATE POLICY "Admins can manage members"
ON organization_members FOR ALL
USING (
    EXISTS (SELECT 1 FROM organization_members AS om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN ('admin', 'owner'))
);

-- 3. Documents (RBAC Enforced)
CREATE POLICY "Anyone in org can view documents"
ON documents FOR SELECT
USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = documents.organization_id AND user_id = auth.uid())
);

CREATE POLICY "Only editors+ can insert/update/delete documents"
ON documents FOR ALL
USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = documents.organization_id AND user_id = auth.uid() AND role IN ('editor', 'admin', 'owner'))
);

-- 4. Chats (RBAC Enforced)
CREATE POLICY "Anyone in org can view chats"
ON chats FOR SELECT
USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = chats.organization_id AND user_id = auth.uid())
);

CREATE POLICY "Only editors+ can insert/update/delete chats"
ON chats FOR ALL
USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = chats.organization_id AND user_id = auth.uid() AND role IN ('editor', 'admin', 'owner'))
);

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER set_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
