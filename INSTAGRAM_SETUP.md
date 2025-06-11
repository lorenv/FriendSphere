# Instagram API Setup Guide

This guide walks you through setting up Instagram Basic Display API for importing photos and connecting with your Instagram account.

## Step 1: Create a Facebook Developer Account

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Click "Get Started" in the top right corner
3. Log in with your personal Facebook account
4. Complete the developer account verification process
5. Accept the Facebook Developer Terms and Policies

## Step 2: Create a Facebook App

1. In your Facebook Developer dashboard, click "Create App"
2. Select "Consumer" as the app type
3. Fill in your app details:
   - **App Name**: Your Friends Network App
   - **App Contact Email**: Your email address
   - **App Purpose**: Personal use for managing friend connections
4. Click "Create App"

## Step 3: Add Instagram Basic Display Product

1. In your app dashboard, scroll down to "Add Products to Your App"
2. Find "Instagram Basic Display" and click "Set Up"
3. Click "Create New App" if prompted
4. The Instagram Basic Display product will be added to your app

## Step 4: Configure Instagram Basic Display

1. In the left sidebar, click "Instagram Basic Display" → "Basic Display"
2. Scroll down to "User Token Generator"
3. Click "Create New App" if you haven't already
4. Add your Instagram account as a test user:
   - Click "Add or Remove Instagram Testers"
   - Enter your Instagram username
   - Accept the invitation in your Instagram app

## Step 5: Get Your App Credentials

1. In the Instagram Basic Display settings, note these values:
   - **Instagram App ID**: Found at the top of the Basic Display page
   - **Instagram App Secret**: Click "Show" next to App Secret
2. Set up your redirect URI:
   - In "Valid OAuth Redirect URIs", add:
     - For local development: `http://localhost:5000/api/instagram/callback`
     - For production: `https://yourdomain.com/api/instagram/callback`

## Step 6: Configure Environment Variables

Add these environment variables to your `.env` file:

```env
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/instagram/callback
```

For production deployment, update the redirect URI to match your domain.

## Step 7: Test the Integration

1. Start your application
2. Navigate to the friend import section
3. Click "Connect Instagram"
4. You should be redirected to Instagram's OAuth page
5. Log in and authorize your app
6. You'll be redirected back to your app with access to your Instagram photos

## Important Notes

### API Limitations
- **Instagram Basic Display API** only provides access to your own Instagram content
- It does **not** provide access to followers, following lists, or other users' content
- For accessing followers/following, you would need **Instagram Business API** which requires:
  - A business Instagram account
  - A Facebook Page connected to that account
  - Additional review and approval process

### Permissions
The Basic Display API provides these permissions:
- `user_profile`: Access to user's profile info (username, account type, media count)
- `user_media`: Access to user's photos and videos

### Data Available
With Basic Display API, you can import:
- User's own Instagram photos for profile pictures
- Basic profile information (username, media count)

### Production Considerations
- Instagram apps start in "Development Mode" with limited access
- For production use with other users, you'll need to submit for App Review
- Test users (including yourself) can always use the app in Development Mode

## Troubleshooting

### Common Issues
1. **"Invalid redirect URI"**: Ensure the redirect URI in your app settings exactly matches your environment variable
2. **"App not authorized"**: Make sure you've added yourself as a test user in the Instagram Basic Display settings
3. **"Invalid credentials"**: Double-check your App ID and App Secret are correctly copied

### Testing Your Setup
You can test your credentials by making a direct API call:
```bash
curl "https://api.instagram.com/oauth/authorize?client_id=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user_profile,user_media&response_type=code"
```

This should redirect you to Instagram's authorization page if your credentials are correct.

## Alternative: Manual Photo Import

If you prefer not to set up the Instagram API, the app also supports:
- Manual photo upload from your device
- OCR-based contact import from screenshots
- Direct vCard file import

The Instagram integration is optional and the app functions fully without it.