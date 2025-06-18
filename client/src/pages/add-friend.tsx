import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFriendSchema, type InsertFriend } from "@shared/schema";
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

export default function AddFriend() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showContactImport, setShowContactImport] = useState(false);

  const [currentPhoto, setCurrentPhoto] = useState<string>("");
  const [childrenNames, setChildrenNames] = useState<string[]>([]);
  const [newChildName, setNewChildName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      interest1: "",
      interest2: "",
      interest3: "",
      favoriteHangoutSpots: "",
      bestTimeToReach: "",
      preferredCommunication: "text",
      activityPreferences: "",
      lastHangout: "",
      nextPlannedActivity: "",
      availabilityNotes: "",
      groupVsOneOnOne: "either",
      partnerName: "",
      childrenNames: [],
    },
  });

  const createFriendMutation = useMutation({
    mutationFn: async (friendData: InsertFriend) => {
      return await apiRequest("POST", "/api/friends", { 
        ...friendData, 
        childrenNames,
        photo: currentPhoto || friendData.photo 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Friend added successfully!",
        description: "Your new friend has been added to your network.",
      });
      setLocation("/friends");
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
    createFriendMutation.mutate({ 
      ...data, 
      childrenNames,
      photo: currentPhoto || data.photo 
    });
  };

  const handleLocationChange = (location: string, neighborhood?: string) => {
    form.setValue("location", location);
    if (neighborhood) {
      form.setValue("neighborhood", neighborhood);
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
    
    toast({
      title: "Contact Imported",
      description: `Successfully imported contact info for ${contactData.firstName} ${contactData.lastName}`,
    });
  };



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

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

  const addChildName = () => {
    if (newChildName.trim() && !childrenNames.includes(newChildName.trim())) {
      setChildrenNames([...childrenNames, newChildName.trim()]);
      setNewChildName("");
    }
  };

  const removeChildName = (name: string) => {
    setChildrenNames(childrenNames.filter(n => n !== name));
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
                {/* Import options */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactImport(true)}
                  >
                    <UserPlus size={16} className="mr-2" />
                    Import Contact
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/photo-import")}
                  >
                    <Camera size={16} className="mr-2" />
                    Group Import
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

                {/* Essential Info Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Essential Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                              <Input placeholder="Last name" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} value={field.value ?? ""} />
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
                            <Input placeholder="Email address" type="email" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <LocationSearch
                              value={field.value ?? ""}
                              neighborhood={form.watch("neighborhood") ?? ""}
                              onChange={handleLocationChange}
                              placeholder="Where do they live?"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                            <Textarea placeholder="Tell the story of how you met..." {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Interests & Activities Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Interests & Activities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
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
                                value={field.value ?? ""} 
                                list="interests-suggestions"
                              />
                            </FormControl>
                            <datalist id="interests-suggestions">
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
                    </div>

                    <FormField
                      control={form.control}
                      name="activityPreferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Preferences</FormLabel>
                          <FormControl>
                            <Textarea placeholder="What do they enjoy doing? (hiking, movies, cooking, sports, etc.)" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="favoriteHangoutSpots"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favorite Hangout Spots</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Where do they like to go? (coffee shops, parks, restaurants, etc.)" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Hangout Planning Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hangout Planning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="bestTimeToReach"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Best Time to Reach Them</FormLabel>
                          <FormControl>
                            <Input placeholder="When are they usually free?" {...field} value={field.value || ""} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How do they like to be contacted?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="text">Text Messages</SelectItem>
                              <SelectItem value="call">Phone Calls</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="social">Social Media</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Do they prefer group hangouts or one-on-one?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="group">Prefers Group Hangouts</SelectItem>
                              <SelectItem value="oneOnOne">Prefers One-on-One</SelectItem>
                              <SelectItem value="either">Enjoys Both</SelectItem>
                            </SelectContent>
                          </Select>
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
                            <Textarea placeholder="Any notes about their schedule (usually free weekends, works nights, etc.)" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastHangout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Time We Hung Out</FormLabel>
                          <FormControl>
                            <Input placeholder="When did you last see them?" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nextPlannedActivity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Planned Activity</FormLabel>
                          <FormControl>
                            <Input placeholder="Something you're planning to do together" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Family Info Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Family Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="hasPartner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Has Partner/Spouse</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="hasKids"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Has Children</FormLabel>
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
                      <div className="space-y-4">
                        <Label>Children's Names</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Child's name"
                            value={newChildName}
                            onChange={(e) => setNewChildName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChildName())}
                          />
                          <Button type="button" onClick={addChildName} size="sm">
                            <Plus size={16} />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {childrenNames.map((name, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeChildName(name)}
                                className="h-auto p-0 hover:bg-transparent"
                              >
                                <X size={12} />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Additional Info Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="birthday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birthday</FormLabel>
                          <FormControl>
                            <Input placeholder="Birthday" type="date" {...field} value={field.value || ""} />
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3" 
                  disabled={createFriendMutation.isPending}
                >
                  {createFriendMutation.isPending ? "Adding Friend..." : "Add Friend"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <ContactImportModal
          open={showContactImport}
          onClose={() => setShowContactImport(false)}
          onImport={handleContactImport}
        />


      </div>
    </div>
  );
}