import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFriendSchema, type InsertFriend } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { INTERESTS, LIFESTYLE_OPTIONS, RELATIONSHIP_LEVELS } from "@/lib/constants";
import { ContactImportModal } from "@/components/contact-import-modal";
import { ArrowLeft, Camera, Plus, X, UserPlus, Phone, Mail, Upload, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LocationSearch } from "@/components/location-search";
import { RelationshipLevelSelector } from "@/components/relationship-level-selector";



export default function AddFriend() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customInterest, setCustomInterest] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showContactImport, setShowContactImport] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InsertFriend>({
    resolver: zodResolver(insertFriendSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationshipLevel: "new",
      interests: [],
      hasKids: false,
      contactInfo: "",
      notes: "",
      howWeMet: "",
      phone: "",
      email: "",
    },
  });

  const createFriendMutation = useMutation({
    mutationFn: async (friendData: InsertFriend) => {
      return await apiRequest("POST", "/api/friends", { ...friendData, interests: selectedInterests });
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        toast({
          title: "Friend added successfully!",
          description: "Your new friend has been added to your network.",
        });
        setLocation("/friends");
      } catch (error) {
        console.error("Error in onSuccess:", error);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add friend. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFriend) => {
    createFriendMutation.mutate({ ...data, interests: selectedInterests });
  };

  const handleLocationChange = (location: string, neighborhood?: string) => {
    try {
      form.setValue("location", location);
      if (neighborhood) {
        form.setValue("neighborhood", neighborhood);
      }
    } catch (error) {
      console.error("Error setting location:", error);
    }
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

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      removeInterest(interest);
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleContactImport = (contactData: { firstName: string; lastName: string; phone: string; email: string; photo?: string; birthday?: string; }) => {
    form.setValue("firstName", contactData.firstName);
    form.setValue("lastName", contactData.lastName);
    form.setValue("phone", contactData.phone);
    form.setValue("email", contactData.email);
    if (contactData.photo) {
      form.setValue("photo", contactData.photo);
      setCurrentPhoto(contactData.photo);
    }
    if (contactData.birthday) form.setValue("birthday", contactData.birthday);
    
    const importedFields = [];
    if (contactData.firstName) importedFields.push("name");
    if (contactData.phone) importedFields.push("phone");
    if (contactData.email) importedFields.push("email");
    if (contactData.birthday) importedFields.push("birthday");
    if (contactData.photo) importedFields.push("photo");
    
    toast({
      title: "Contact Imported",
      description: `Successfully imported ${importedFields.join(", ")} for ${contactData.firstName} ${contactData.lastName}`,
    });
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





  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/friends")}
            className="p-2 text-dark-gray hover:text-coral"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-dark-gray ml-2">Add Friend</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Import from contacts button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactImport(true)}
                    className="w-full"
                  >
                    <UserPlus size={16} className="mr-2" />
                    Import Contact
                  </Button>
                </div>

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
                          <Input placeholder="Enter first name" {...field} />
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

                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthday</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter birthday" type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Profile photo URL" {...field} value={field.value || ""} />
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
                  disabled={createFriendMutation.isPending}
                >
                  {createFriendMutation.isPending ? "Adding Friend..." : "Add Friend"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <ContactImportModal
        open={showContactImport}
        onClose={() => setShowContactImport(false)}
        onImport={handleContactImport}
      />
    </div>
  );
}