# Jazz Band Mafia Terminal Dash

This project is a Next.js app styled as a bash terminal for the Jazz Band Mafia. It features:
- Terminal-like UI
- Login and signup with Supabase authentication
- Approval workflow for new users
- Main operations as terminal commands

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Configure Supabase:
   - Set up your Supabase project and get the API keys.
   - Add your Supabase credentials to a `.env.local` file.

## Supabase Setup
- Create a `users` table with fields: id, email, username, status, access_level.
- Create an `approvals` table: id, user_id, approver_id, approved (boolean).
- Enable email/password authentication.

## Deployment
- This app is designed to be hosted on GitHub Pages using the Next.js workflow.

---

For more details, see the code and comments in the project.
