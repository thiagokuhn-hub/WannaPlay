# QueroJogar - Sports Matchmaking Platform 🎾🏐

A Brazilian sports community platform connecting players for Padel, Beach Tennis, and Tennis matches.

## Features ✨
- **User Authentication** 🔐
  - Email/password & Google OAuth
  - Profile management with avatar upload
  - Account deletion functionality
- **Match Organization** 🗓️
  - Game proposal system
  - Availability sharing with time slots
  - Real-time notifications
- **Player Discovery** 🔍
  - Location-based filtering (CEP)
  - Skill level matching
  - Preferred sports categories
- **Admin Tools** 👨💻
  - User management
  - Location approvals
  - Content moderation
- **Social Features** 🤝
  - Player groups
  - Game history tracking
  - Social sharing capabilities

## Tech Stack 💻
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Deployment**: Cloudflare Pages
- **Utilities**: Date-fns, Lucide Icons

## Project Structure 🗂️

QueroJogar
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks (useAuth, useAvailabilities)
│   ├── lib/           # Supabase client configuration
│   ├── types/         # TypeScript definitions
│   ├── utils/         # Helper functions
│   └── App.tsx        # Main application entry
├── supabase/          # Database migrations
└── .env.example       # Environment configuration

## Recent Updates
- Added interactive tutorial system
- Implemented location-based filtering
- Enhanced notification system
- Improved mobile responsiveness
- Added admin panel for location management
## TODO
-Implement add Manually existing players
## Getting Started
1. Clone the repository
2. Install dependencies: npm install
3. Set up environment variables
4. Run development server: npm run dev

## Contact
For any questions or suggestions, please contact: gutv@hotmail.com