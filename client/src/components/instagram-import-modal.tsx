import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Search, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstagramImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (contactData: { firstName: string; lastName: string; phone: string; email: string; photo?: string; }) => void;
}

export function InstagramImportModal({ open, onClose, onImport }: InstagramImportModalProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [foundUsername, setFoundUsername] = useState<string>("");
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Username Required",
        description: "Please enter an Instagram username to search.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/instagram/profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setProfilePhoto(data.profilePhotoUrl);
        setFoundUsername(data.username);
        toast({
          title: "Profile Found",
          description: `Found profile photo for @${data.username}`,
        });
      } else {
        throw new Error(JSON.stringify(data));
      }
    } catch (error) {
      let errorMessage = "Could not find profile or account may be private. Try uploading the photo manually instead.";
      let errorTitle = "Profile Not Found";
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.suggestion) {
          errorMessage = errorData.suggestion;
        }
        if (errorData.details) {
          errorMessage += ` (${errorData.details})`;
        }
      } catch {
        // Use default message if JSON parsing fails
      }
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
      });
      setProfilePhoto("");
      setFoundUsername("");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (profilePhoto && foundUsername) {
      onImport({
        firstName: foundUsername,
        lastName: "",
        phone: "",
        email: "",
        photo: profilePhoto
      });
      
      toast({
        title: "Profile Imported",
        description: `Imported profile photo for @${foundUsername}`,
      });
      
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setUsername("");
    setProfilePhoto("");
    setFoundUsername("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Instagram className="text-purple-600" size={24} />
            <span>Import Instagram Profile</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Profile Photo Finder</h4>
                <p className="text-sm text-blue-700">
                  Enter an Instagram username to automatically fetch their profile photo. Works with public accounts only.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="username">Instagram Username</Label>
              <div className="flex space-x-2 mt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">@</span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="pl-8"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={loading}
                  size="sm"
                  className="px-4"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search size={16} />
                  )}
                </Button>
              </div>
            </div>

            {profilePhoto && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={profilePhoto} 
                      alt={`@${foundUsername}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Check className="text-green-600" size={16} />
                      <span className="font-medium text-green-800">Profile Found</span>
                    </div>
                    <p className="text-sm text-green-700">@{foundUsername}</p>
                    <p className="text-xs text-green-600 mt-1">Ready to import profile photo</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            {profilePhoto && (
              <Button onClick={handleImport} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Import Profile
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}