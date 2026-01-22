# QueroJogar (WannaPlay) 🎾🏐

A modern sports matchmaking platform that connects players for Padel, Beach Tennis, and Tennis matches. Built with React, TypeScript, and Supabase, deployed on Cloudflare Pages.

## 📖 About

QueroJogar is a full-stack web application designed to help sports enthusiasts find and organize matches. The platform enables players to create game proposals, share their availability, discover players by location and skill level, and build a community around their favorite racket sports.

## ✨ Features

### 🔐 Authentication & Profiles
- Email/password authentication with Supabase Auth
- Google OAuth integration
- Comprehensive profile management with avatar upload
- Skill level tracking (Padel CAT 1-6, Beach Tennis CAT A-F, Tennis 1.0-7.0)
- Location-based profiles (ZIP code)

### 🗓️ Match Organization
- Create and manage game proposals
- Real-time game updates via Supabase subscriptions
- Availability sharing with flexible time slots
- Game status tracking (open, full, cancelled, completed)
- Public and private game options

### 🔍 Player Discovery
- Location-based filtering by ZIP code
- Skill level matching for balanced games
- Sport category preferences
- Advanced filtering options

### 🤝 Social Features
- Friends system for connecting with other players
- Player groups for organized communities
- Game history tracking
- Real-time notifications

### 👨‍💻 Admin Tools
- User management dashboard
- Location approval system
- Content moderation capabilities
- Admin panel for platform oversight

### 📱 User Experience
- Interactive tutorial system (React Joyride)
- Mobile-responsive design
- Real-time updates without page refresh
- Intuitive UI with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Hooks** - State management
- **Lucide React** - Icon library
- **React Joyride** - Interactive tutorials
- **Date-fns** - Date manipulation

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication service
  - Storage for avatars

### Deployment
- **Cloudflare Pages** - Static site hosting
- **SPA Routing** - Client-side routing support

## 🚀 Getting Started

### Prerequisites
- Node.js 20.9.0 or higher
- npm 9.0.0 or higher
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd querojogar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key (optional)
   ```

4. **Set up the database**
   
   Run the migrations in your Supabase project:
   ```bash
   # Apply migrations from supabase/migrations/ directory
   # Use Supabase CLI or Dashboard SQL Editor
   ```
   
   Migrations include:
   - Main schema (profiles, games, availabilities, locations)
   - Friends table
   - RLS policies
   - Database triggers

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run clean-availabilities` - Clean up expired availabilities

## 📁 Project Structure

```
querojogar/
├── public/                 # Static assets
│   └── legal/             # Legal pages (privacy, terms)
├── src/
│   ├── components/         # React components
│   │   ├── admin/         # Admin panel components
│   │   ├── game/          # Game-related components
│   │   ├── groups/        # Group management
│   │   ├── modals/        # Modal dialogs
│   │   ├── notifications/ # Notification system
│   │   └── tooltips/      # Tooltip components
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useGames.ts
│   │   ├── useAvailabilities.ts
│   │   └── ...
│   ├── lib/               # External library configs
│   │   └── supabase.ts    # Supabase client
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   │   ├── dateUtils.ts
│   │   ├── formValidation.ts
│   │   └── ...
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── supabase/
│   └── migrations/        # Database migration files
├── scripts/               # Utility scripts
├── dist/                  # Production build output
├── _headers               # Cloudflare Pages headers
├── _redirects             # Cloudflare Pages redirects
└── Configuration files    # vite.config.ts, tailwind.config.js, etc.
```

## 🗄️ Database Schema

### Core Tables
- **profiles** - User profiles extending auth.users
- **games** - Game proposals with player lists
- **availabilities** - Player availability time slots
- **friends** - Friend relationships
- **locations** - Game venue information
- **game_players** - Many-to-many game participation

All tables have Row Level Security (RLS) enabled with appropriate policies for data access control.

## 🚢 Deployment

### Cloudflare Pages

1. **Connect your repository** to Cloudflare Pages
2. **Configure build settings**:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 18.18.0
3. **Set environment variables** in Cloudflare Pages dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY` (if used)
4. **Deploy** - Cloudflare will automatically build and deploy on push

The `_redirects` and `_headers` files are automatically used by Cloudflare Pages for SPA routing and security headers.

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Secure authentication via Supabase Auth
- Environment variables for sensitive data
- Security headers configured in Cloudflare
- Input validation and sanitization

## 📝 Recent Updates

- ✅ Interactive tutorial system for new users
- ✅ Location-based filtering implementation
- ✅ Enhanced notification system
- ✅ Improved mobile responsiveness
- ✅ Admin panel for location management
- ✅ Real-time game updates

## 🎯 Roadmap

- [ ] Manual addition of existing players
- [ ] Enhanced search and filtering
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Payment integration for court bookings
- [ ] Advanced analytics dashboard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Add your license here]

## 📧 Contact

For questions or suggestions, please contact: support@wannaplay.com

---

Built with ❤️ for the sports community
