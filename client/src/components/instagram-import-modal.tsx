import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, User, Search, Link, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InstagramImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (contactData: { firstName: string; lastName: string; phone: string; email: string; }) => void;
}

export function InstagramImportModal({ open, onClose, onImport }: InstagramImportModalProps) {
  const { toast } = useToast();
  const [importMethod, setImportMethod] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  const handleUsernameImport = () => {
    if (!username.trim()) {
      toast({
        title: "No Username",
        description: "Please enter an Instagram username to import.",
        variant: "destructive",
      });
      return;
    }

    // Clean username (remove @ if present)
    const cleanUsername = username.replace(/^@/, '').trim();
    
    // Basic validation
    if (!/^[a-zA-Z0-9._]+$/.test(cleanUsername)) {
      toast({
        title: "Invalid Username",
        description: "Please enter a valid Instagram username.",
        variant: "destructive",
      });
      return;
    }

    // Extract potential name from username
    let firstName = "";
    let lastName = "";
    
    // Try to parse common username patterns
    const nameParts = cleanUsername.split(/[._]/);
    if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else {
      firstName = cleanUsername;
    }

    // Capitalize first letters
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

    const contactData = {
      firstName,
      lastName,
      phone: "",
      email: "",
    };

    onImport(contactData);
    onClose();
    setUsername("");
    setImportMethod(null);

    toast({
      title: "Instagram Contact Added",
      description: `Added ${firstName} ${lastName} from Instagram @${cleanUsername}`,
    });
  };

  const connectInstagram = () => {
    // Redirect to Instagram OAuth
    window.location.href = '/api/instagram/auth';
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Instagram className="text-pink-500" size={24} />
            <span>Import from Instagram</span>
          </DialogTitle>
        </DialogHeader>

        {!importMethod ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Choose how you'd like to import from Instagram:</p>
            
            <div className="grid gap-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("username")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <User className="text-blue-500" size={24} />
                  <div>
                    <h3 className="font-medium">Add by Username</h3>
                    <p className="text-sm text-gray-500">Enter an Instagram username to add as contact</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("connect")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <Link className="text-green-500" size={24} />
                  <div>
                    <h3 className="font-medium">Connect Instagram Account</h3>
                    <p className="text-sm text-gray-500">Import from your followers list</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("guide")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <Search className="text-purple-500" size={24} />
                  <div>
                    <h3 className="font-medium">Manual Search Guide</h3>
                    <p className="text-sm text-gray-500">Tips for finding Instagram contacts</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : importMethod === "username" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="instagram-username">Instagram Username</Label>
              <Input
                id="instagram-username"
                placeholder="@username or username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the Instagram username (with or without @)
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="text-blue-500 mt-0.5" size={16} />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Note:</p>
                  <p>This will create a contact entry with the username. You can add phone/email details later.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleUsernameImport} className="flex-1">
                Add Contact
              </Button>
              <Button variant="outline" onClick={() => setImportMethod(null)}>
                Back
              </Button>
            </div>
          </div>
        ) : importMethod === "connect" ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Connect Your Instagram</h3>
              <p className="text-sm text-gray-600 mb-3">
                Connect your Instagram account to import contacts from your followers list.
              </p>
              <Button onClick={connectInstagram} className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                <Instagram size={16} className="mr-2" />
                Connect Instagram
              </Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">What this does:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Securely connects to your Instagram account</li>
                <li>• Imports public profile information of your followers</li>
                <li>• Creates contact entries you can edit and enhance</li>
                <li>• Does not post or access private data</li>
              </ul>
            </div>

            <Button variant="outline" onClick={() => setImportMethod(null)} className="w-full">
              Back
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Finding Instagram Contacts</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>1. Search by name:</strong> Use Instagram's search to find people by their real name</p>
                <p><strong>2. Mutual connections:</strong> Check "Suggested for you" in Instagram</p>
                <p><strong>3. Contact sync:</strong> Enable "Connect Contacts" in Instagram settings</p>
                <p><strong>4. Location tags:</strong> Look at location-based posts in your area</p>
                <p><strong>5. Hashtags:</strong> Search local hashtags to find nearby people</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Pro tip:</h4>
              <p className="text-xs text-gray-600">
                Once you find someone on Instagram, come back here and use "Add by Username" to quickly create a contact entry.
              </p>
            </div>

            <Button variant="outline" onClick={() => setImportMethod(null)} className="w-full">
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}