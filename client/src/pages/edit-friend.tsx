import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFriendSchema, type InsertFriend, type Friend } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ContactImportModal } from "@/components/contact-import-modal";
import { ArrowLeft, Camera, Plus, X, UserPlus, Upload, Trash2 } from "lucide-react";
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
import { IntroducedBySelector } from "@/components/introduced-by-selector";
import { RelationshipLevelSelector } from "@/components/relationship-level-selector";

export default function EditFriend() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const [showContactImport, setShowContactImport] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string>("");
  const [childrenNames, setChildrenNames] = useState<string[]>([]);
  const [newChildName, setNewChildName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const friendId = parseInt(params.id || "0");

  // Fetch friend data
  const { data: friend, isLoading } = useQuery<Friend>({
    queryKey: [`/api/friends/${friendId}`],
  });

  const form = useForm<InsertFriend>({
    resolver: zodResolver(insertFriendSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationshipLevel: "acquaintance",
      isNewFriend: false,
      hasPartner: false,
      hasKids: false,
      phone: "",
      email: "",
      howWeMet: "",
      location: "",
      neighborhood: "",
      interest1: "",
      interest2: "",
      interest3: "",
      favoriteHangoutSpots: "",
      bestTimeToReach: "",
      preferredCommunication: "text",
      activityPreferences: "",
      availabilityNotes: "",
      groupVsOneOnOne: "both",
      partnerName: "",
      childrenNames: [],
    },
  });

  // Update form when friend data loads
  useEffect(() => {
    if (friend) {
      form.reset({
        firstName: friend.firstName || "",
        lastName: friend.lastName || "",
        relationshipLevel: friend.relationshipLevel,
        isNewFriend: friend.isNewFriend || false,
        hasPartner: friend.hasPartner || false,
        hasKids: friend.hasKids || false,
        phone: friend.phone || "",
        email: friend.email || "",
        howWeMet: friend.howWeMet || "",
        interest1: friend.interest1 || "",
        interest2: friend.interest2 || "",
        interest3: friend.interest3 || "",
        favoriteHangoutSpots: friend.favoriteHangoutSpots || "",
        bestTimeToReach: friend.bestTimeToReach || "",
        preferredCommunication: friend.preferredCommunication || "text",
        activityPreferences: friend.activityPreferences || "",
        availabilityNotes: friend.availabilityNotes || "",
        groupVsOneOnOne: friend.groupVsOneOnOne || "both",
        partnerName: friend.partnerName || "",
        childrenNames: friend.childrenNames || [],
        location: friend.location || "",
        neighborhood: friend.neighborhood || "",
        introducedBy: friend.introducedBy ?? undefined,
      });
      setCurrentPhoto(friend.photo || "");
      setChildrenNames(friend.childrenNames || []);
    }
  }, [friend, form]);

  const updateFriendMutation = useMutation({
    mutationFn: async (data: InsertFriend) => {
      const submitData = {
        ...data,
        photo: currentPhoto || data.photo,
        childrenNames: childrenNames,
      };
      
      return await apiRequest("PATCH", `/api/friends/${friendId}`, submitData);
    },
    onSuccess: (updatedFriend) => {
      console.log("Friend updated, data returned:", updatedFriend);
      console.log("Invalidating cache for friendId:", friendId);
      
      // Invalidate the specific friend query with the exact key format used in detail page
      queryClient.invalidateQueries({ queryKey: [`/api/friends/${friendId}`] });
      // Invalidate the friends list query
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      // Also invalidate any other friend-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/friends", friendId] });
      
      // Force refetch to ensure UI updates
      queryClient.refetchQueries({ queryKey: ["/api/friends"] });
      queryClient.refetchQueries({ queryKey: [`/api/friends/${friendId}`] });
      
      toast({
        title: "Success",
        description: "Friend updated successfully",
      });
      setLocation(`/friend/${friendId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update friend",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCurrentPhoto(result);
        form.setValue("photo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCurrentPhoto(result);
        form.setValue("photo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContactImport = (contactData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    photo?: string;
    birthday?: string;
  }) => {
    form.setValue("firstName", contactData.firstName);
    form.setValue("lastName", contactData.lastName);
    form.setValue("phone", contactData.phone);
    form.setValue("email", contactData.email);
    if (contactData.photo) {
      setCurrentPhoto(contactData.photo);
      form.setValue("photo", contactData.photo);
    }
    if (contactData.birthday) {
      form.setValue("birthday", contactData.birthday);
    }
    setShowContactImport(false);
  };

  const addChild = () => {
    if (newChildName.trim()) {
      setChildrenNames([...childrenNames, newChildName.trim()]);
      setNewChildName("");
    }
  };

  const removeChild = (index: number) => {
    setChildrenNames(childrenNames.filter((_, i) => i !== index));
  };

  const onSubmit = (data: InsertFriend) => {
    updateFriendMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="p-4">
          <div className="text-center">
            <p className="text-gray-500">Friend not found</p>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/friends")}
              className="mt-4"
            >
              Back to Friends
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation(`/friend/${friendId}`)}
            className="p-0 hover:bg-transparent"
          >
            <ArrowLeft size={20} className="text-dark-gray" />
          </Button>
          <h1 className="text-lg font-semibold text-dark-gray">Edit Friend</h1>
          <div className="w-5" />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6 pb-24">
          {/* Photo Section */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {currentPhoto ? (
                    <img 
                      src={currentPhoto} 
                      alt="Friend" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserPlus size={32} className="text-gray-400" />
                  )}
                </div>
                
                <div className="flex justify-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} className="mr-1" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera size={16} className="mr-1" />
                    Camera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContactImport(true)}
                  >
                    Import
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
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
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
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
                        <Input placeholder="Last name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="relationshipLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RelationshipLevelSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
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
                    <FormLabel>How We Met (Quick Note)</FormLabel>
                    <FormControl>
                      <Input placeholder="Where or how you met" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="introducedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Introduced By</FormLabel>
                    <FormControl>
                      <IntroducedBySelector 
                        value={field.value ?? undefined} 
                        onChange={field.onChange}
                        excludeId={friendId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} value={field.value || ""} />
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
                      <Input placeholder="Email address" type="email" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferredCommunication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Communication</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || "text"}>
                        <SelectTrigger>
                          <SelectValue placeholder="How they prefer to communicate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text/SMS</SelectItem>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                          <SelectItem value="in-person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bestTimeToReach"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Best Time to Reach</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., weekday evenings, weekend mornings" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent>
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
                        onChange={(location, neighborhood) => {
                          field.onChange(location);
                          if (neighborhood) {
                            form.setValue("neighborhood", neighborhood);
                          }
                        }}
                        placeholder="Search for city or neighborhood"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Interests & Hobbies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="interest1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interests & Hobbies</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Photography, Hiking, Cooking, Music..." 
                        {...field} 
                        value={field.value || ""} 
                        list="interests-suggestions-edit"
                      />
                    </FormControl>
                    <datalist id="interests-suggestions-edit">
                      <option value="Photography" />
                      <option value="Hiking" />
                      <option value="Cooking" />
                      <option value="Music" />
                      <option value="Travel" />
                      <option value="Reading" />
                      <option value="Sports" />
                      <option value="Gaming" />
                      <option value="Art" />
                      <option value="Fitness" />
                      <option value="Technology" />
                      <option value="Movies" />
                      <option value="Dancing" />
                      <option value="Writing" />
                      <option value="Gardening" />
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Hangout Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hangout Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="favoriteHangoutSpots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Hangout Spots</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Places they love to go or meet up"
                        {...field}
                        value={field.value || ""}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activityPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Preferences</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Types of activities they enjoy"
                        {...field}
                        value={field.value || ""}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="groupVsOneOnOne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group vs One-on-One</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || "both"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Preference for group or individual hangouts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="group">Prefers Groups</SelectItem>
                          <SelectItem value="one-on-one">Prefers One-on-One</SelectItem>
                          <SelectItem value="both">Enjoys Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availabilityNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="When they're typically free or busy"
                        {...field}
                        value={field.value || ""}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Partner Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasPartner"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Has Partner/Spouse</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("hasPartner") && (
                  <FormField
                    control={form.control}
                    name="partnerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partner's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Partner's name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Children Section */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasKids"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Has Children</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("hasKids") && (
                  <div className="space-y-3">
                    <Label>Children's Names</Label>
                    <div className="space-y-2">
                      {childrenNames.map((name, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Badge variant="secondary" className="flex-1 justify-between">
                            {name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeChild(index)}
                              className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                            >
                              <X size={12} />
                            </Button>
                          </Badge>
                        </div>
                      ))}
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Child's name"
                          value={newChildName}
                          onChange={(e) => setNewChildName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChild())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addChild}
                          disabled={!newChildName.trim()}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            disabled={updateFriendMutation.isPending}
          >
            {updateFriendMutation.isPending ? "Updating..." : "Update Friend"}
          </Button>
        </form>
      </Form>

      <ContactImportModal
        open={showContactImport}
        onClose={() => setShowContactImport(false)}
        onImport={handleContactImport}
      />
    </div>
  );
}