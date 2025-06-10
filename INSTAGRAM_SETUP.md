# Instagram Integration Setup Guide

This guide will help you set up Instagram integration for importing profile photos and contacts into your FriendCircle app.

## Prerequisites

1. A Facebook Developer account
2. An Instagram account (personal or business)
3. Your app running locally or deployed

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as the app type
4. Fill in your app details:
   - App Name: "FriendCircle" (or your preferred name)
   - App Contact Email: Your email
   - App Purpose: Select appropriate purpose

## Step 2: Add Instagram Basic Display Product

1. In your app dashboard, click "+ Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to Instagram Basic Display → Basic Display

## Step 3: Configure Instagram Basic Display

1. **Create Instagram App:**
   - Click "Create New App"
   - Choose "Instagram App" type
   - Display Name: "FriendCircle"

2. **Add Instagram Testers:**
   - Go to "Roles" → "Roles"
   - Click "Add Instagram Testers"
   - Add your Instagram username
   - Accept the invitation in your Instagram app

3. **Configure OAuth Redirect URIs:**
   - In Basic Display settings, add these redirect URIs:
   - For local development: `http://localhost:5000/api/instagram/callback`
   - For production: `https://yourdomain.com/api/instagram/callback`

## Step 4: Get Your Credentials

1. In Instagram Basic Display → Basic Display
2. Copy your:
   - **Instagram App ID**
   - **Instagram App Secret**

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Instagram credentials:

```env
# Instagram Basic Display API Configuration
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/instagram/callback
```

3. For production, update the redirect URI to match your domain

## Step 6: Test the Integration

1. Restart your development server
2. Navigate to "Add Friend" page
3. Click "Instagram Integration"
4. Click "Connect Instagram"
5. You'll be redirected to Instagram for authorization
6. After approval, you'll return to your app with access to:
   - Your Instagram photos for profile pictures
   - Basic profile information

## Permissions Granted

The integration requests these permissions:
- `user_profile`: Basic profile information (username, account type, media count)
- `user_media`: Access to your media (photos and videos)

## Important Notes

1. **Instagram Basic Display vs Instagram Graph API:**
   - Basic Display: For personal use, limited to your own content
   - Graph API: For business use, requires app review for broader access

2. **Contact Import Limitations:**
   - Instagram Basic Display doesn't provide follower/following lists
   - The contact import feature currently shows example data
   - For real contact import, you'd need Instagram Graph API with business permissions

3. **Rate Limits:**
   - 200 requests per hour per user
   - Suitable for personal use and small applications

## Troubleshooting

### "Invalid Redirect URI" Error
- Ensure the redirect URI in your .env matches exactly what's configured in Facebook Developer Console
- Check for trailing slashes or protocol mismatches (http vs https)

### "App Not Found" Error
- Verify your Instagram App ID is correct
- Ensure the app is not in development mode restriction

### "User Not Authorized" Error
- Make sure you've added yourself as an Instagram Tester
- Check that you've accepted the tester invitation in Instagram

### "Scope Error"
- Verify your app has Instagram Basic Display product added
- Check that required permissions are configured

## Production Deployment

For production use:
1. Update `INSTAGRAM_REDIRECT_URI` to your production domain
2. Add the production redirect URI to Facebook Developer Console
3. Consider upgrading to Instagram Graph API for additional features
4. Implement proper user session management for multi-user support

## Security Considerations

1. Keep your Instagram App Secret secure and never expose it in client-side code
2. Use HTTPS in production
3. Implement proper error handling for failed requests
4. Consider implementing token refresh logic for long-term access