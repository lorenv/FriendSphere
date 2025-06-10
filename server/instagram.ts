import { Request, Response } from "express";

// Instagram Basic Display API configuration
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:5000/api/instagram/callback';

interface InstagramTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface InstagramProfile {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
}

interface InstagramMedia {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

// Store access tokens in memory (in production, use a database)
const userTokens = new Map<string, string>();

export function getInstagramAuthUrl(req: Request, res: Response) {
  if (!INSTAGRAM_APP_ID) {
    return res.status(400).json({ 
      error: 'Instagram App ID not configured. Please set INSTAGRAM_APP_ID environment variable.' 
    });
  }

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_profile,user_media&response_type=code`;
  
  res.json({ authUrl });
}

export async function handleInstagramCallback(req: Request, res: Response) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `Instagram OAuth error: ${error}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code received' });
  }

  if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
    return res.status(500).json({ 
      error: 'Instagram credentials not configured' 
    });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code: code as string,
      }),
    });

    const tokenData: InstagramTokenResponse = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.access_token || 'Failed to get access token');
    }

    // Store the access token (in production, associate with user session)
    const userId = 'default'; // In a real app, get from authenticated user session
    userTokens.set(userId, tokenData.access_token);

    // Redirect back to the app
    res.redirect('/?instagram=connected');
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.status(500).json({ error: 'Failed to complete Instagram authentication' });
  }
}

export async function getInstagramProfile(req: Request, res: Response) {
  const userId = 'default'; // In a real app, get from authenticated user session
  const accessToken = userTokens.get(userId);

  if (!accessToken) {
    return res.status(401).json({ error: 'Instagram not connected' });
  }

  try {
    const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`);
    const profile: InstagramProfile = await response.json();

    if (!response.ok) {
      throw new Error(profile.id || 'Failed to fetch profile');
    }

    res.json(profile);
  } catch (error) {
    console.error('Instagram profile error:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram profile' });
  }
}

export async function getInstagramMedia(req: Request, res: Response) {
  const userId = 'default'; // In a real app, get from authenticated user session
  const accessToken = userTokens.get(userId);

  if (!accessToken) {
    return res.status(401).json({ error: 'Instagram not connected' });
  }

  try {
    const response = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,caption,timestamp&limit=25&access_token=${accessToken}`);
    const mediaData = await response.json();

    if (!response.ok) {
      throw new Error(mediaData.error?.message || 'Failed to fetch media');
    }

    res.json(mediaData);
  } catch (error) {
    console.error('Instagram media error:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram media' });
  }
}

export async function disconnectInstagram(req: Request, res: Response) {
  const userId = 'default'; // In a real app, get from authenticated user session
  userTokens.delete(userId);
  
  res.json({ success: true, message: 'Instagram disconnected successfully' });
}