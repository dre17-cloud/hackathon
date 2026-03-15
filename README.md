
# The Problem
Hurricane Melissa opened our eyes to a larger issue in which many secondary and tertiary students with different learning styles struggle in traditional learning systems, which further limit their access to the academic support and resources they need to succeed.

# Real World Impact
As a result, many students are left behind, academic performance declines, and educational inequality grows because learners who need more flexible and personalized support are the most affected 

# Solution
We are building an AI-powered web platform that keeps learning going by giving students a smarter, more flexible way to access education. The platform recommends the best study resources for each student’s learning style, subject, and education level, and school while also enabling self-paced learning, material sharing, peer collaboration. This creates a resilient digital learning space that helps students stay supported, connected, and on track.

# ICONNECT
ICONNECT is an AI-powered study support platform built to help students learn in ways that fit them best. Instead of forcing everyone into one learning method, the platform personalizes study support based on subjects, learning styles, academic background, and collaboration preferences.

Users can create an account, complete an onboarding survey, get AI-generated study support for any topic, upload learning resources, and connect with compatible study partners through a social matching and messaging system.

## Problem It Solves

Many students struggle in traditional learning environments because they do not all absorb information the same way. Some learn best through practice questions, others through step-by-step explanations, visual diagrams, group study, notes, or audio-based content. At the same time, students often waste time searching across different websites, videos, notes, and chat groups to find resources that actually match how they learn.

ICONNECT brings these needs into one platform by combining:
- personalized learning preferences,
- AI-generated academic support,
- resource sharing,
- and student-to-student study matching.

## Core Features

### 1. Authentication
- Sign up and log in using Supabase Authentication
- Redirects authenticated users into the platform flow
- Secure session handling through Supabase client auth

### 2. Student Onboarding
Users complete a profile that captures:
- role and education level,
- school and programme,
- year level,
- subjects,
- struggling subjects/topics,
- preferred learning styles,
- preferred resource types,
- study goals,
- and whether they want a study partner.

This data is stored in Supabase and used to power matching and personalization.

### 3. AI Study Support
The search experience lets users enter a topic and receive AI-generated learning support tailored to their chosen learning styles.

Depending on the selected style(s), the AI can generate:
- practice questions,
- study notes,
- step-by-step explanations,
- visual diagram guidance,
- group study plans,
- audio resource suggestions,
- and video recommendations.

The app also checks uploaded files and attempts to surface resources that may be relevant to the search topic.

### 4. Resource Uploads
Users can upload educational resources to Supabase Storage and save metadata in the database, including:
- title,
- subject,
- description,
- file name,
- file type,
- file URL,
- and owner.

This creates a growing shared library of study materials.

### 5. Study Partner Matching
The social hub recommends study partners based on shared profile attributes such as:
- common subjects,
- common struggle areas,
- school,
- programme,
- and willingness to study with others.
The person with the highest points indicates that you are the most compatibility.

### 6. Friend Requests and Messaging
Users can:
- send study partner requests,
- accept or decline requests,
- view their connected study partners,
- and exchange direct messages in real time.

### 7. Dashboard Experience
The dashboard acts as the home base of the app and includes:
- a personalized greeting,
- quick navigation to major features,
- pending request counts,
- and AI-generated study insights based on the user profile.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** CSS / inline styled UI patterns
- **Backend Services:** Supabase
- **Authentication:** Supabase Auth
- **Database:** Supabase Postgres
- **Storage:** Supabase Storage
- **AI Integration:** Groq API and Google Gemini API fallback
- **HTTP Utilities:** Fetch API / Axios

## Project Structure

```bash
app/
  api/ai/route.ts        # AI endpoint for search and recommendations
  chat/page.tsx          # Simple messaging interface
  dashboard/page.tsx     # Main dashboard
  login/page.tsx         # Login page
  onboarding/page.tsx    # Full onboarding flow
  search/page.tsx        # AI study search page
  signup/page.tsx        # Signup page
  social/page.tsx        # Study partner matching + messaging hub
  survey/page.tsx        # Alternate survey/profile form
  upload/page.tsx        # File upload page
components/
  ConditionalNavbar.tsx
  Navbar.tsx
lib/
  supabase.ts            # Supabase client setup
public/
  iconnect.PNG           # Branding asset
```

## User Flow

1. A user signs up or logs in.
2. The user completes onboarding or the survey.
3. Their preferences are saved to Supabase.
4. The dashboard loads personalized information and AI insights.
5. The user can:
   - search for a topic,
   - upload resources,
   - discover study partners,
   - send requests,
   - and chat with accepted partners.

## Environment Variables

Create a `.env.local` file in the project root and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key
```

### Notes
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for the app to connect to Supabase.
- The AI route works with **Groq** first and can fall back to **Google Gemini** if configured.
- If neither AI key is provided, the app returns a helpful fallback response instead of full AI generation.

## Supabase Setup

This project expects specific database tables and a storage bucket to exist.

### Required Storage Bucket
Create a public storage bucket named:

```text
storage-resources
```

This bucket is used for uploaded study materials.

### Expected Tables
At minimum, the code references the following tables:

#### `profiles`
Suggested fields:
- `id`
- `email`
- `display_name`
- `last_seen`

#### `user_preferences`
Suggested fields based on the onboarding flow:
- `user_id`
- `role`
- `education_level`
- `school_name`
- `year_level`
- `programme`
- `subjects`
- `struggling_subjects`
- `struggling_topics`
- `learning_styles`
- `preferred_resources`
- `study_time`
- `study_goal`
- `wants_study_partner`
- `created_at`

#### `friends`
Suggested fields:
- `id`
- `user_id`
- `from_user_id`
- `friend_id`
- `status`

#### `messages`
Suggested fields:
- `id`
- `sender_id`
- `receiver_id`
- `content`
- `created_at`

#### `resources`
Suggested fields:
- `id`
- `title`
- `subject`
- `description`
- `file_url`
- `file_name`
- `file_type`
- `user_id`
- `created_at`

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Run production build
npm run lint    # Run ESLint
```

## AI Endpoint Overview

The AI route is located at:

```text
/app/api/ai/route.ts
```

It is used for:
- generating study content,
- recognizing simple search intent,
- suggesting educational resources,
- and formatting responses around user-selected learning styles.

The route supports different study outputs such as:
- notes,
- quizzes,
- worked explanations,
- visual summaries,
- audio/video suggestions,
- and group study plans.

## Current Strengths

- Personalized learning support
- Strong student-centered onboarding flow
- Social study matching feature
- Resource upload functionality
- Real-time communication capability
- Clean modern UI styling
- Flexible AI provider support

## Future Improvements

Some strong next steps for the project could include:
- file-type filtering and preview support,
- smarter ranking of uploaded resources,
- stronger role-based permissions,
- moderation/reporting tools for social interactions,
- notification persistence,
- analytics for student engagement,
- and a more structured recommendation engine.

## Why This Project Matters

ICONNECT is more than just a study app. It is designed around the idea that students learn differently and deserve support that reflects that reality. By combining AI, collaboration, and resource sharing, the platform creates a more inclusive and practical learning experience for students who may struggle with one-size-fits-all education systems.

## Contributors

- Jevana Grant
- Amoy Graham
- Kehvoi Thompson
- D'Andre Williams
- Julia Williams

