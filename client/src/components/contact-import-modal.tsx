import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Users, FileText, Copy, Share, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (contactData: { firstName: string; lastName: string; phone: string; email: string; }) => void;
}

export function ContactImportModal({ open, onClose, onImport }: ContactImportModalProps) {
  const { toast } = useToast();
  const [importMethod, setImportMethod] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");

  const parseContactText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    let firstName = "";
    let lastName = "";
    let phone = "";
    let email = "";

    // Try to extract name (first line or name pattern)
    const namePattern = /^([A-Za-z]+)\s+([A-Za-z\s]+)$/;
    const firstLine = lines[0];
    if (namePattern.test(firstLine)) {
      const match = firstLine.match(namePattern);
      firstName = match?.[1] || "";
      lastName = match?.[2] || "";
    } else if (firstLine && !firstLine.includes('@') && !firstLine.match(/[\d-\(\)]/)) {
      // If first line doesn't contain email or phone patterns, treat as name
      const nameParts = firstLine.split(' ');
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(' ') || "";
    }

    // Extract phone and email from all lines
    lines.forEach(line => {
      // Phone patterns
      const phonePattern = /[\+]?[\d\s\-\(\)]{7,}/;
      if (phonePattern.test(line) && !phone) {
        phone = line.replace(/[^\d\+\-\(\)\s]/g, '').trim();
      }
      
      // Email pattern
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      if (emailPattern.test(line) && !email) {
        email = line.match(emailPattern)?.[0] || "";
      }
    });

    return { firstName, lastName, phone, email };
  };

  const handleTextImport = () => {
    if (!textInput.trim()) {
      toast({
        title: "No Data",
        description: "Please paste contact information to import.",
        variant: "destructive",
      });
      return;
    }

    const contactData = parseContactText(textInput);
    
    if (!contactData.firstName && !contactData.phone && !contactData.email) {
      toast({
        title: "Invalid Format",
        description: "Could not extract contact information. Please check the format.",
        variant: "destructive",
      });
      return;
    }

    onImport(contactData);
    onClose();
    setTextInput("");
    setImportMethod(null);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (file.name.endsWith('.vcf')) {
        // Parse vCard format
        const lines = content.split('\n');
        let firstName = '';
        let lastName = '';
        let phone = '';
        let email = '';

        lines.forEach(line => {
          if (line.startsWith('FN:')) {
            const fullName = line.substring(3).trim();
            const nameParts = fullName.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          } else if (line.startsWith('TEL:') || line.includes('TYPE=CELL')) {
            phone = line.split(':')[1]?.trim() || '';
          } else if (line.startsWith('EMAIL:')) {
            email = line.split(':')[1]?.trim() || '';
          }
        });

        onImport({ firstName, lastName, phone, email });
      } else {
        // Parse as plain text
        const contactData = parseContactText(content);
        onImport(contactData);
      }
      
      onClose();
      setImportMethod(null);
      toast({
        title: "Contact Imported",
        description: "Successfully imported contact from file.",
      });
    };

    reader.readAsText(file);
  };

  const copyInstructions = (method: string) => {
    let instructions = "";
    
    switch (method) {
      case "ios-share":
        instructions = "1. Open Contacts app on your iPhone\n2. Find and tap the contact\n3. Tap 'Share Contact'\n4. Choose 'Copy' or 'AirDrop to yourself'\n5. Come back and paste here";
        break;
      case "android-share":
        instructions = "1. Open Contacts app on Android\n2. Find and tap the contact\n3. Tap the share icon (three dots menu)\n4. Choose 'Share' and select 'Copy to clipboard'\n5. Come back and paste here";
        break;
      case "manual":
        instructions = "Copy and paste contact info in this format:\nJohn Doe\n(555) 123-4567\njohn@email.com";
        break;
    }

    navigator.clipboard.writeText(instructions);
    toast({
      title: "Instructions Copied",
      description: "Paste these instructions in your notes app for reference.",
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Contact</DialogTitle>
        </DialogHeader>

        {!importMethod ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Choose how you'd like to import contact information:</p>
            
            <div className="grid gap-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("paste")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <Copy className="text-blue-500" size={24} />
                  <div>
                    <h3 className="font-medium">Copy & Paste</h3>
                    <p className="text-sm text-gray-500">Paste contact details directly</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("file")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <Upload className="text-green-500" size={24} />
                  <div>
                    <h3 className="font-medium">Upload File</h3>
                    <p className="text-sm text-gray-500">Import vCard (.vcf) or text file</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("ios-share")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <Smartphone className="text-gray-500" size={24} />
                  <div>
                    <h3 className="font-medium">iPhone/iPad</h3>
                    <p className="text-sm text-gray-500">Share from Contacts app</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("android-share")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <Users className="text-green-600" size={24} />
                  <div>
                    <h3 className="font-medium">Android</h3>
                    <p className="text-sm text-gray-500">Share from Contacts app</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : importMethod === "paste" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-text">Paste Contact Information</Label>
              <Textarea
                id="contact-text"
                placeholder="Example:&#10;John Doe&#10;(555) 123-4567&#10;john@email.com"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
                className="mt-2"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleTextImport} className="flex-1">
                Import Contact
              </Button>
              <Button variant="outline" onClick={() => setImportMethod(null)}>
                Back
              </Button>
            </div>
          </div>
        ) : importMethod === "file" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-file">Choose File</Label>
              <Input
                id="contact-file"
                type="file"
                accept=".vcf,.txt"
                onChange={handleFileImport}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supports vCard (.vcf) files or plain text files
              </p>
            </div>
            <Button variant="outline" onClick={() => setImportMethod(null)} className="w-full">
              Back
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Instructions for {importMethod === "ios-share" ? "iPhone/iPad" : "Android"}:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Open your Contacts app</li>
                <li>Find and tap the contact you want to import</li>
                <li>Tap the Share button {importMethod === "ios-share" ? "(square with arrow)" : "(three dots or share icon)"}</li>
                <li>Choose "Share Contact" or "Copy"</li>
                <li>Come back here and use "Copy & Paste" option</li>
              </ol>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => copyInstructions(importMethod)} variant="outline" className="flex-1">
                Copy Instructions
              </Button>
              <Button onClick={() => setImportMethod("paste")} className="flex-1">
                Ready to Paste
              </Button>
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