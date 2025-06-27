# Friends CRM - Mobile Social Connection Manager

## Overview
A mobile-first personal CRM that transforms social networking through intelligent photo interaction and connection mapping. The application leverages advanced AI-powered face detection to streamline social connection management and photo tagging, with a focus on intuitive mobile user experience.

## Core Technologies
- React with TypeScript for type-safe frontend development
- Express.js backend with JWT authentication
- face-api.js for AI-powered face detection and photo analysis
- Drizzle ORM with PostgreSQL for database management
- Google Maps API for location services
- Tailwind CSS with shadcn/ui components for responsive design
- Wouter for client-side routing

## Project Architecture

### Authentication System
- JWT-based authentication with token expiration handling
- Login credentials: lorenvandegrift@gmail.com / password123
- Automatic token validation and redirect to login on expiration
- Session management with localStorage token storage

### Database Schema
- Users table with authentication fields
- Friends table with relationship levels and location data
- Activities table for tracking interactions
- Relationships table for connection mapping
- Friend notes for personal annotations

### Photo Import System
- AI-powered face detection using face-api.js models
- Mobile-optimized interface with square face boxes
- Touch-friendly resize controls (red minus, green plus buttons)
- Batch contact creation with relationship level selection
- 20% padding for improved face cropping context

## Recent Changes

### December 27, 2024 - Authentication Fix
- Fixed token expiration handling causing contact import failures
- Added automatic redirect to login on 401 authentication errors
- Improved error messaging for expired sessions
- Updated queryClient to handle authentication failures gracefully

### Navigation Improvements
- Replaced client-side routing with direct window.location navigation
- Fixed Group Import button navigation issues
- Updated all back buttons to use reliable direct navigation method

### Mobile Interface Optimizations
- Square-only face boxes for simplified mobile interaction
- Red minus (top-left) and green plus (top-right) resize buttons
- Improved touch interactions for face box adjustments
- Mobile-first responsive design throughout

## User Preferences
- Mobile-focused design with touch-friendly interfaces
- Simplified workflows for quick contact addition
- Visual feedback for all interactions
- Preference for direct navigation over client-side routing
- Quick notes instead of detailed forms for faster mobile input

## Key Features
1. **Group Import**: AI-powered face detection from group photos
2. **Relationship Levels**: Close (Heart), Acquaintance (Star), Friend (Shield), Work (Briefcase)
3. **Location Integration**: Google Maps API for friend locations
4. **Activity Tracking**: Timeline of interactions with friends
5. **Quick Notes**: Fast mobile input for friend annotations
6. **Connection Mapping**: Visual relationship network between friends

## Known Issues
- Browserslist data is 8 months old (non-critical)
- Token expiration requires manual re-login (by design for security)

## Deployment Status
- Development server running on port 5000
- PostgreSQL database configured and operational
- Google Maps API integration active
- Face detection models loaded and functional