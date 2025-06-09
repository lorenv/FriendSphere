import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FRIEND_CATEGORIES, INTERESTS, LIFESTYLE_OPTIONS } from "@/lib/constants";
import { ArrowLeft, MapPin, X, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function EditFriend() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [customInterest, setCustomInterest] = useState("");

  const { data: friend, isLoading } = useQuery<Friend>({
    queryKey: ["/api/friends", id],
    enabled: !!id,
  });

  const editSchema = insertFriendSchema.extend({
    firstName: insertFriendSchema.shape.firstName,
    lastName: insertFriendSchema.shape.lastName.optional(),
  });

  const form = useForm<InsertFriend>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      photo: "",
      location: "",
      category: "friends",
      interests: [],
      lifestyle: "",
      hasKids: false,
      partner: "",
      notes: "",
      contactInfo: "",
      howWeMet: "",
    },
  });

  // Update form when friend data loads
  useState(() => {
    if (friend) {
      form.reset({
        firstName: friend.firstName,
        lastName: friend.lastName || "",
        photo: friend.photo || "",
        location: friend.location || "",
        category: friend.category,
        interests: friend.interests || [],
        lifestyle: friend.lifestyle || "",
        hasKids: friend.hasKids || false,
        partner: friend.partner || "",
        notes: friend.notes || "",
        contactInfo: friend.contactInfo || "",
        howWeMet: friend.howWeMet || "",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (friendData: InsertFriend) => {
      const response = await apiRequest(`/api/friends/${id}`, {
        method: "PATCH",
        body: JSON.stringify(friendData),
      });
      if (!response.ok) {
        throw new Error("Failed to update friend");
      }
      return response.json();
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
      const response = await apiRequest(`/api/friends/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete friend");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend deleted",
        description: "Your friend has been removed from your contacts.",
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
    updateMutation.mutate(data);
  };

  const handleDeleteFriend = () => {
    if (confirm("Are you sure you want to delete this friend? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const addCustomInterest = () => {
    if (customInterest.trim()) {
      const currentInterests = form.getValues("interests") || [];
      if (!currentInterests.includes(customInterest.trim())) {
        form.setValue("interests", [...currentInterests, customInterest.trim()]);
      }
      setCustomInterest("");
    }
  };

  const removeInterest = (interestToRemove: string) => {
    const currentInterests = form.getValues("interests") || [];
    form.setValue("interests", currentInterests.filter(interest => interest !== interestToRemove));
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = form.getValues("interests") || [];
    if (currentInterests.includes(interest)) {
      form.setValue("interests", currentInterests.filter(i => i !== interest));
    } else {
      form.setValue("interests", [...currentInterests, interest]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-2xl font-bold text-dark-gray mb-4">Friend not found</h1>
        <Link href="/friends">
          <Button>Back to Friends</Button>
        </Link>
      </div>
    );
  }

  const selectedInterests = form.watch("interests") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral via-turquoise to-sky">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/friends/${id}`}>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft size={16} />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-white">Edit Friend</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteFriend}
              className="text-white hover:bg-red-500/20"
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Personal Information */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <h2 className="text-lg font-semibold text-dark-gray mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
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
              </div>

              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ""} />
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
            </div>

            {/* Relationship Details */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <h2 className="text-lg font-semibold text-dark-gray mb-4">Relationship</h2>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Friend Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
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

              <FormField
                control={form.control}
                name="howWeMet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did you meet?</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., College, work, through friends..." 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Personal Details */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <h2 className="text-lg font-semibold text-dark-gray mb-4">Personal Details</h2>
              
              <FormField
                control={form.control}
                name="lifestyle"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Lifestyle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
                name="partner"
                render={({ field }) => (
                  <FormItem className="mb-4">
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
            </div>

            {/* Interests */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <h2 className="text-lg font-semibold text-dark-gray mb-4">Interests</h2>
              
              {/* Selected Interests */}
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedInterests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="bg-turquoise/10 text-turquoise flex items-center gap-1"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Custom Interest */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add custom interest..."
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomInterest())}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomInterest}
                >
                  <Plus size={16} />
                </Button>
              </div>

              {/* Predefined Interests */}
              <div className="grid grid-cols-3 gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`p-2 text-sm rounded-xl border transition-colors ${
                      selectedInterests.includes(interest)
                        ? "bg-turquoise/10 border-turquoise text-turquoise"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <h2 className="text-lg font-semibold text-dark-gray mb-4">Notes</h2>
              
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
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <h2 className="text-lg font-semibold text-dark-gray mb-4">Contact Information</h2>
              
              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Info</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Phone, email, social media handles..."
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-coral to-coral/80 hover:from-coral/90 hover:to-coral/70 text-white font-semibold py-3 rounded-2xl"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Friend"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}