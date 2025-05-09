# Jazz Mafia Terminal - Boss Instructions

Welcome, Boss! Here’s how to run your jazz mafia using the live dashboard and Supabase database.

## 1. Initial Setup
- Make sure you are added as a member in the Supabase `members` table with:
  - `name`: benson
  - `password`: (your secret password)
  - `access`: 5
  - `role`: Boss
  - Fill in `instrument` and `bio` as you like.

## 2. Logging In
- Use the command:
  ```
  login benson [your_password]
  ```

## 3. Approving New Members
- Applicants use `signup` to apply.
- To see pending applications:
  ```
  applications
  ```
- To approve an application:
  ```
  approve [name] [access_level] [role]
  ```
  - Example: `approve chet 1 Associate`

## 4. Managing Members
- Add a member directly:
  ```
  createmember [name] [password] [instrument] [bio] [access] [role]
  ```
- Remove a member:
  ```
  removemember [name]
  ```

## 5. Missions
- Create a mission:
  ```
  createmission [title] [description]
  ```
- Remove a mission:
  ```
  removemission [id]
  ```
- Assign a mission:
  ```
  assign [id] [member]
  ```

## 6. Helpers (Funders, Suppliers, etc)
- Add a helper:
  ```
  addhelper [name] [type] [contact] [notes]
  ```
  - Example: `addhelper BigAl Funder bigal@email.com "Funds the late-night gigs"`
- List helpers:
  ```
  helpers
  ```

## 7. Other Useful Commands
- `members` — List all members
- `missions` — List all missions
- `whoami` — Show your current user
- `logout` — Log out
- `help` — See available commands for your access level

---

All data is live in Supabase. You can manage your crew, missions, and helpers directly from the terminal interface. If you need to reset or edit anything, you can do so in the Supabase dashboard as well.

Stay jazzy, Boss!