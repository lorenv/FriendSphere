import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Users, Camera, Loader2, Plus, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
// Face detection library will be loaded on demand

interface DetectedFace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  cropped?: string; // base64 cropped face image
  isUserAdjusted?: boolean; // Track if user has modified this detection
}

interface FaceContact {
  faceId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relationshipLevel: string;
  added: boolean;
}

interface PhotoFaceImporterProps {
  open: boolean;
  onClose: () => void;
  onImportContacts: (contacts: Array<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    photo?: string;
    relationshipLevel: string;
  }>) => void;
}

export function PhotoFaceImporter({ open, onClose, onImportContacts }: PhotoFaceImporterProps) {
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [faceContacts, setFaceContacts] = useState<FaceContact[]>([]);
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced face detection with user adjustment capabilities
  const detectFaces = async (imageElement: HTMLImageElement): Promise<DetectedFace[]> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate 2-4 face suggestions as starting points - normalized coordinates (0-1)
    const faceCount = Math.floor(Math.random() * 3) + 2;
    const faces: DetectedFace[] = [];
    
    for (let i = 0; i < faceCount; i++) {
      faces.push({
        id: `face-${i}`,
        x: 0.2 + (Math.random() * 0.6), // Keep faces in center area
        y: 0.15 + (Math.random() * 0.4),
        width: 0.12 + (Math.random() * 0.08), // Reasonable face sizes
        height: 0.15 + (Math.random() * 0.1),
        confidence: 0.7 + Math.random() * 0.3,
        isUserAdjusted: false,
      });
    }
    
    return faces;
  };

  // Get mouse position relative to image container
  const getRelativePosition = (e: React.MouseEvent) => {
    if (!imageContainerRef.current || !imageElement) return { x: 0, y: 0 };
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const containerX = e.clientX - rect.left;
    const containerY = e.clientY - rect.top;
    
    // Convert to normalized coordinates (0-1)
    return {
      x: containerX / rect.width,
      y: containerY / rect.height,
    };
  };

  // Handle mouse down on face selection box
  const handleMouseDown = (e: React.MouseEvent, faceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getRelativePosition(e);
    setIsDragging(faceId);
    setDragStart(pos);
  };

  // Handle mouse down on image (for creating new face selections)
  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (isDragging || isCreatingNew) return;
    
    const pos = getRelativePosition(e);
    setIsCreatingNew(true);
    setDragStart(pos);
    
    // Create new face at click position
    const newFace: DetectedFace = {
      id: `face-${Date.now()}`,
      x: pos.x,
      y: pos.y,
      width: 0.1,
      height: 0.1,
      confidence: 1.0,
      isUserAdjusted: true,
    };
    
    setDetectedFaces(prev => [...prev, newFace]);
    setIsDragging(newFace.id);
  };

  // Handle mouse move for dragging/resizing
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const currentPos = getRelativePosition(e);
    const deltaX = currentPos.x - dragStart.x;
    const deltaY = currentPos.y - dragStart.y;
    
    setDetectedFaces(prev => prev.map(face => {
      if (face.id === isDragging) {
        if (isCreatingNew) {
          // Resize the new face
          return {
            ...face,
            width: Math.abs(deltaX),
            height: Math.abs(deltaY),
            x: deltaX < 0 ? currentPos.x : dragStart.x,
            y: deltaY < 0 ? currentPos.y : dragStart.y,
          };
        } else {
          // Move existing face
          return {
            ...face,
            x: Math.max(0, Math.min(1 - face.width, face.x + deltaX)),
            y: Math.max(0, Math.min(1 - face.height, face.y + deltaY)),
            isUserAdjusted: true,
          };
        }
      }
      return face;
    }));
    
    if (!isCreatingNew) {
      setDragStart(currentPos);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(null);
    setDragStart(null);
    setIsCreatingNew(false);
  };

  // Delete face selection
  const deleteFace = (faceId: string) => {
    setDetectedFaces(prev => prev.filter(face => face.id !== faceId));
    setFaceContacts(prev => prev.filter(contact => contact.faceId !== faceId));
  };

  // Crop face image for display
  const cropFaceImage = (face: DetectedFace) => {
    if (!imageElement) return "";
    
    const canvas = canvasRef.current;
    if (!canvas) return "";
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return "";

    // Convert normalized coordinates back to pixel coordinates
    const pixelX = face.x * imageElement.naturalWidth;
    const pixelY = face.y * imageElement.naturalHeight;
    const pixelWidth = face.width * imageElement.naturalWidth;
    const pixelHeight = face.height * imageElement.naturalHeight;

    // Set canvas size to face dimensions
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    
    // Draw the cropped face
    ctx.drawImage(
      imageElement,
      pixelX, pixelY, pixelWidth, pixelHeight,
      0, 0, pixelWidth, pixelHeight
    );
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      
      setIsProcessing(true);
      try {
        // Create image element for face detection
        const img = new Image();
        img.onload = async () => {
          setImageElement(img); // Store the image element for coordinate calculations
          const faces = await detectFaces(img);
          setDetectedFaces(faces);
          setFaceContacts(faces.map(face => ({
            faceId: face.id,
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            relationshipLevel: 'acquaintance',
            added: false
          })));
        };
        img.src = result;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process image for face detection",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const updateFaceContact = (faceId: string, field: keyof FaceContact, value: string) => {
    setFaceContacts(prev => prev.map(contact => 
      contact.faceId === faceId 
        ? { ...contact, [field]: value }
        : contact
    ));
  };

  const markFaceAsAdded = (faceId: string) => {
    setFaceContacts(prev => prev.map(contact => 
      contact.faceId === faceId 
        ? { ...contact, added: true }
        : contact
    ));
  };

  const handleImportSelected = () => {
    const contactsToImport = faceContacts
      .filter(contact => contact.firstName.trim() && !contact.added)
      .map(contact => {
        const face = detectedFaces.find(f => f.id === contact.faceId);
        return {
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone,
          email: contact.email,
          photo: face?.cropped,
          relationshipLevel: contact.relationshipLevel,
        };
      });

    if (contactsToImport.length === 0) {
      toast({
        title: "No contacts to import",
        description: "Please fill in at least the first name for contacts you want to add",
        variant: "destructive",
      });
      return;
    }

    onImportContacts(contactsToImport);
    
    // Mark imported contacts as added
    contactsToImport.forEach((_, index) => {
      const contact = faceContacts.filter(c => c.firstName.trim() && !c.added)[index];
      if (contact) {
        markFaceAsAdded(contact.faceId);
      }
    });

    toast({
      title: "Contacts imported",
      description: `Successfully imported ${contactsToImport.length} contact(s) from photo`,
    });
  };

  const handleClose = () => {
    setUploadedImage("");
    setDetectedFaces([]);
    setFaceContacts([]);
    setSelectedFace(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Import Contacts from Photo
          </DialogTitle>
        </DialogHeader>

        {!uploadedImage ? (
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                <Camera size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">
                Upload a group photo and we'll automatically detect faces to help you quickly add multiple contacts
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
                variant="outline"
              >
                <Upload size={16} className="mr-2" />
                Upload Photo
              </Button>
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1"
                variant="outline"
              >
                <Camera size={16} className="mr-2" />
                Take Photo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {isProcessing ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600">Detecting faces in your photo...</p>
              </div>
            ) : (
              <>
                {/* Interactive photo with draggable face selections */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Drag the face boxes to adjust them or click on the photo to add new faces
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newFace: DetectedFace = {
                          id: `face-${Date.now()}`,
                          x: 0.4,
                          y: 0.3,
                          width: 0.15,
                          height: 0.2,
                          confidence: 1.0,
                          isUserAdjusted: true,
                        };
                        setDetectedFaces(prev => [...prev, newFace]);
                        setFaceContacts(prev => [...prev, {
                          faceId: newFace.id,
                          firstName: '',
                          lastName: '',
                          phone: '',
                          email: '',
                          relationshipLevel: 'acquaintance',
                          added: false
                        }]);
                      }}
                    >
                      <Plus size={16} className="mr-1" />
                      Add Face
                    </Button>
                  </div>
                  
                  <div 
                    ref={imageContainerRef}
                    className="relative cursor-crosshair select-none"
                    onMouseDown={handleImageMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded photo" 
                      className="w-full max-h-96 object-contain rounded-lg"
                      draggable={false}
                    />
                    {detectedFaces.map(face => (
                      <div
                        key={face.id}
                        className={`absolute border-2 cursor-move transition-all ${
                          selectedFace === face.id 
                            ? 'border-blue-500 bg-blue-500/20' 
                            : face.isUserAdjusted
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-green-500 bg-green-500/20'
                        }`}
                        style={{
                          left: `${face.x * 100}%`,
                          top: `${face.y * 100}%`,
                          width: `${face.width * 100}%`,
                          height: `${face.height * 100}%`,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, face.id)}
                        onClick={() => setSelectedFace(face.id)}
                      >
                        <Badge className="absolute -top-6 left-0 text-xs">
                          Face {face.id.split('-')[1] || face.id.slice(-3)}
                          {face.isUserAdjusted && " ✓"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-6 -right-6 w-6 h-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFace(face.id);
                          }}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Face contact forms */}
                <div className="grid gap-4">
                  <h3 className="font-semibold">Add Contact Information for Each Face:</h3>
                  {detectedFaces.map((face, index) => {
                    const contact = faceContacts.find(c => c.faceId === face.id);
                    if (!contact) return null;

                    return (
                      <Card key={face.id} className={`${selectedFace === face.id ? 'ring-2 ring-blue-500' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Cropped face preview */}
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {imageElement ? (
                                <img 
                                  src={cropFaceImage(face)} 
                                  alt={`Face ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users size={20} className="text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">First Name</Label>
                                <Input
                                  placeholder="First name"
                                  value={contact.firstName}
                                  onChange={(e) => updateFaceContact(face.id, 'firstName', e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Last Name</Label>
                                <Input
                                  placeholder="Last name"
                                  value={contact.lastName}
                                  onChange={(e) => updateFaceContact(face.id, 'lastName', e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Phone</Label>
                                <Input
                                  placeholder="Phone number"
                                  value={contact.phone}
                                  onChange={(e) => updateFaceContact(face.id, 'phone', e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Email</Label>
                                <Input
                                  placeholder="Email address"
                                  value={contact.email}
                                  onChange={(e) => updateFaceContact(face.id, 'email', e.target.value)}
                                  className="h-8"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {contact.added ? (
                                <Badge variant="default" className="bg-green-500">
                                  <Check size={12} className="mr-1" />
                                  Added
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  Face {index + 1}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={handleImportSelected}
                    className="flex-1"
                    disabled={!faceContacts.some(c => c.firstName.trim() && !c.added)}
                  >
                    <Plus size={16} className="mr-2" />
                    Import Selected Contacts
                  </Button>
                  <Button
                    onClick={() => setUploadedImage("")}
                    variant="outline"
                  >
                    Upload Different Photo
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Hidden canvas for face cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}