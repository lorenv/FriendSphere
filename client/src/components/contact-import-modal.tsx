import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Users, FileText, Copy, Share, Smartphone, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createWorker } from 'tesseract.js';

interface ContactImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (contactData: { firstName: string; lastName: string; phone: string; email: string; }) => void;
}

export function ContactImportModal({ open, onClose, onImport }: ContactImportModalProps) {
  const { toast } = useToast();
  const [importMethod, setImportMethod] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const parseContactText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    let firstName = "";
    let lastName = "";
    let phone = "";
    let email = "";

    // Enhanced patterns for different contact formats
    const phonePatterns = [
      /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g, // US format
      /(\+?[0-9]{1,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4})/g, // International
      /(mobile|cell|phone|tel)[:\s]+([0-9\+\-\.\s\(\)]+)/gi, // Labeled phone
    ];
    
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    
    // Look for name patterns - often first non-phone/email line
    let nameFound = false;
    lines.forEach((line, index) => {
      // Skip lines that look like labels or system text
      if (line.match(/^(mobile|cell|phone|email|home|work|main|tel|contact)/i)) return;
      if (line.match(/^[0-9\+\-\.\s\(\)@]+$/)) return; // Skip pure number/email lines
      
      // Extract name if not found yet
      if (!nameFound && line.length > 1 && line.match(/^[a-zA-Z\s\.'-]+$/)) {
        const cleanName = line.replace(/^(contact|name)[:\s]*/gi, '').trim();
        const nameParts = cleanName.split(/\s+/);
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(' ') || "";
        nameFound = true;
      }
    });

    // Extract phone numbers
    const allText = lines.join(' ');
    phonePatterns.forEach(pattern => {
      if (!phone) {
        const matches = allText.match(pattern);
        if (matches) {
          phone = matches[0].replace(/[^0-9\+\-\(\)\s]/g, '').trim();
        }
      }
    });

    // Extract email
    const emailMatch = allText.match(emailPattern);
    if (emailMatch) {
      email = emailMatch[0];
    }

    return { firstName, lastName, phone, email };
  };

  const processScreenshot = async (file: File) => {
    setIsProcessing(true);
    try {
      const worker = await createWorker('eng');
      
      // Configure for better text recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.-+()[] ',
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      setExtractedText(text);
      const contactData = parseContactText(text);
      
      if (!contactData.firstName && !contactData.phone && !contactData.email) {
        toast({
          title: "No Contact Info Found",
          description: "Could not extract contact information from the image. Try a clearer photo or manual entry.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: "Contact Extracted!",
        description: "Successfully extracted contact information from screenshot.",
      });

      onImport(contactData);
      onClose();
      setExtractedText("");
      setImportMethod(null);
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process the image. Please try again or use manual entry.",
        variant: "destructive",
      });
    }
    setIsProcessing(false);
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

    // Check if it's an image file for OCR processing
    if (file.type.startsWith('image/')) {
      processScreenshot(file);
      return;
    }

    // Handle text files (vCard, CSV, etc.)
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
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("screenshot")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <Camera className="text-purple-500" size={24} />
                  <div>
                    <h3 className="font-medium">Screenshot Import</h3>
                    <p className="text-sm text-gray-500">Upload screenshot of contact info</p>
                  </div>
                </CardContent>
              </Card>

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
        ) : importMethod === "screenshot" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="screenshot-file">Upload Screenshot</Label>
              <Input
                id="screenshot-file"
                type="file"
                accept="image/*"
                onChange={handleFileImport}
                className="mt-2"
                disabled={isProcessing}
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload a screenshot of contact info, business card, or any text containing contact details
              </p>
            </div>
            
            {isProcessing && (
              <div className="flex items-center justify-center space-x-2 p-4 bg-blue-50 rounded-lg">
                <Loader2 className="animate-spin text-blue-500" size={20} />
                <span className="text-sm text-blue-700">Processing image... This may take a moment</span>
              </div>
            )}

            {extractedText && !isProcessing && (
              <div className="space-y-2">
                <Label>Extracted Text:</Label>
                <div className="p-3 bg-gray-50 rounded border text-sm max-h-32 overflow-y-auto">
                  {extractedText}
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Tips for best results:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Take clear, well-lit screenshots</li>
                <li>• Ensure text is not blurry or too small</li>
                <li>• Include name, phone, and email in the image</li>
                <li>• Works with contact apps, business cards, notes</li>
              </ul>
            </div>

            <Button variant="outline" onClick={() => setImportMethod(null)} className="w-full" disabled={isProcessing}>
              Back
            </Button>
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
                accept=".vcf,.txt,image/*"
                onChange={handleFileImport}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supports vCard (.vcf), text files, or images (will use OCR)
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