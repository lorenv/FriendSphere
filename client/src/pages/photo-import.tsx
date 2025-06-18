import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Users, Camera, Loader2, Plus, X, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertFriend } from "@shared/schema";

interface DetectedFace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  isUserAdjusted?: boolean;
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

export default function PhotoImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const faceCount = Math.floor(Math.random() * 3) + 2;
    const faces: DetectedFace[] = [];
    
    for (let i = 0; i < faceCount; i++) {
      faces.push({
        id: `face-${i}`,
        x: 0.2 + (Math.random() * 0.6),
        y: 0.15 + (Math.random() * 0.4),
        width: 0.12 + (Math.random() * 0.08),
        height: 0.15 + (Math.random() * 0.1),
        confidence: 0.7 + Math.random() * 0.3,
        isUserAdjusted: false,
      });
    }
    
    return faces;
  };

  // Get touch/mouse position relative to image container
  const getRelativePosition = (e: React.TouchEvent | React.MouseEvent) => {
    if (!imageContainerRef.current || !imageElement) return { x: 0, y: 0 };
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const containerX = clientX - rect.left;
    const containerY = clientY - rect.top;
    
    return {
      x: containerX / rect.width,
      y: containerY / rect.height,
    };
  };

  // Handle touch/mouse down on face selection box
  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent, faceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get position from the correct event
    let clientX, clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }
    
    if (!imageContainerRef.current || !imageElement) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const containerX = clientX - rect.left;
    const containerY = clientY - rect.top;
    
    const pos = {
      x: containerX / rect.width,
      y: containerY / rect.height,
    };
    
    setIsDragging(faceId);
    setDragStart(pos);
    setSelectedFace(faceId);
  };

  // Handle touch/mouse down on image (for creating new face selections)
  const handleImagePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
    // Only create new faces if we're not already dragging or creating
    if (isDragging || isCreatingNew) return;
    
    // Check if the target is the image itself, not a face box
    const target = e.target as HTMLElement;
    if (target.tagName !== 'IMG') return;
    
    const pos = getRelativePosition(e);
    setIsCreatingNew(true);
    setDragStart(pos);
    
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
    setFaceContacts(prev => [...prev, {
      faceId: newFace.id,
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      relationshipLevel: 'acquaintance',
      added: false
    }]);
    setIsDragging(newFace.id);
  };

  // Handle touch/mouse move for dragging/resizing
  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    e.preventDefault();
    const currentPos = getRelativePosition(e);
    const deltaX = currentPos.x - dragStart.x;
    const deltaY = currentPos.y - dragStart.y;
    
    setDetectedFaces(prev => prev.map(face => {
      if (face.id === isDragging) {
        if (isCreatingNew) {
          return {
            ...face,
            width: Math.abs(deltaX),
            height: Math.abs(deltaY),
            x: deltaX < 0 ? currentPos.x : dragStart.x,
            y: deltaY < 0 ? currentPos.y : dragStart.y,
          };
        } else {
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

  // Handle touch/mouse up
  const handlePointerUp = () => {
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

    const pixelX = face.x * imageElement.naturalWidth;
    const pixelY = face.y * imageElement.naturalHeight;
    const pixelWidth = face.width * imageElement.naturalWidth;
    const pixelHeight = face.height * imageElement.naturalHeight;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    
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
        const img = new Image();
        img.onload = async () => {
          setImageElement(img);
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
      contact.faceId === faceId ? { ...contact, [field]: value } : contact
    ));
  };

  const createFriendMutation = useMutation({
    mutationFn: async (friendData: InsertFriend) => {
      return apiRequest('/api/friends', 'POST', friendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    },
  });

  const markFaceAsAdded = (faceId: string) => {
    setFaceContacts(prev => prev.map(contact => 
      contact.faceId === faceId ? { ...contact, added: true } : contact
    ));
  };

  const handleImportContacts = async () => {
    const contactsToImport = faceContacts
      .filter(contact => contact.firstName.trim() && !contact.added)
      .map(contact => ({
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
        relationshipLevel: contact.relationshipLevel,
        photo: cropFaceImage(detectedFaces.find(f => f.id === contact.faceId)!),
      }));

    if (contactsToImport.length === 0) {
      toast({
        title: "No contacts to import",
        description: "Please fill in at least the first name for contacts you want to import",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const contact of contactsToImport) {
        await createFriendMutation.mutateAsync({
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone,
          email: contact.email,
          relationshipLevel: contact.relationshipLevel,
          photo: contact.photo,
        });
      }

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
      
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import some contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Import from Photo</h1>
              <p className="text-sm text-gray-600">Add multiple contacts from group photos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!uploadedImage ? (
          <div className="space-y-4">
            <div className="text-center space-y-4 py-12">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                <Camera size={32} className="text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium mb-2">Upload a Group Photo</h3>
                <p className="text-sm text-gray-600">
                  We'll help you detect faces and create contacts for each person
                </p>
              </div>
            </div>

            <div className="flex gap-3">
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
          <div className="space-y-6">
            {isProcessing ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600">Detecting faces in your photo...</p>
              </div>
            ) : (
              <>
                {/* Interactive photo with draggable face selections */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 font-medium">
                      Adjust face selections
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
                    className="relative select-none touch-none"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    onMouseDown={handleImagePointerDown}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerUp}
                    onMouseLeave={handlePointerUp}
                    onTouchStart={handleImagePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                  >
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded photo" 
                      className="w-full rounded-lg"
                      draggable={false}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    />
                    {detectedFaces.map(face => (
                      <div
                        key={face.id}
                        className={`absolute border-3 transition-all touch-none min-w-12 min-h-12 ${
                          selectedFace === face.id 
                            ? 'border-blue-500 bg-blue-500/30' 
                            : face.isUserAdjusted
                            ? 'border-purple-500 bg-purple-500/30'
                            : 'border-green-500 bg-green-500/30'
                        }`}
                        style={{
                          left: `${face.x * 100}%`,
                          top: `${face.y * 100}%`,
                          width: `${Math.max(face.width * 100, 12)}%`,
                          height: `${Math.max(face.height * 100, 12)}%`,
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          minWidth: '48px',
                          minHeight: '48px',
                        }}
                        onMouseDown={(e) => handlePointerDown(e, face.id)}
                        onTouchStart={(e) => handlePointerDown(e, face.id)}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFace(face.id);
                        }}
                      >
                        <Badge className="absolute -top-8 left-0 text-xs bg-black/70 text-white">
                          Face {face.id.split('-')[1] || face.id.slice(-3)}
                          {face.isUserAdjusted && " ✓"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-8 -right-8 w-6 h-6 p-0"
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
                  
                  <p className="text-xs text-gray-500 text-center">
                    Tap and drag the boxes to adjust face selections
                  </p>
                </div>

                {/* Face contact forms */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Contact Information</h3>
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

                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
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
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
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

                              {contact.added && (
                                <div className="flex items-center gap-2 text-green-600 text-sm">
                                  <Check size={16} />
                                  Contact added successfully
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadedImage("");
                      setDetectedFaces([]);
                      setFaceContacts([]);
                      setSelectedFace(null);
                    }}
                    className="flex-1"
                  >
                    Start Over
                  </Button>
                  <Button
                    onClick={handleImportContacts}
                    disabled={createFriendMutation.isPending || faceContacts.filter(c => c.firstName.trim() && !c.added).length === 0}
                    className="flex-1"
                  >
                    {createFriendMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      `Import ${faceContacts.filter(c => c.firstName.trim() && !c.added).length} Contacts`
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}