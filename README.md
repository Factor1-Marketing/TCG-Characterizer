# Who Said It? - Fun Game Website

A colorful and engaging game website where users can submit their favorite quotes and play a fun guessing game!

## Features

- 🎨 **Colorful Input Screen**: Fun, animated interface with gradient backgrounds and playful typography
- 📝 **Quote Submission**: Users can submit their one-liners with personal information
- 🗄️ **Supabase Integration**: Secure database storage for all submissions
- ✨ **Interactive UI**: Smooth animations, hover effects, and success celebrations
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Setup Instructions

### 1. Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open the SQL Editor
3. Copy and paste the contents of `database_setup.sql` into the editor
4. Run the SQL to create the `user_submissions` table

### 2. Local Development

1. Clone or download this project
2. Open `index.html` in your web browser
3. The app will automatically connect to your Supabase database

### 3. File Structure

```
TCG-Characterizer/
├── index.html          # Main HTML file
├── styles.css          # Colorful CSS styling
├── script.js           # JavaScript with Supabase integration
├── database_setup.sql  # SQL to create the database table
└── README.md          # This file
```

## How It Works

1. **Welcome Screen**: Users see a colorful "WHO SAID IT?" title with animated gradients
2. **Form Submission**: Users fill out:
   - Their one-liner quote
   - Their name
   - Their position
   - Their brand
3. **Database Storage**: Data is securely saved to Supabase
4. **Success Celebration**: Users see a success message with confetti animation
5. **Game Redirect**: After 3 seconds, users are prepared for the game area (coming soon!)

## Database Schema

The `user_submissions` table includes:
- `id`: Auto-incrementing primary key
- `one_liner`: The user's submitted quote
- `user_name`: The user's name
- `position`: The user's position/role
- `brand`: The user's company/brand
- `created_at`: Timestamp when submitted
- `updated_at`: Timestamp when last updated

## Security Features

- Row Level Security (RLS) enabled
- Public read/insert policies for game functionality
- Input validation and sanitization
- Secure API key handling

## Next Steps

The game area is the next feature to be developed, where users will be able to:
- View random quotes from other users
- Guess who said each quote
- Earn points and compete with others
- Share their favorite quotes

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Custom CSS with animations and gradients
- **Fonts**: Google Fonts (Fredoka One, Comic Neue)

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Enjoy building your fun game! 🎮✨
