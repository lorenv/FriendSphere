import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFriendSchema, type Friend, type InsertFriend } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { INTERESTS, LIFESTYLE_OPTIONS } from "@/lib/constants";
import { ArrowLeft, X, Plus, Trash2, Camera, Upload } from "lucide-react";
import { LocationSearch } from "@/components/location-search";
import { RelationshipLevelSelector } from "@/components/relationship-level-selector";

export default function EditFriend() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customInterest, setCustomInterest] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: friend, isLoading } = useQuery<Friend>({
    queryKey: [`/api/friends/${id}`],
    enabled: !!id,
  });

  const form = useForm<InsertFriend>({
    resolver: zodResolver(insertFriendSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      photo: "",
      location: "",
      neighborhood: "",
      relationshipLevel: "new",
      interests: [],
      lifestyle: "",
      hasKids: false,
      partner: "",
      notes: "",
      contactInfo: "",
      howWeMet: "",
      phone: "",
      email: "",
    },
  });

  // Update form and interests when friend data loads
  useEffect(() => {
    if (friend) {
      const formData = {
        firstName: friend.firstName || "",
        lastName: friend.lastName || "",
        photo: friend.photo || "",
        location: friend.location || "",
        neighborhood: friend.neighborhood || "",
        relationshipLevel: friend.relationshipLevel || "new",
        interests: friend.interests || [],
        lifestyle: friend.lifestyle || "",
        hasKids: Boolean(friend.hasKids),
        phone: friend.phone || "",
        email: friend.email || "",
        partner: friend.partner || "",
        notes: friend.notes || "",
        contactInfo: friend.contactInfo || "",
        howWeMet: friend.howWeMet || "",
      };
      
      // Set interests and photo
      setSelectedInterests(friend.interests || []);
      setCurrentPhoto(friend.photo || "");
      
      // Reset form with the friend data
      form.reset(formData);
    }
  }, [friend, form]);

  const updateMutation = useMutation({
    mutationFn: async (friendData: InsertFriend) => {
      return await apiRequest("PATCH", `/api/friends/${id}`, { ...friendData, interests: selectedInterests });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends", id] });
      toast({
        title: "Friend updated!",
        description: "Your friend's information has been updated successfully.",
      });
      setLocation(`/friends/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update friend",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/friends/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend deleted",
        description: "Your friend has been removed from your network.",
      });
      setLocation("/friends");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete friend",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFriend) => {
    updateMutation.mutate({ ...data, interests: selectedInterests });
  };

  const handleLocationChange = (location: string, neighborhood?: string) => {
    form.setValue("location", location);
    form.setValue("neighborhood", neighborhood);
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests([...selectedInterests, customInterest.trim()]);
      setCustomInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setSelectedInterests(selectedInterests.filter(i => i !== interest));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCurrentPhoto(base64);
        form.setValue("photo", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCurrentPhoto(base64);
        form.setValue("photo", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setCurrentPhoto("");
    form.setValue("photo", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      removeInterest(interest);
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this friend? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading friend details...</p>
        </div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Friend not found</p>
          <Button onClick={() => setLocation("/friends")} variant="outline">
            Back to Friends
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header */}
      <div className="gradient-coral-turquoise-sage pt-12 pb-8">
        <div className="px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/friends/${id}`)}
                className="p-2 text-white hover:bg-white/20"
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-3xl font-bold text-white ml-2">Edit Friend</h1>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-2 pb-8">

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Photo Upload Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Profile Photo</Label>
                  
                  {currentPhoto ? (
                    <div className="relative w-32 h-32 mx-auto">
                      <img 
                        src={currentPhoto} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover rounded-2xl"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                      <Camera size={32} className="text-gray-400" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Camera size={16} className="mr-2" />
                      Take Photo
                    </Button>
                  </div>

                  {/* Hidden file inputs */}
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
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Info */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" type="email" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <LocationSearch
                          value={field.value || ""}
                          neighborhood={form.watch("neighborhood") || ""}
                          onChange={handleLocationChange}
                          placeholder="Search for city, neighborhood..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Relationship Level */}
                <FormField
                  control={form.control}
                  name="relationshipLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship Level</FormLabel>
                      <FormControl>
                        <RelationshipLevelSelector
                          value={field.value || "new"}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Interests */}
                <div className="space-y-3">
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          selectedInterests.includes(interest)
                            ? "bg-coral text-white hover:bg-coral/90"
                            : "hover:bg-coral/10"
                        }`}
                        onClick={() => toggleInterest(interest as string)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Custom interests */}
                  {selectedInterests.filter(i => !INTERESTS.includes(i as any)).map((interest) => (
                    <Badge
                      key={interest}
                      variant="default"
                      className="bg-blue-500 text-white mr-2 mb-2"
                    >
                      {interest}
                      <X
                        size={14}
                        className="ml-1 cursor-pointer hover:text-red-200"
                        onClick={() => removeInterest(interest)}
                      />
                    </Badge>
                  ))}

                  {/* Add custom interest */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom interest"
                      value={customInterest}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomInterest();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomInterest}
                      disabled={!customInterest.trim()}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                {/* Additional Info */}
                <FormField
                  control={form.control}
                  name="lifestyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lifestyle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lifestyle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LIFESTYLE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasKids"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Has Kids</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Does this person have children?
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner/Spouse</FormLabel>
                      <FormControl>
                        <Input placeholder="Partner's name (optional)" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="howWeMet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How We Met</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell the story of how you met..."
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes about this person..."
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-coral hover:bg-coral/90 text-white"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Updating Friend..." : "Update Friend"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}