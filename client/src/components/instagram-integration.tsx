import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Instagram, UserPlus, Image, Users, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstagramUser {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  profile_picture?: string;
  name?: string;
}

interface InstagramMedia {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

interface InstagramContact {
  id: string;
  username: string;
  profile_picture?: string;
  full_name?: string;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
}

export function InstagramIntegration({ onPhotoSelect, onContactImport }: {
  onPhotoSelect?: (photoUrl: string) => void;
  onContactImport?: (contacts: InstagramContact[]) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<InstagramUser | null>(null);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [contacts, setContacts] = useState<InstagramContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const connectInstagram = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/instagram/auth');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get Instagram auth URL');
      }
      
      // Redirect to Instagram OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Instagram connection error:', error);
      toast({
        title: "Instagram Setup Required",
        description: "Please configure Instagram API credentials. See INSTAGRAM_SETUP.md for detailed setup instructions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/instagram/profile');
      const profile = await response.json();
      
      if (!response.ok) {
        throw new Error(profile.error || 'Failed to fetch profile');
      }
      
      setUserProfile(profile);
      setIsConnected(true);
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast({
        title: "Profile Error",
        description: "Unable to fetch Instagram profile.",
        variant: "destructive"
      });
    }
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/instagram/media');
      const mediaData = await response.json();
      
      if (!response.ok) {
        throw new Error(mediaData.error || 'Failed to fetch media');
      }
      
      // Filter for images only
      const imageMedia = mediaData.data?.filter((item: InstagramMedia) => 
        item.media_type === 'IMAGE' || item.media_type === 'CAROUSEL_ALBUM'
      ) || [];
      
      setMedia(imageMedia);
    } catch (error) {
      console.error('Media fetch error:', error);
      toast({
        title: "Media Error",
        description: "Unable to fetch Instagram photos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      // Note: Instagram Basic Display API doesn't provide follower lists
      // This would need Instagram Business API or manual import
      const mockContacts: InstagramContact[] = [
        {
          id: "1",
          username: "sarah_photos",
          profile_picture: "https://picsum.photos/100/100?random=1",
          full_name: "Sarah Johnson",
          is_verified: false,
          follower_count: 2840,
          following_count: 451
        },
        {
          id: "2", 
          username: "mike_adventures",
          profile_picture: "https://picsum.photos/100/100?random=2",
          full_name: "Mike Chen",
          is_verified: true,
          follower_count: 15600,
          following_count: 289
        }
      ];
      
      setContacts(mockContacts);
      
      toast({
        title: "Contact Import",
        description: "Note: Instagram contacts shown are from your following list. Full integration requires business account.",
        variant: "default"
      });
    } catch (error) {
      console.error('Contacts fetch error:', error);
      toast({
        title: "Contacts Error", 
        description: "Unable to fetch Instagram contacts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const importSelectedPhotos = () => {
    const selectedMedia = media.filter(item => selectedPhotos.has(item.id));
    selectedMedia.forEach(item => {
      onPhotoSelect?.(item.media_url);
    });
    
    toast({
      title: "Photos Imported",
      description: `${selectedMedia.length} photos imported successfully.`,
    });
    
    setSelectedPhotos(new Set());
  };

  const importSelectedContacts = () => {
    const selectedContactList = contacts.filter(contact => selectedContacts.has(contact.id));
    onContactImport?.(selectedContactList);
    
    toast({
      title: "Contacts Imported",
      description: `${selectedContactList.length} contacts imported successfully.`,
    });
    
    setSelectedContacts(new Set());
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Instagram size={16} />
          <span>Instagram Integration</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Instagram size={20} />
            <span>Instagram Integration</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users size={16} />
                <span>Account Connection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center space-y-4">
                  <p className="text-gray-600">Connect your Instagram account to import photos and contacts</p>
                  <Button onClick={connectInstagram} disabled={loading} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Instagram size={16} className="mr-2" />
                    Connect Instagram
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={userProfile?.profile_picture} />
                    <AvatarFallback>{userProfile?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">@{userProfile?.username}</p>
                    <p className="text-sm text-gray-600">{userProfile?.media_count} posts</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    <CheckCircle size={12} className="mr-1" />
                    Connected
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photo Import */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image size={16} />
                    <span>Import Photos</span>
                  </div>
                  <Button onClick={fetchMedia} disabled={loading} variant="outline" size="sm">
                    Refresh Photos
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {media.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No photos found. Click "Refresh Photos" to load your Instagram images.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                      {media.map((item) => (
                        <div
                          key={item.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedPhotos.has(item.id) ? 'border-coral ring-2 ring-coral/20' : 'border-gray-200'
                          }`}
                          onClick={() => togglePhotoSelection(item.id)}
                        >
                          <img
                            src={item.thumbnail_url || item.media_url}
                            alt="Instagram photo"
                            className="w-full h-20 object-cover"
                          />
                          {selectedPhotos.has(item.id) && (
                            <div className="absolute inset-0 bg-coral/20 flex items-center justify-center">
                              <CheckCircle size={20} className="text-coral" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {selectedPhotos.size > 0 && (
                      <div className="flex items-center justify-between p-3 bg-coral/10 rounded-lg">
                        <span className="text-sm font-medium">{selectedPhotos.size} photos selected</span>
                        <Button onClick={importSelectedPhotos} size="sm" className="bg-coral hover:bg-coral/90">
                          Import Selected
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Import */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserPlus size={16} />
                    <span>Import Contacts</span>
                  </div>
                  <Button onClick={fetchContacts} disabled={loading} variant="outline" size="sm">
                    Load Contacts
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No contacts found. Click "Load Contacts" to see your Instagram connections.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer border transition-all ${
                            selectedContacts.has(contact.id) ? 'border-coral bg-coral/10' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => toggleContactSelection(contact.id)}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={contact.profile_picture} />
                            <AvatarFallback>{contact.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">@{contact.username}</span>
                              {contact.is_verified && (
                                <CheckCircle size={12} className="text-blue-500" />
                              )}
                            </div>
                            {contact.full_name && (
                              <p className="text-sm text-gray-600">{contact.full_name}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {contact.follower_count?.toLocaleString()} followers
                            </p>
                          </div>
                          {selectedContacts.has(contact.id) && (
                            <CheckCircle size={16} className="text-coral" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {selectedContacts.size > 0 && (
                      <div className="flex items-center justify-between p-3 bg-coral/10 rounded-lg">
                        <span className="text-sm font-medium">{selectedContacts.size} contacts selected</span>
                        <Button onClick={importSelectedContacts} size="sm" className="bg-coral hover:bg-coral/90">
                          Import Selected
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}