import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, ExternalLink, AlertCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstagramImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (contactData: { firstName: string; lastName: string; phone: string; email: string; photo?: string; }) => void;
}

export function InstagramImportModal({ open, onClose, onImport }: InstagramImportModalProps) {
  const [username, setUsername] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Username Required",
        description: "Please enter an Instagram username.",
      });
      return;
    }

    const cleanUsername = username.replace(/^@/, '');
    const instagramUrl = `https://www.instagram.com/${cleanUsername}/`;
    
    setProfileUrl(instagramUrl);
    setShowInstructions(true);
    
    toast({
      title: "Profile Link Ready",
      description: `Ready to visit @${cleanUsername}'s profile`,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Profile URL copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy to clipboard",
      });
    }
  };

  const openInstagramProfile = () => {
    window.open(profileUrl, '_blank');
  };

  const handleManualImport = () => {
    const cleanUsername = username.replace(/^@/, '');
    onImport({
      firstName: cleanUsername,
      lastName: "",
      phone: "",
      email: "",
    });
    
    toast({
      title: "Contact Added",
      description: `Added @${cleanUsername} - upload photo manually when editing`,
    });
    
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setUsername("");
    setShowInstructions(false);
    setProfileUrl("");
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
          {!showInstructions ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Manual Photo Import</h4>
                    <p className="text-sm text-amber-700">
                      Instagram blocks automated access. We'll help you visit the profile and save the photo manually.
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
                      size="sm"
                      className="px-4"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3">How to Save Profile Photo</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal ml-4">
                  <li>Click "Visit Profile" to open Instagram in a new tab</li>
                  <li>Right-click on the profile photo</li>
                  <li>Select "Save image as..." or "Download image"</li>
                  <li>Save the image to your device</li>
                  <li>Return here and add the contact</li>
                  <li>Upload the saved photo when editing the friend</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Instagram className="text-purple-600" size={20} />
                  <span className="flex-1 text-sm font-mono truncate">{profileUrl}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(profileUrl)}
                    className="px-2"
                  >
                    <Copy size={14} />
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={openInstagramProfile}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Visit Profile
                    <ExternalLink size={16} className="ml-2" />
                  </Button>
                  <Button 
                    onClick={handleManualImport}
                    variant="outline"
                    className="flex-1"
                  >
                    Add Contact
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="text-center">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}