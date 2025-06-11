import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Users, FileText, Copy, Share, Smartphone, Camera, Loader2, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createWorker } from 'tesseract.js';

interface ContactImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (contactData: { firstName: string; lastName: string; phone: string; email: string; photo?: string; birthday?: string; }) => void;
}

export function ContactImportModal({ open, onClose, onImport }: ContactImportModalProps) {
  const { toast } = useToast();
  const [importMethod, setImportMethod] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [username, setUsername] = useState("");

  const parseContactText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    let firstName = "";
    let lastName = "";
    let phone = "";
    let email = "";
    let birthday = "";

    // Enhanced patterns for different contact formats
    const phonePatterns = [
      /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g, // US format
      /(\+?[0-9]{1,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4})/g, // International
      /(mobile|cell|phone|tel)[:\s]+([0-9\+\-\.\s\(\)]+)/gi, // Labeled phone
    ];
    
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    
    // Birthday patterns
    const birthdayPatterns = [
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(,?\s+\d{4})?/gi,
      /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
      /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g,
    ];
    
    // Priority-based name extraction for contact app screenshots
    let nameFound = false;
    interface NameCandidate {
      name: string;
      priority: number;
      index: number;
    }
    const possibleNames: NameCandidate[] = [];
    
    lines.forEach((line, index) => {
      // Skip obvious non-name lines and contact app interface elements
      if (line.match(/^(mobile|cell|phone|email|home|work|main|tel|contact|message|call|video|facetime|add to|notes|share|edit|birthday|address|company|job|department)/i)) return;
      if (line.match(/^[0-9\+\-\.\s\(\)@]+$/)) return; // Skip pure number/email lines
      if (line.length < 2) return; // Skip single characters
      if (line.match(/^(www\.|http|\.com|\.org)/i)) return; // Skip URLs
      if (line.match(/^(shared by|contact photo|poster|september|january|february|march|april|may|june|july|august|october|november|december)/i)) return; // Skip contact app labels
      if (line.match(/^[A-Z\s]+$/)) return; // Skip all-caps lines (often labels like "JULIAS FRIEND MIAMA")
      
      // Collect potential names with priority scoring
      if (line.match(/^[a-zA-Z\s\.'-]+$/)) {
        const cleanName = line.replace(/^(contact|name)[:\s]*/gi, '').trim();
        const wordCount = cleanName.split(/\s+/).length;
        
        // Priority scoring system optimized for contact apps
        let priority = 0;
        
        // Perfect name pattern (Title Case with 2-3 words)
        if (cleanName.match(/^[A-Z][a-z]+ [A-Z][a-z]+( [A-Z][a-z]+)?$/)) priority += 20;
        
        // Good name patterns
        if (wordCount >= 2 && wordCount <= 3) priority += 10; // 2-3 words ideal for names
        if (cleanName.match(/^[A-Z][a-z]+$/)) priority += 8; // Single title case word (first name)
        
        // Position-based scoring (real names often appear after labels in contact apps)
        if (index >= 2 && index <= 5) priority += 8; // Names often in middle of contact info
        if (index <= 1) priority += 2; // First lines sometimes have labels
        
        // Length-based scoring
        if (cleanName.length >= 6 && cleanName.length <= 25) priority += 5; // Good name length
        if (cleanName.length > 30) priority -= 10; // Very long lines unlikely to be names
        
        // Penalize lines that look like labels or descriptions
        if (cleanName.includes('FRIEND') || cleanName.includes('FAMILY') || cleanName.includes('WORK')) priority -= 15;
        
        possibleNames.push({
          name: cleanName,
          priority: priority,
          index: index
        });
      }
    });

    // Select the highest priority name
    if (possibleNames.length > 0) {
      possibleNames.sort((a, b) => b.priority - a.priority);
      const bestName = possibleNames[0].name;
      const nameParts = bestName.split(/\s+/);
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(' ') || "";
      nameFound = true;
    }

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

    // Extract birthday
    birthdayPatterns.forEach(pattern => {
      if (!birthday) {
        const matches = allText.match(pattern);
        if (matches) {
          birthday = matches[0];
        }
      }
    });

    return { firstName, lastName, phone, email, birthday };
  };

  const processScreenshot = async (file: File) => {
    setIsProcessing(true);
    try {
      const worker = await createWorker('eng');
      
      // Configure for better text recognition - optimized for contact screenshots
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.-+()[] \'"',
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log('Extracted OCR text:', text); // Debug log
      setExtractedText(text);
      
      const contactData = parseContactText(text);
      console.log('Parsed contact data:', contactData); // Debug log
      
      if (!contactData.firstName && !contactData.phone && !contactData.email) {
        toast({
          title: "No Contact Info Found",
          description: "Could not extract contact information from the image. You can see the extracted text below and manually edit it.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Show success message with extracted info
      const extractedInfo = [];
      if (contactData.firstName) extractedInfo.push(`Name: ${contactData.firstName} ${contactData.lastName}`.trim());
      if (contactData.phone) extractedInfo.push(`Phone: ${contactData.phone}`);
      if (contactData.email) extractedInfo.push(`Email: ${contactData.email}`);
      if (contactData.birthday) extractedInfo.push(`Birthday: ${contactData.birthday}`);

      toast({
        title: "Contact Extracted!",
        description: extractedInfo.join(', '),
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

  const handleInstagramImport = () => {
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
        // Parse vCard format with enhanced field support
        const lines = content.split('\n');
        let firstName = '';
        let lastName = '';
        let phone = '';
        let email = '';
        let birthday = '';
        let photo = '';

        console.log('Full vCard content first 2000 chars:', content.substring(0, 2000));
        
        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          
          // Only log first 20 lines to avoid spam
          if (index < 20) {
            console.log(`Line ${index}:`, trimmedLine);
          }
          
          // Parse name fields
          if (trimmedLine.startsWith('FN:')) {
            const fullName = trimmedLine.substring(3).trim();
            const nameParts = fullName.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          } else if (trimmedLine.startsWith('N:')) {
            // Structured name: Last;First;Middle;Prefix;Suffix
            const nameParts = trimmedLine.substring(2).split(';');
            if (nameParts[1]) firstName = nameParts[1].trim();
            if (nameParts[0]) lastName = nameParts[0].trim();
          }
          
          // Enhanced phone number parsing with multiple approaches
          else if (trimmedLine.includes('TEL') || trimmedLine.includes('PHONE')) {
            // Handle various TEL formats:
            // TEL:+1234567890
            // TEL;TYPE=CELL:+1234567890  
            // TEL;VOICE:+1234567890
            // TEL;TYPE=HOME,VOICE:+1234567890
            // item1.TEL:+1234567890
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex > -1) {
              const phoneValue = trimmedLine.substring(colonIndex + 1).trim();
              // Clean phone number (remove any non-phone characters at start/end)
              const cleanPhone = phoneValue.replace(/^[^+0-9]*/, '').replace(/[^+0-9()-\s]*$/, '');
              if (cleanPhone && cleanPhone.length >= 7 && !phone) { // Take first valid phone number found
                phone = cleanPhone;
                console.log('Found phone in vCard:', cleanPhone);
              }
            }
          }
          
          // Parse email
          else if (trimmedLine.startsWith('EMAIL:') || trimmedLine.includes('EMAIL')) {
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex > -1) {
              const emailValue = trimmedLine.substring(colonIndex + 1).trim();
              if (emailValue && !email) {
                email = emailValue;
              }
            }
          }
          
          // Parse birthday with more flexible matching
          else if (trimmedLine.includes('BDAY')) {
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex > -1) {
              birthday = trimmedLine.substring(colonIndex + 1).trim();
              // Convert Apple's format to standard date
              if (birthday.includes('-')) {
                const parts = birthday.split('-');
                if (parts.length === 3 && parts[0] !== '1604') { // Skip Apple's default year
                  birthday = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                } else if (parts.length === 3) {
                  birthday = `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
              }
              console.log('Found birthday in vCard:', birthday);
            }
          }
          
          // Parse photo with more flexible matching
          else if (trimmedLine.includes('PHOTO')) {
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex > -1) {
              let photoData = trimmedLine.substring(colonIndex + 1).trim();
              
              // Handle multi-line base64 photos (continue reading subsequent lines)
              if (photoData.length > 0 && !photoData.startsWith('http')) {
                // This is likely base64 data, possibly spanning multiple lines
                let photoLines = [photoData];
                let currentIndex = index;
                
                // Look ahead for continuation lines until we hit another vCard field or END
                while (currentIndex + 1 < lines.length) {
                  const nextLine = lines[currentIndex + 1].trim();
                  if (nextLine.includes(':') || nextLine.startsWith('END:')) {
                    break;
                  }
                  photoLines.push(nextLine);
                  currentIndex++;
                }
                
                photoData = photoLines.join('');
                console.log('Assembled photo data length:', photoData.length);
                
                // Only use if it looks like valid base64 or URL
                if (photoData.startsWith('http') || photoData.startsWith('data:') || 
                   (photoData.length > 100 && /^[A-Za-z0-9+/=]+$/.test(photoData))) {
                  
                  // Allow photos up to 1MB base64 since server limit is 10MB
                  if (photoData.length > 1000000) {
                    console.log('Skipping extremely large photo to avoid server size limit:', photoData.length);
                    toast({
                      title: "Large Photo Skipped",
                      description: "Profile photo was too large to import (over 1MB). Contact imported without photo.",
                    });
                  } else {
                    photo = photoData.startsWith('data:') ? photoData : `data:image/jpeg;base64,${photoData}`;
                    console.log('Successfully prepared photo for import (length):', photoData.length);
                  }
                } else {
                  console.log('Photo data did not pass validation checks');
                }
              }
            }
          }
        });

        console.log('Final vCard parsed data:', { firstName, lastName, phone, email, birthday, photo });
        onImport({ firstName, lastName, phone, email, birthday, photo });
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

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setImportMethod("instagram")}>
                <CardContent className="p-4 flex items-center space-x-3">
                  <Instagram className="text-pink-500" size={24} />
                  <div>
                    <h3 className="font-medium">Instagram</h3>
                    <p className="text-sm text-gray-500">Import by username or connect account</p>
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
                <Label>Extracted Text (you can edit this):</Label>
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="text-sm max-h-32"
                  rows={4}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => {
                      const contactData = parseContactText(extractedText);
                      if (contactData.firstName || contactData.phone || contactData.email) {
                        onImport(contactData);
                        onClose();
                        setExtractedText("");
                        setImportMethod(null);
                        toast({
                          title: "Contact Imported",
                          description: "Successfully imported edited contact information.",
                        });
                      } else {
                        toast({
                          title: "No Contact Info",
                          description: "Please add at least a name, phone, or email.",
                          variant: "destructive",
                        });
                      }
                    }}
                    size="sm"
                    className="flex-1"
                  >
                    Import Edited Text
                  </Button>
                  <Button 
                    onClick={() => setExtractedText("")}
                    variant="outline"
                    size="sm"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Tips for best results:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Use the contact edit screen</strong> instead of the main contact card</li>
                <li>• Take clear, well-lit screenshots with good contrast</li>
                <li>• Ensure text is not blurry or too small</li>
                <li>• Contact edit screens have cleaner text layouts</li>
                <li>• Works with contact apps, business cards, notes, text messages</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Test vCard Import:</h4>
              <Button 
                onClick={() => {
                  const testVCard = `BEGIN:VCARD
VERSION:3.0
FN:Test User
N:User;Test;;;
TEL;TYPE=CELL:+1234567890
EMAIL:test@example.com
BDAY:1990-01-01
END:VCARD`;
                  
                  const lines = testVCard.split('\n');
                  let firstName = '', lastName = '', phone = '', email = '', birthday = '';
                  
                  lines.forEach(line => {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('FN:')) {
                      const fullName = trimmedLine.substring(3).trim();
                      const nameParts = fullName.split(' ');
                      firstName = nameParts[0] || '';
                      lastName = nameParts.slice(1).join(' ') || '';
                    } else if (trimmedLine.includes('TEL')) {
                      const colonIndex = trimmedLine.indexOf(':');
                      if (colonIndex > -1) {
                        phone = trimmedLine.substring(colonIndex + 1).trim();
                      }
                    } else if (trimmedLine.includes('EMAIL')) {
                      const colonIndex = trimmedLine.indexOf(':');
                      if (colonIndex > -1) {
                        email = trimmedLine.substring(colonIndex + 1).trim();
                      }
                    } else if (trimmedLine.startsWith('BDAY:')) {
                      birthday = trimmedLine.substring(5).trim();
                    }
                  });
                  
                  onImport({ firstName, lastName, phone, email, birthday });
                  onClose();
                  setImportMethod(null);
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Test Import
              </Button>
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
        ) : importMethod === "instagram" ? (
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
            
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Instagram className="text-pink-500" size={16} />
                <span className="font-medium text-sm">Instagram Import</span>
              </div>
              <p className="text-sm text-gray-600">
                This creates a contact entry with the username. You can add phone/email details later by editing the contact.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleInstagramImport} className="flex-1">
                Add Contact
              </Button>
              <Button variant="outline" onClick={() => setImportMethod(null)}>
                Back
              </Button>
            </div>
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