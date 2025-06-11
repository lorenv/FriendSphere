# Instagram API Setup Guide

This guide walks you through setting up Instagram Basic Display API for importing photos and connecting with your Instagram account.

## Important Note About Instagram API Changes

Meta has made significant changes to Instagram API access. The Instagram Basic Display API is being deprecated and may not be available for new apps. As shown in your screenshot, the standard Facebook app products no longer include "Instagram Basic Display."

## Current Status and Alternatives

### Option 1: Instagram Basic Display (Legacy - May Not Be Available)
The Instagram Basic Display API that this guide originally targeted is no longer available for new developer accounts.

### Option 2: Instagram API (Business Requirements)
The current Instagram API requires:
- Instagram Business or Creator account
- Connected Facebook Page
- App Review process for production use
- Significant setup complexity

### Option 3: Manual Import (Recommended)
Since Instagram API access has become restricted, the app provides these alternative import methods:
- **Photo Upload**: Direct photo upload from device
- **OCR Import**: Screenshot contact info and extract with text recognition
- **vCard Import**: Import .vcf contact files
- **Manual Entry**: Direct form input with photo upload

## Steps to Enable Instagram API (If Available)

### Step 1: Create a Facebook Developer Account

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Click "Get Started" in the top right corner
3. Log in with your personal Facebook account
4. Complete the developer account verification process
5. Accept the Facebook Developer Terms and Policies

### Step 2: Create a Facebook App

1. In your Facebook Developer dashboard, click "Create App"
2. Select "Consumer" as the app type (though this may not provide Instagram access)
3. Fill in your app details:
   - **App Name**: Your Friends Network App
   - **App Contact Email**: Your email address
   - **App Purpose**: Personal use for managing friend connections
4. Click "Create App"

### Step 3: Check for Instagram Products

1. In your app dashboard, scroll down to "Add Products to Your App"
2. Look for any Instagram-related products
3. **Note**: Based on your screenshot, Instagram Basic Display is not available in the current product offerings

## Current Recommendation: Use Alternative Import Methods

Since Instagram Basic Display API is no longer available for new developers, we recommend using the built-in alternative import methods:

### 1. Photo Upload
- Tap the camera icon when adding/editing a friend
- Select photos directly from your device
- Works with any photo from your gallery

### 2. OCR Contact Import
- Take a screenshot of contact information
- The app uses text recognition to extract names, phone numbers, and emails
- Perfect for importing from social media profiles or business cards

### 3. vCard Import
- Import standard .vcf contact files
- Export contacts from other apps and import them here
- Maintains all contact information and photos

### 4. Manual Entry
- Direct form input with all contact fields
- Upload photos manually
- Full control over all contact information

## Legacy Instagram API Information

### Why Instagram Integration Is Limited
Meta has significantly restricted Instagram API access:
- Instagram Basic Display API is deprecated for new apps
- Current Instagram API requires business accounts and complex approval
- Personal use apps can no longer easily access Instagram data

### If You Have Existing Instagram API Access
If you already have Instagram API credentials from a previous setup:

1. Add these environment variables to your `.env` file:
```env
INSTAGRAM_APP_ID=your_existing_app_id
INSTAGRAM_APP_SECRET=your_existing_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:5000/api/instagram/callback
```

2. The app will automatically detect these credentials and enable Instagram import

### For Business Use Cases
If you need Instagram integration for business purposes:
- Convert to Instagram Business account
- Connect to a Facebook Page
- Apply for Instagram API access through Meta's business developer program
- Complete App Review process

## Conclusion

The app is designed to work perfectly without Instagram API access. The alternative import methods provide comprehensive functionality for managing your friend network and importing contact information from various sources.