import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFriendSchema, type InsertFriend, type Friend } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FRIEND_CATEGORIES, INTERESTS, LIFESTYLE_OPTIONS } from "@/lib/constants";
import { ArrowLeft, Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InstagramIntegration } from "@/components/instagram-integration";

export default function AddFriend() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: existingFriends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  const form = useForm<InsertFriend>({
    resolver: zodResolver(insertFriendSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      category: "friends",
      interests: [],
      hasKids: false,
      contactInfo: "",
      notes: "",
      howWeMet: "",
    },
  });

  const createFriendMutation = useMutation({
    mutationFn: async (friendData: InsertFriend) => {
      const response = await apiRequest("POST", "/api/friends", {
        ...friendData,
        interests: selectedInterests,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Friend added successfully!",
      });
      setLocation("/friends");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add friend. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFriend) => {
    const friendData = {
      ...data,
      interests: selectedInterests,
      photo: selectedPhoto || data.photo
    };
    createFriendMutation.mutate(friendData);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handlePhotoSelect = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    toast({
      title: "Photo Selected",
      description: "Instagram photo has been set as profile picture.",
    });
  };

  const handleContactImport = (contacts: any[]) => {
    // Auto-fill form with first contact data
    if (contacts.length > 0) {
      const contact = contacts[0];
      form.setValue('firstName', contact.full_name?.split(' ')[0] || contact.username);
      form.setValue('lastName', contact.full_name?.split(' ').slice(1).join(' ') || '');
      if (contact.profile_picture) {
        setSelectedPhoto(contact.profile_picture);
      }
      
      toast({
        title: "Contact Imported",
        description: `Filled form with ${contact.username}'s information.`,
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header */}
      <div className="gradient-bg px-6 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setLocation("/friends")}
            className="p-2 bg-white/20 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Add Friend</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-6 -mt-2 pb-24 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Photo Upload */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden">
                    {selectedPhoto ? (
                      <img 
                        src={selectedPhoto} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={32} className="text-gray-400" />
                    )}
                  </div>
                  <InstagramIntegration 
                    onPhotoSelect={handlePhotoSelect}
                    onContactImport={handleContactImport}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
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

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <Input 
                            placeholder="e.g., San Francisco, CA" 
                            className="pl-10"
                            {...field}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(FRIEND_CATEGORIES).map(([key, category]) => (
                            <SelectItem key={key} value={key}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <FormField
                  control={form.control}
                  name="partner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner/Spouse</FormLabel>
                      <FormControl>
                        <Input placeholder="Partner's name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {LIFESTYLE_OPTIONS.map((lifestyle) => (
                            <SelectItem key={lifestyle} value={lifestyle}>
                              {lifestyle}
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Has children</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            {/* Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`p-2 text-xs rounded-lg border transition-colors ${
                        selectedInterests.includes(interest)
                          ? "bg-coral text-white border-coral"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How did you meet?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <FormField
                  control={form.control}
                  name="howWeMet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How we met</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell the story of how you met..."
                          rows={3}
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
                  name="introducedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Introduced by</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select friend who introduced you" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {existingFriends.map((friend) => (
                            <SelectItem key={friend.id} value={friend.id.toString()}>
                              {`${friend.firstName} ${friend.lastName || ''}`.trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes about your friend..."
                          rows={4}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="sticky bottom-6 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-coral hover:bg-coral/90 text-white py-3 text-lg font-semibold"
                disabled={createFriendMutation.isPending}
              >
                {createFriendMutation.isPending ? "Adding Friend..." : "Add Friend"}
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  );
}
