import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Mail, Upload, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoImportModalProps {
  open: boolean;
  onClose: () => void;
  onPhotoSelect: (photoUrl: string) => void;
  currentEmail?: string;
}

export function PhotoImportModal({ open, onClose, onPhotoSelect, currentEmail = "" }: PhotoImportModalProps) {
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [foundPhoto, setFoundPhoto] = useState<string>("");
  const { toast } = useToast();

  const handleGravatarLookup = async () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter an email address to search for Gravatar photo.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/gravatar/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setFoundPhoto(data.highResUrl);
        toast({
          title: "Photo Found",
          description: `Found Gravatar photo for ${email}`,
        });
      } else {
        toast({
          title: "No Photo Found",
          description: "No Gravatar photo found for this email address.",
        });
        setFoundPhoto("");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lookup Failed",
        description: "Could not check for Gravatar photo.",
      });
      setFoundPhoto("");
    } finally {
      setLoading(false);
    }
  };

  const handleUsePhoto = () => {
    if (foundPhoto) {
      onPhotoSelect(foundPhoto);
      toast({
        title: "Photo Selected",
        description: "Gravatar photo has been selected.",
      });
      onClose();
      resetForm();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotoSelect(result);
        toast({
          title: "Photo Uploaded",
          description: "Photo has been uploaded successfully.",
        });
        onClose();
        resetForm();
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEmail(currentEmail);
    setFoundPhoto("");
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
            <Camera className="text-blue-600" size={24} />
            <span>Add Profile Photo</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Photo Options</h4>
                <p className="text-sm text-blue-700">
                  Search for Gravatar photos by email address, or upload a photo directly from your device.
                </p>
              </div>
            </div>
          </div>

          {/* Gravatar Lookup */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail size={16} />
                <span>Find Gravatar Photo</span>
              </Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  onKeyPress={(e) => e.key === 'Enter' && handleGravatarLookup()}
                />
                <Button 
                  onClick={handleGravatarLookup} 
                  disabled={loading}
                  size="sm"
                  className="px-4"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </div>

            {foundPhoto && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={foundPhoto} alt="Gravatar" />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Check className="text-green-600" size={16} />
                      <span className="font-medium text-green-800">Photo Found</span>
                    </div>
                    <p className="text-sm text-green-700">{email}</p>
                    <Button 
                      onClick={handleUsePhoto}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 mt-2"
                    >
                      Use This Photo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="border-t pt-4">
            <Label className="flex items-center space-x-2 mb-3">
              <Upload size={16} />
              <span>Upload Photo</span>
            </Label>
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>
          </div>

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