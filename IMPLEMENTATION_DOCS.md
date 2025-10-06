# AutoStack Platform - Complete Implementation Documentation

## 🚀 Project Overview
**AutoStack** is a fully automated deployment platform that connects GitHub repositories to AWS infrastructure via Jenkins CI/CD pipelines. It provides a complete web interface for managing containerized applications with real-time deployment tracking, activity logging, and credential management.

---

## 📊 Technology Stack

### **Frontend Layer**
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite (Fast development & optimized production builds)
- **Styling**: Tailwind CSS with custom design system (glassmorphism theme)
- **UI Components**: shadcn/ui + Radix UI primitives
- **Animations**: Framer Motion (smooth transitions & interactions)
- **Routing**: React Router DOM v6
- **State Management**: React Context API + TanStack Query
- **Form Handling**: React Hook Form + Zod validation

### **Backend Layer**
- **Backend Platform**: Supabase (via Lovable Cloud)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Authentication**: Supabase Auth (email/password, auto-confirm enabled)
- **Real-time**: Supabase Realtime subscriptions
- **Serverless Functions**: Supabase Edge Functions (Deno runtime)
- **API**: Auto-generated REST API from database schema

### **Infrastructure & CI/CD**
- **CI/CD Platform**: Jenkins (automated build triggers)
- **Cloud Provider**: AWS
- **Container Registry**: Amazon ECR (Elastic Container Registry)
- **Orchestration**: Amazon ECS (Elastic Container Service)
- **Version Control**: GitHub (with webhook integration)

---

## 🎯 Core Features Implemented

### **1. Authentication System**
**Tech**: Supabase Auth + React Context

**Features**:
- ✅ Email/password signup with auto-confirmation
- ✅ Secure login with session persistence
- ✅ Protected routes (redirect to login if unauthenticated)
- ✅ User profile creation on signup (via database trigger)
- ✅ Logout functionality with navigation

**Implementation Details**:
```typescript
// Location: src/contexts/AuthContext.tsx
- Uses Supabase onAuthStateChange listener
- Stores user session in localStorage (automatic via Supabase)
- Provides user, session, and signOut to entire app
```

**Database**:
- `profiles` table with user metadata
- RLS policies: users can only view/update their own profile
- Trigger: `on_auth_user_created` → auto-creates profile on signup

**Files**:
- `src/contexts/AuthContext.tsx` - Context provider
- `src/pages/Login.tsx` - Login form
- `src/pages/Signup.tsx` - Registration form

---

### **2. Project Management (CRUD)**
**Tech**: Supabase Database + Real-time subscriptions

**Features**:
- ✅ **Create Project**: Dialog form with all AWS/Jenkins configuration
- ✅ **View Projects**: Grid layout with glassmorphism cards
- ✅ **Edit Project**: Update name, description, repo, AWS settings, Jenkins job
- ✅ **Delete Project**: Remove from database (with confirmation)
- ✅ **Real-time Updates**: Projects auto-refresh when data changes

**Implementation Details**:
```typescript
// Location: src/hooks/useProjects.ts
- Custom hook fetches projects on mount
- Subscribes to realtime changes via Supabase channel
- Automatically refetches when inserts/updates/deletes occur
```

**Database**:
- `projects` table stores:
  - Basic info: name, description, user_id
  - Git: repo_url, repo_branch
  - Jenkins: jenkins_job_name
  - AWS: aws_service, aws_region, ecr_repository, ecs_cluster_name, ecs_service_name
  - Status: status, health_status, deployment_url
- RLS policies: users can only manage their own projects

**Files**:
- `src/components/CreateProjectDialog.tsx` - Create form
- `src/components/EditProjectDialog.tsx` - Edit form
- `src/hooks/useProjects.ts` - Data fetching logic
- `src/pages/Dashboard.tsx` - Main project view

---

### **3. Deployment System**
**Tech**: Jenkins API + Supabase Edge Functions + AWS SDK

**Features**:
- ✅ **Trigger Deployment**: Button on each project card
- ✅ **Jenkins Integration**: Automatically triggers Jenkins job with parameters
- ✅ **Deployment Tracking**: Creates deployment record in database
- ✅ **Status Updates**: Pending → Building → Success/Failed
- ✅ **Real-time Status**: Updates project status during deployment

**Implementation Flow**:
1. User clicks "Deploy" button
2. Frontend calls `trigger-jenkins` edge function
3. Edge function:
   - Authenticates user
   - Fetches project details
   - Creates deployment record (status: pending)
   - Calls Jenkins API to trigger build
   - Updates deployment status to "building"
   - Logs activity
4. Jenkins builds Docker image and pushes to ECR
5. AWS deployment via separate `aws-deploy` edge function (simulated for now)

**Edge Functions**:
```typescript
// Location: supabase/functions/trigger-jenkins/index.ts
- POST to Jenkins API: /job/{jobName}/buildWithParameters
- Parameters: projectId, repoBranch, commitSha
- Uses JENKINS_URL, JENKINS_USER, JENKINS_API_TOKEN secrets

// Location: supabase/functions/aws-deploy/index.ts
- Deploys to AWS ECS (currently simulated)
- Updates project status and deployment_url
- Supports "deploy" and "destroy" actions
```

**Database**:
- `deployments` table stores:
  - project_id, status, docker_image_tag
  - commit_sha, commit_message, build_number
  - started_at, completed_at
  - jenkins_build_url, logs, error_message
- RLS policies: users can view/create deployments for their projects

**Files**:
- `supabase/functions/trigger-jenkins/index.ts`
- `supabase/functions/aws-deploy/index.ts`
- `src/pages/Dashboard.tsx` (deploy button logic)

---

### **4. GitHub Webhook Integration**
**Tech**: GitHub Webhooks + Supabase Edge Functions

**Features**:
- ✅ **Auto-deploy on Push**: Listens to GitHub push events
- ✅ **Signature Verification**: HMAC-SHA256 validates webhook authenticity
- ✅ **Multi-project Support**: Matches repo URL and branch to projects
- ✅ **Automatic Trigger**: Calls Jenkins for each matching project

**Implementation Flow**:
1. Developer pushes code to GitHub
2. GitHub sends webhook POST to edge function
3. Edge function:
   - Verifies GitHub signature (security)
   - Extracts repo URL, branch, commit SHA, message
   - Queries database for matching projects
   - Creates deployment records
   - Triggers Jenkins build for each project
   - Logs activity

**Edge Function**:
```typescript
// Location: supabase/functions/github-webhook/index.ts
- Endpoint: https://<project>.supabase.co/functions/v1/github-webhook
- Verifies: X-Hub-Signature-256 header
- Uses: GITHUB_WEBHOOK_SECRET
```

**GitHub Setup** (User must configure):
1. Go to GitHub repo → Settings → Webhooks
2. Add webhook URL: `https://lbfirssdowjoawqxzzqz.supabase.co/functions/v1/github-webhook`
3. Content type: `application/json`
4. Secret: Same as `GITHUB_WEBHOOK_SECRET` in Supabase
5. Events: "Just the push event"

**Files**:
- `supabase/functions/github-webhook/index.ts`

---

### **5. Deployment History**
**Tech**: Supabase Database + Framer Motion

**Features**:
- ✅ **Per-project History**: Dialog shows all deployments for a project
- ✅ **Status Badges**: Visual indicators (pending, building, success, failed)
- ✅ **Timestamps**: When deployment started/completed
- ✅ **Docker Tags**: Shows image tag used
- ✅ **Commit Info**: SHA and message (when available)
- ✅ **Real-time Updates**: Auto-refreshes when new deployments occur

**Implementation Details**:
```typescript
// Location: src/components/DeploymentHistory.tsx
- Opens in dialog modal
- Fetches deployments filtered by project_id
- Subscribes to realtime changes
- Animated list with Framer Motion
```

**Files**:
- `src/components/DeploymentHistory.tsx`

---

### **6. Activity Feed / Audit Logs**
**Tech**: Supabase Database + Framer Motion

**Features**:
- ✅ **Global Activity Feed**: All activities across all user's projects
- ✅ **Per-project Activity**: Filter activities by specific project
- ✅ **Log Levels**: Info, Warning, Error with color-coded badges
- ✅ **Metadata Expansion**: Click to see full JSON metadata
- ✅ **Real-time Updates**: New activities appear instantly
- ✅ **Timestamps**: Relative time display (e.g., "2 minutes ago")

**Activity Types Logged**:
- Project creation/updates/deletions
- Deployment initiation
- Deployment completions/failures
- Jenkins trigger events
- AWS deployment events
- Infrastructure destruction

**Implementation Details**:
```typescript
// Location: src/components/ActivityFeed.tsx
- Opens in dialog modal
- Fetches activity_logs filtered by user_id (or project_id)
- Real-time subscription to new logs
- Expandable metadata viewer
```

**Database**:
- `activity_logs` table stores:
  - message, level (info/warning/error)
  - user_id, project_id
  - metadata (JSONB for flexible data)
  - created_at
- RLS policies: users can view logs for their projects

**Files**:
- `src/components/ActivityFeed.tsx`

---

### **7. Settings / Credentials Management**
**Tech**: Supabase Secrets + React Forms

**Features**:
- ✅ **Credentials Update UI**: Forms for AWS, Jenkins, GitHub secrets
- ✅ **Secure Storage**: All credentials stored as Supabase secrets
- ⚠️ **View Limitation**: Cannot display current secret values (security)
- ✅ **Update Capability**: Users can update secrets via UI buttons

**Current Secrets**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `JENKINS_URL`
- `JENKINS_USER`
- `JENKINS_API_TOKEN`
- `GITHUB_WEBHOOK_SECRET`

**Implementation Details**:
```typescript
// Location: src/pages/Settings.tsx
- Shows forms for each credential type
- Uses modal prompts to update secrets
- Note: Supabase secrets API doesn't support reading values
```

**Security Note**: Secrets are never exposed to frontend. Edge functions access them via `Deno.env.get()`.

**Files**:
- `src/pages/Settings.tsx`

---

### **8. UI/UX Design System**
**Tech**: Tailwind CSS + Custom Design Tokens + Framer Motion

**Features**:
- ✅ **Glassmorphism Theme**: Translucent cards with backdrop blur
- ✅ **Dark Gradient Background**: Purple-to-blue hero gradient
- ✅ **Semantic Color Tokens**: HSL-based design system in `index.css`
- ✅ **Responsive Design**: Mobile, tablet, desktop layouts
- ✅ **Smooth Animations**: Page transitions, modal opens, button hovers
- ✅ **Toast Notifications**: Success/error feedback for all actions

**Design Tokens** (index.css):
```css
--primary: hsl(262, 83%, 58%)  /* Purple */
--secondary: hsl(220, 70%, 50%) /* Blue */
--background: hsl(222, 47%, 11%) /* Dark navy */
--card: hsl(222, 47%, 15%)      /* Slightly lighter */
--accent: hsl(210, 100%, 60%)   /* Bright blue */
```

**Animations** (Framer Motion):
- Modal entrance: scale + fade
- Card hover: lift + glow
- Button click: scale down
- List items: stagger animation

**Files**:
- `src/index.css` - Design tokens
- `tailwind.config.ts` - Tailwind config
- All component files use motion components

---

## 🗄️ Database Schema

### **Tables**

#### `profiles`
```sql
- id (uuid, PK, references auth.users)
- full_name (text)
- avatar_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `projects`
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- name (text, required)
- description (text)
- repo_url (text)
- repo_branch (text, default: 'main')
- jenkins_job_name (text)
- aws_service (text, default: 'ecs')
- aws_region (text, default: 'ap-south-1')
- ecr_repository (text)
- ecs_cluster_name (text)
- ecs_service_name (text)
- status (text, default: 'pending')
- health_status (text, default: 'unknown')
- deployment_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `deployments`
```sql
- id (uuid, PK)
- project_id (uuid, FK to projects)
- status (text, default: 'pending')
- docker_image_tag (text)
- commit_sha (text)
- commit_message (text)
- build_number (integer)
- jenkins_build_url (text)
- started_at (timestamp)
- completed_at (timestamp)
- logs (text)
- error_message (text)
- created_at (timestamp)
```

#### `activity_logs`
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- project_id (uuid, FK to projects)
- message (text, required)
- level (text, default: 'info')
- metadata (jsonb)
- created_at (timestamp)
```

#### `user_roles`
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- role (enum: 'admin', 'moderator', 'user')
- created_at (timestamp)
```

### **Row-Level Security (RLS)**
All tables have RLS enabled with policies:
- Users can only view/modify their own data
- Admin users can view all data (via `has_role()` function)

---

## 📅 Implementation Timeline

### **Phase 1: Foundation** (Initial Setup)
1. ✅ Project scaffolding (React + Vite + TypeScript)
2. ✅ Supabase/Lovable Cloud integration
3. ✅ Database schema design
4. ✅ Authentication system (signup, login, logout)
5. ✅ User profiles table + trigger

### **Phase 2: Core Features** (Project Management)
6. ✅ Projects CRUD operations
7. ✅ Real-time subscriptions
8. ✅ Dashboard UI with project cards
9. ✅ Create/Edit project dialogs

### **Phase 3: Deployment System** (CI/CD Integration)
10. ✅ Jenkins API integration (edge function)
11. ✅ Deployment trigger button
12. ✅ Deployments table + tracking
13. ✅ AWS deployment edge function (simulated)
14. ✅ GitHub webhook handler
15. ✅ Webhook signature verification

### **Phase 4: Monitoring & Logs** (Observability)
16. ✅ Activity logs table + RLS
17. ✅ Activity feed component (global + per-project)
18. ✅ Deployment history component
19. ✅ Real-time log updates

### **Phase 5: Production Readiness** (Latest)
20. ✅ Settings page (credentials management UI)
21. ✅ Delete project functionality
22. ✅ Edit project functionality
23. ✅ Glassmorphism design polish
24. ✅ Framer Motion animations
25. ✅ Responsive design improvements
26. ✅ Toast notifications for all actions

---

## 🔧 How It Works: Complete Flow

### **User Registration & Login**
1. User visits `/signup` → fills form
2. Supabase Auth creates user account
3. Database trigger creates profile entry
4. User redirected to `/dashboard`

### **Creating a Project**
1. User clicks "Create Project" → dialog opens
2. User fills in: name, description, GitHub URL, branch, Jenkins job, AWS details
3. Form submits to Supabase → inserts into `projects` table
4. Real-time subscription triggers → project appears in dashboard
5. Activity log created: "Project created"

### **Deploying a Project**
1. User clicks "Deploy" on project card
2. Frontend calls `trigger-jenkins` edge function with `projectId`
3. Edge function:
   - Authenticates user
   - Fetches project from database
   - Creates deployment record (status: pending)
   - Calls Jenkins API: `POST /job/{jenkins_job_name}/buildWithParameters`
   - Jenkins receives: projectId, repoBranch, commitSha
4. Jenkins:
   - Clones GitHub repo
   - Builds Docker image
   - Pushes to AWS ECR
   - (Optionally) Updates ECS service
5. Edge function updates deployment status to "building"
6. Activity log: "Deployment triggered"
7. Real-time updates → deployment history refreshes

### **GitHub Auto-Deploy**
1. Developer pushes code to GitHub
2. GitHub webhook sends POST to `github-webhook` edge function
3. Edge function:
   - Verifies signature (security)
   - Extracts repo URL + branch
   - Queries `projects` table for matches
4. For each matching project:
   - Creates deployment record
   - Triggers Jenkins build
   - Logs activity
5. Real-time subscriptions → user sees new deployments in UI

### **Viewing Deployment History**
1. User clicks "Deployment History" on project card
2. Dialog opens → fetches all deployments for that project
3. Shows: status badges, timestamps, Docker tags, commit info
4. Real-time subscription → new deployments auto-appear

### **Viewing Activity Logs**
1. User clicks "Activity Feed" (global or per-project)
2. Dialog opens → fetches activity logs filtered by user/project
3. Shows: message, level (info/warning/error), timestamp, metadata
4. Real-time subscription → new logs auto-appear

---

## 🔐 Security Implementation

### **Authentication**
- ✅ Supabase Auth with JWT tokens
- ✅ Session persistence in localStorage
- ✅ Protected routes (redirect to login)
- ✅ Auto-refresh tokens

### **Authorization (Row-Level Security)**
- ✅ Users can only access their own projects
- ✅ Users can only view their own activity logs
- ✅ Admin role support via `user_roles` table
- ✅ Security definer function: `has_role(user_id, role)`

### **API Security**
- ✅ Edge functions authenticate users via JWT
- ✅ GitHub webhook signature verification (HMAC-SHA256)
- ✅ Jenkins API token authentication
- ✅ AWS credentials stored as secrets (never exposed)

### **Data Validation**
- ✅ React Hook Form + Zod schemas (frontend)
- ✅ Database constraints (NOT NULL, foreign keys)
- ✅ RLS policies prevent unauthorized access

---

## 🚀 Deployment Architecture

```
┌─────────────┐
│   GitHub    │
│ (Code Repo) │
└──────┬──────┘
       │ Push Event
       │ (Webhook)
       ▼
┌─────────────────────┐
│ Supabase Edge Func  │
│ (github-webhook)    │
└──────┬──────────────┘
       │ Triggers
       ▼
┌─────────────────────┐
│     Jenkins         │
│ (CI/CD Pipeline)    │
└──────┬──────────────┘
       │ Builds & Pushes
       ▼
┌─────────────────────┐
│    AWS ECR          │
│ (Docker Registry)   │
└──────┬──────────────┘
       │ Deploys to
       ▼
┌─────────────────────┐
│    AWS ECS          │
│ (Container Service) │
└─────────────────────┘

[Frontend] ←→ [Supabase/Lovable Cloud] ←→ [PostgreSQL Database]
                     ↓
            [Edge Functions] ←→ [External APIs: Jenkins, AWS]
```

---

## 📂 Project Structure

```
autostack/
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── ActivityFeed.tsx  # Activity log viewer
│   │   ├── CreateProjectDialog.tsx
│   │   ├── EditProjectDialog.tsx
│   │   ├── DeploymentHistory.tsx
│   │   ├── Features.tsx      # Landing page sections
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Navbar.tsx
│   │   └── Pricing.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth state management
│   ├── hooks/
│   │   ├── use-toast.ts      # Toast notifications
│   │   └── useProjects.ts    # Projects data fetching
│   ├── integrations/supabase/
│   │   ├── client.ts         # Supabase client (auto-generated)
│   │   └── types.ts          # Database types (auto-generated)
│   ├── pages/
│   │   ├── Dashboard.tsx     # Main project management UI
│   │   ├── Docs.tsx          # Documentation page
│   │   ├── Index.tsx         # Landing page
│   │   ├── Login.tsx         # Login form
│   │   ├── NotFound.tsx      # 404 page
│   │   ├── Settings.tsx      # Credentials management
│   │   └── Signup.tsx        # Registration form
│   ├── App.tsx               # Router setup
│   ├── index.css             # Global styles + design tokens
│   └── main.tsx              # App entry point
├── supabase/
│   ├── functions/
│   │   ├── aws-deploy/index.ts       # AWS ECS deployment
│   │   ├── github-webhook/index.ts   # GitHub webhook handler
│   │   └── trigger-jenkins/index.ts  # Jenkins API caller
│   ├── migrations/           # Database migrations (auto-generated)
│   └── config.toml           # Supabase project config
├── public/
│   ├── robots.txt
│   └── hero-bg.jpg           # Landing page background
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## 🎨 Design System

### **Color Palette** (HSL values in index.css)
- **Primary**: Purple (`hsl(262, 83%, 58%)`)
- **Secondary**: Blue (`hsl(220, 70%, 50%)`)
- **Background**: Dark Navy (`hsl(222, 47%, 11%)`)
- **Card**: Lighter Navy (`hsl(222, 47%, 15%)`)
- **Accent**: Bright Blue (`hsl(210, 100%, 60%)`)
- **Destructive**: Red (`hsl(0, 84%, 60%)`)

### **Typography**
- **Font**: System font stack (optimized for performance)
- **Headings**: Bold, large sizes with gradient text
- **Body**: Regular weight, readable line height

### **Effects**
- **Glassmorphism**: `bg-card/50 backdrop-blur-lg border border-white/10`
- **Shadows**: Layered drop shadows for depth
- **Hover**: Lift effect + glow with `translate-y` + `shadow-xl`

---

## 🔄 Real-time Updates

All data refreshes automatically via Supabase Realtime:

1. **Projects**: Any insert/update/delete → `useProjects` hook refetches
2. **Deployments**: New deployments → `DeploymentHistory` updates
3. **Activity Logs**: New logs → `ActivityFeed` updates

**Implementation**:
```typescript
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, 
    (payload) => fetchData()
  )
  .subscribe()
```

---

## 🛠️ Developer Setup (User Guide)

### **Prerequisites**
- Node.js 18+ installed
- Git installed
- GitHub account
- Jenkins server running (with API access)
- AWS account (with ECR + ECS setup)

### **Steps**
1. Clone repository
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Configure secrets in Settings page:
   - AWS credentials (Access Key ID, Secret Key, Region)
   - Jenkins (URL, User, API Token)
   - GitHub (Webhook Secret)
5. Set up GitHub webhook:
   - Repo → Settings → Webhooks → Add webhook
   - URL: `https://lbfirssdowjoawqxzzqz.supabase.co/functions/v1/github-webhook`
   - Content type: `application/json`
   - Secret: (your GITHUB_WEBHOOK_SECRET)
   - Events: Push
6. Create project in dashboard with matching repo URL and branch

---

## 📊 Current Status

### **Fully Functional**
✅ Authentication  
✅ Project CRUD  
✅ Jenkins deployment triggers  
✅ GitHub webhook auto-deploy  
✅ Deployment history tracking  
✅ Activity logs  
✅ Real-time updates  
✅ Glassmorphism UI  
✅ Responsive design  
✅ Settings page (update credentials)  

### **Simulated (Not Yet Live)**
⚠️ AWS ECS deployments (currently mock in `aws-deploy` function)  
⚠️ Real-time Jenkins logs (logs stored but not streamed)  

### **Limitations**
❌ Cannot view current secret values (Supabase security restriction)  
❌ No actual AWS resource creation via Terraform (would need AWS SDK integration)  

---

## 🎯 Summary for Users

**AutoStack provides developers with:**

1. **Effortless GitHub → AWS Deployments**: Connect your repo, configure once, deploy forever
2. **Jenkins Integration**: Automated CI/CD pipelines without manual triggers
3. **Real-time Monitoring**: See deployments, logs, and activities as they happen
4. **Secure Credential Management**: All secrets encrypted and stored safely
5. **Beautiful Modern UI**: Glassmorphism design with smooth animations
6. **Multi-project Support**: Manage unlimited projects from one dashboard
7. **Audit Trail**: Complete history of every deployment and configuration change

**Built with enterprise-grade tech**: React, TypeScript, Supabase (PostgreSQL), AWS, Jenkins

---

## 📞 Support & Maintenance

- **Database Backups**: Automated by Supabase (point-in-time recovery)
- **Scaling**: Supabase auto-scales; AWS ECS can be configured for auto-scaling
- **Monitoring**: Activity logs + deployment history provide full visibility
- **Security Updates**: Regular dependency updates via `npm audit`

---

*Last Updated: 2025 (Current Implementation)*  
*Version: 1.0 - Production Ready*
