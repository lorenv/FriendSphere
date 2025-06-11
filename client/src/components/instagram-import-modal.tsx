import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, ExternalLink, AlertCircle, Image, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstagramMedia {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

interface InstagramImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (contactData: { firstName: string; lastName: string; phone: string; email: string; photo?: string; }) => void;
}

export function InstagramImportModal({ open, onClose, onImport }: InstagramImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/instagram/profile');
      if (response.ok) {
        setIsConnected(true);
        loadMedia();
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/instagram/media');
      if (response.ok) {
        const mediaData = await response.json();
        const imageMedia = mediaData.data?.filter((item: InstagramMedia) => 
          item.media_type === 'IMAGE' || item.media_type === 'CAROUSEL_ALBUM'
        ).slice(0, 12) || [];
        setMedia(imageMedia);
      }
    } catch (error) {
      console.error('Failed to load Instagram media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramConnect = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/instagram/auth');
      const data = await response.json();
      
      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Instagram API not configured');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Instagram Setup Required",
        description: "Please configure Instagram API credentials (INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET). See INSTAGRAM_SETUP.md for setup instructions.",
      });
      setLoading(false);
    }
  };

  const handlePhotoImport = () => {
    if (selectedPhoto) {
      onImport({
        firstName: "Instagram",
        lastName: "Import",
        phone: "",
        email: "",
        photo: selectedPhoto
      });
      
      toast({
        title: "Photo Imported",
        description: "Instagram photo has been imported for profile picture.",
      });
      
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Instagram className="text-purple-600" size={24} />
            <span>Import from Instagram</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isConnected ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Instagram API No Longer Available</h4>
                    <p className="text-sm text-amber-700 mb-2">
                      Meta has discontinued Instagram Basic Display API for new developers. Instead, use these working alternatives:
                    </p>
                    <ul className="text-xs text-amber-600 space-y-1 ml-4 list-disc">
                      <li><strong>Photo Upload:</strong> Select images directly from your device</li>
                      <li><strong>OCR Import:</strong> Screenshot contact info for automatic extraction</li>
                      <li><strong>vCard Import:</strong> Import standard contact files</li>
                    </ul>
                    <p className="text-xs text-amber-600 mt-2">
                      These methods work reliably without API restrictions.
                    </p>
                  </div>
                </div>
              </div>

              <Card className="border-dashed border-gray-300">
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-3 bg-gray-200 rounded-2xl opacity-60">
                      <Instagram className="text-gray-500" size={32} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-600">Instagram Integration Unavailable</h3>
                      <p className="text-gray-500 text-sm mb-4">
                        API access has been restricted by Meta. Use the alternative import methods above instead.
                      </p>
                    </div>
                    <Button 
                      disabled={true}
                      variant="outline"
                      className="w-full opacity-50 cursor-not-allowed"
                    >
                      No Longer Available
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <h4 className="font-medium text-green-800 mb-2">Recommended: Use Photo Upload</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Save Instagram photos to your device, then upload them when adding friends.
                  </p>
                  <Button 
                    onClick={onClose}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add Friend with Photo Upload
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Check className="text-green-600" size={16} />
                  <span className="text-sm font-medium text-green-800">Instagram Connected</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Select a photo to import:</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : media.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {media.map((item) => (
                      <div 
                        key={item.id}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedPhoto === item.media_url 
                            ? 'border-purple-500 ring-2 ring-purple-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPhoto(item.media_url)}
                      >
                        <img 
                          src={item.thumbnail_url || item.media_url} 
                          alt="Instagram media"
                          className="w-full h-full object-cover"
                        />
                        {selectedPhoto === item.media_url && (
                          <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                            <Check className="text-white" size={24} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Image size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No photos found</p>
                  </div>
                )}
              </div>

              {selectedPhoto && (
                <Button onClick={handlePhotoImport} className="w-full">
                  Import Selected Photo
                </Button>
              )}
            </>
          )}

          <div className="text-center">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}