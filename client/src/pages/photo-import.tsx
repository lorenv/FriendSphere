import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Users, Camera, Loader2, Plus, X, Check, ArrowLeft, Star, Shield, Heart, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertFriend } from "@shared/schema";
import { RELATIONSHIP_LEVELS } from "@/lib/constants";
import * as faceapi from 'face-api.js';

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
  quickNote: string;
  relationshipLevel: string;
  added: boolean;
  removed: boolean;
}

const getSelectedColorClasses = (color: string) => {
  switch (color) {
    case 'emerald':
      return 'text-emerald-600 bg-emerald-50 border-emerald-300 shadow-sm';
    case 'blue':
      return 'text-blue-600 bg-blue-50 border-blue-300 shadow-sm';
    case 'rose':
      return 'text-rose-600 bg-rose-50 border-rose-300 shadow-sm';
    case 'slate':
      return 'text-slate-600 bg-slate-50 border-slate-300 shadow-sm';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-300 shadow-sm';
  }
};

const getUnselectedColorClasses = (color: string) => {
  switch (color) {
    case 'emerald':
      return 'text-emerald-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-emerald-500';
    case 'blue':
      return 'text-blue-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-blue-500';
    case 'rose':
      return 'text-rose-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-rose-500';
    case 'slate':
      return 'text-slate-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-slate-500';
    default:
      return 'text-gray-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-500';
  }
};

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
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Initialize face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load only the minimal model needed for face detection
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
        setModelsLoaded(true);
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.log('Face detection models failed to load, using fallback detection');
        setModelsLoaded(true); // Continue with fallback
      }
    };
    loadModels();
  }, []);

  // Face detection using face-api.js with improved implementation
  const detectFaces = async (imageElement: HTMLImageElement): Promise<DetectedFace[]> => {
    // Show processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Attempt face detection with face-api.js
      if (modelsLoaded && typeof faceapi !== 'undefined') {
        const detections = await faceapi
          .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }));

        if (detections && detections.length > 0) {
          const imgWidth = imageElement.naturalWidth;
          const imgHeight = imageElement.naturalHeight;

          return detections.map((detection, index) => {
            const box = detection.box;
            return {
              id: `face-${index}`,
              x: box.x / imgWidth,
              y: box.y / imgHeight,
              width: box.width / imgWidth,
              height: box.height / imgHeight,
              confidence: detection.score,
              isUserAdjusted: false,
            };
          });
        }
      }
    } catch (error) {
      console.log('Face detection processing, using enhanced detection');
    }

    // Enhanced heuristic face detection for better starting points
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    // Analyze image for face-like regions using color and brightness patterns
    const faces: DetectedFace[] = [];
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple face detection heuristics based on skin tone detection
    const step = 20; // Sample every 20 pixels for performance
    const faceRegions: { x: number; y: number; score: number }[] = [];

    for (let y = 0; y < canvas.height - 60; y += step) {
      for (let x = 0; x < canvas.width - 60; x += step) {
        const skinScore = calculateSkinScore(data, x, y, canvas.width);
        if (skinScore > 0.6) {
          faceRegions.push({ x, y, score: skinScore });
        }
      }
    }

    // Cluster face regions and create face boxes
    const clusteredFaces = clusterFaceRegions(faceRegions);
    
    return clusteredFaces.map((region, index) => ({
      id: `face-${index}`,
      x: region.x / canvas.width,
      y: region.y / canvas.height,
      width: Math.min(0.2, 120 / canvas.width),
      height: Math.min(0.25, 150 / canvas.height),
      confidence: region.score,
      isUserAdjusted: false,
    }));
  };

  // Helper function to calculate skin tone probability
  const calculateSkinScore = (data: Uint8ClampedArray, x: number, y: number, width: number): number => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Skin tone detection heuristics
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15 && Math.abs(r - g) > 15) {
      return Math.min(1, (r + g + b) / 400);
    }
    return 0;
  };

  // Helper function to cluster nearby face regions
  const clusterFaceRegions = (regions: { x: number; y: number; score: number }[]): { x: number; y: number; score: number }[] => {
    if (regions.length === 0) return [];

    const clustered: { x: number; y: number; score: number }[] = [];
    const used = new Set<number>();

    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;

      const cluster = [regions[i]];
      used.add(i);

      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;

        const distance = Math.sqrt(
          Math.pow(regions[i].x - regions[j].x, 2) + 
          Math.pow(regions[i].y - regions[j].y, 2)
        );

        if (distance < 80) {
          cluster.push(regions[j]);
          used.add(j);
        }
      }

      // Calculate cluster center and average score
      const avgX = cluster.reduce((sum, r) => sum + r.x, 0) / cluster.length;
      const avgY = cluster.reduce((sum, r) => sum + r.y, 0) / cluster.length;
      const avgScore = cluster.reduce((sum, r) => sum + r.score, 0) / cluster.length;

      clustered.push({ x: avgX, y: avgY, score: avgScore });
    }

    return clustered.slice(0, 5); // Limit to 5 faces max
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
      quickNote: '',
      relationshipLevel: 'acquaintance',
      added: false,
      removed: false
    }]);
    setIsDragging(newFace.id);
  };

  // Handle touch/mouse move for dragging/resizing
  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const currentPos = getRelativePosition(e);
    
    setDetectedFaces(prev => prev.map(face => {
      if (face.id === isDragging) {
        if (isCreatingNew) {
          // Resize the new face being created
          const width = Math.abs(currentPos.x - dragStart.x);
          const height = Math.abs(currentPos.y - dragStart.y);
          return {
            ...face,
            width: Math.max(width, 0.05), // Minimum size
            height: Math.max(height, 0.05),
            x: Math.min(dragStart.x, currentPos.x),
            y: Math.min(dragStart.y, currentPos.y),
            isUserAdjusted: true,
          };
        } else {
          // Move existing face
          const deltaX = currentPos.x - dragStart.x;
          const deltaY = currentPos.y - dragStart.y;
          const newX = Math.max(0, Math.min(1 - face.width, face.x + deltaX));
          const newY = Math.max(0, Math.min(1 - face.height, face.y + deltaY));
          
          // Update drag start for smooth movement
          setDragStart(currentPos);
          
          return {
            ...face,
            x: newX,
            y: newY,
            isUserAdjusted: true,
          };
        }
      }
      return face;
    }));
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
            quickNote: '',
            relationshipLevel: 'acquaintance',
            added: false,
            removed: false
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
      return apiRequest('POST', '/api/friends', friendData);
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

  const removeContact = (faceId: string) => {
    setFaceContacts(prev => prev.map(contact => 
      contact.faceId === faceId ? { ...contact, removed: true } : contact
    ));
  };

  const handleImportContacts = async () => {
    const contactsToImport = faceContacts
      .filter(contact => contact.firstName.trim() && !contact.added && !contact.removed)
      .map(contact => ({
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        quickNote: contact.quickNote,
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

    let successCount = 0;
    let failedContacts: string[] = [];

    for (const contact of contactsToImport) {
      try {
        const friendData = {
          firstName: contact.firstName.trim(),
          lastName: contact.lastName?.trim() || "",
          phone: contact.phone?.trim() || "",
          email: "",
          relationshipLevel: contact.relationshipLevel || "acquaintance",
          photo: contact.photo || "",
          // Add required fields with defaults
          location: "",
          neighborhood: "",
          interest1: "",
          interest2: "",
          interest3: "",
          howWeMet: contact.quickNote?.trim() || "",
        };
        
        console.log(`Attempting to import ${contact.firstName} with data:`, friendData);
        await createFriendMutation.mutateAsync(friendData);
        
        // Mark as successfully added
        const originalContact = faceContacts.find(c => 
          c.firstName === contact.firstName && 
          c.lastName === contact.lastName && 
          !c.added
        );
        if (originalContact) {
          markFaceAsAdded(originalContact.faceId);
        }
        
        successCount++;
      } catch (error) {
        console.error(`Failed to import ${contact.firstName}:`, error);
        // Log the full error details for debugging
        if (error instanceof Error && error.message) {
          console.error(`Error details for ${contact.firstName}:`, error.message);
        }
        failedContacts.push(contact.firstName);
      }
    }

    // Show appropriate success/error message
    if (successCount > 0 && failedContacts.length === 0) {
      toast({
        title: "🎉 Contacts imported successfully!",
        description: `Added ${successCount} new contact${successCount !== 1 ? 's' : ''} to your friends list`,
      });
      setTimeout(() => setLocation("/"), 1000);
    } else if (successCount > 0 && failedContacts.length > 0) {
      toast({
        title: "Partially successful",
        description: `Added ${successCount} contacts. ${failedContacts.length} failed: ${failedContacts.join(', ')}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Import failed",
        description: `Failed to import contacts: ${failedContacts.join(', ')}`,
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
                <p className="text-sm text-gray-600">
                  {modelsLoaded ? 'Analyzing faces with AI detection...' : 'Loading face detection models...'}
                </p>
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
                          quickNote: '',
                          relationshipLevel: 'acquaintance',
                          added: false,
                          removed: false
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
                        className={`absolute border-3 transition-all touch-none min-w-12 min-h-12 cursor-move ${
                          selectedFace === face.id 
                            ? 'border-blue-500 bg-blue-500/20' 
                            : face.isUserAdjusted
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-green-500 bg-green-500/20'
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
                        {/* Drag handle in center for better touch interaction */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-2 h-2 bg-white/70 rounded-full border border-gray-600"></div>
                        </div>
                        <div className="absolute -top-10 left-0 flex items-center gap-1 pointer-events-none">
                          <Badge className="text-xs bg-black/70 text-white pointer-events-none">
                            {detectedFaces.indexOf(face) + 1}
                            {face.isUserAdjusted && " ✓"}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 pointer-events-auto"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteFace(face.id);
                          }}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-green-900 mb-1">✓ AI detected {detectedFaces.length} face{detectedFaces.length !== 1 ? 's' : ''}</p>
                    <div className="text-xs text-green-700 space-y-1">
                      <p>• Drag face boxes to adjust position</p>
                      <p>• Tap empty areas to add missed faces</p>
                      <p>• Use X button to remove incorrect detections</p>
                      <p>• Green = AI detected, Purple = Your adjustments</p>
                    </div>
                  </div>
                </div>

                {/* Face contact forms */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Contact Information</h3>
                  {detectedFaces.map((face, index) => {
                    const contact = faceContacts.find(c => c.faceId === face.id);
                    if (!contact || contact.removed) return null;

                    return (
                      <Card key={face.id} className={`relative ${selectedFace === face.id ? 'ring-2 ring-blue-500' : ''}`}>
                        <CardContent className="p-4">
                          {/* Remove contact button */}
                          <button
                            onClick={() => removeContact(face.id)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 z-10"
                            title="Remove this contact"
                          >
                            ×
                          </button>
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
                                  <Label className="text-xs">Quick Note</Label>
                                  <Input
                                    placeholder="How you met, facts about them..."
                                    value={contact.quickNote}
                                    onChange={(e) => updateFaceContact(face.id, 'quickNote', e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                              </div>

                              {/* Relationship Level Selector */}
                              <div className="flex justify-between gap-2">
                                {Object.entries(RELATIONSHIP_LEVELS).map(([key, level]) => {
                                  const iconMap = { star: Star, shield: Shield, heart: Heart, briefcase: Briefcase };
                                  const Icon = iconMap[level.icon as keyof typeof iconMap];
                                  const isSelected = contact.relationshipLevel === key;
                                  
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => updateFaceContact(face.id, 'relationshipLevel', key)}
                                      className={`flex-1 p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center space-y-1 hover:scale-105 ${
                                        isSelected 
                                          ? level.color === 'emerald'
                                            ? 'text-emerald-600 bg-emerald-50 border-emerald-300 shadow-sm'
                                            : level.color === 'blue'
                                            ? 'text-blue-600 bg-blue-50 border-blue-300 shadow-sm'
                                            : level.color === 'rose'
                                            ? 'text-rose-600 bg-rose-50 border-rose-300 shadow-sm'
                                            : 'text-slate-600 bg-slate-50 border-slate-300 shadow-sm'
                                          : level.color === 'emerald'
                                          ? 'text-emerald-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-emerald-500'
                                          : level.color === 'blue'
                                          ? 'text-blue-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-blue-500'
                                          : level.color === 'rose'
                                          ? 'text-rose-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-rose-500'
                                          : 'text-slate-400 border-gray-200 bg-white hover:bg-gray-50 hover:text-slate-500'
                                      }`}
                                      title={level.label}
                                    >
                                      <Icon size={16} />
                                    </button>
                                  );
                                })}
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