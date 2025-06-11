import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Friend } from "@shared/schema";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FRIEND_CATEGORIES, INTERESTS, RELATIONSHIP_LEVELS } from "@/lib/constants";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MapPin, 
  Heart, 
  Users, 
  Phone, 
  Mail, 
  Edit,
  Calendar,
  MessageCircle,
  Star,
  Shield,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function FriendDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const friendId = parseInt(params.id || "0");

  const { data: friend, isLoading } = useQuery<Friend>({
    queryKey: ["/api/friends", friendId],
    queryFn: async () => {
      const response = await fetch(`/api/friends/${friendId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Friend not found");
      }
      return response.json();
    },
  });

  const updateFriendMutation = useMutation({
    mutationFn: async (updateData: Partial<Friend>) => {
      const response = await fetch(`/api/friends/${friendId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        throw new Error("Failed to update friend");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends", friendId] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Success",
        description: "Friend updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update friend",
        variant: "destructive",
      });
    },
  });

  const handleSaveNotes = () => {
    updateFriendMutation.mutate({ notes });
    setIsEditingNotes(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading friend...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Friend not found</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Remove category reference since it doesn't exist in the schema
  const relationshipLevel = RELATIONSHIP_LEVELS[friend.relationshipLevel as keyof typeof RELATIONSHIP_LEVELS] || RELATIONSHIP_LEVELS.new;
  
  // Color mapping for relationship levels
  const getColorClasses = (level: string) => {
    switch (level) {
      case 'close':
        return {
          gradient: 'bg-gradient-to-br from-rose-400 to-rose-600',
          icon: 'text-rose-500',
          bg: 'bg-rose-50',
          border: 'border-rose-200'
        };
      case 'friend':
        return {
          gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
          icon: 'text-blue-500',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        };
      case 'work':
        return {
          gradient: 'bg-gradient-to-br from-slate-400 to-slate-600',
          icon: 'text-slate-500',
          bg: 'bg-slate-50',
          border: 'border-slate-200'
        };
      default: // new
        return {
          gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
          icon: 'text-emerald-500',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200'
        };
    }
  };
  
  const colors = getColorClasses(friend.relationshipLevel);
  const iconMap = { star: Star, shield: Shield, heart: Heart, briefcase: Briefcase };
  const RelationshipIcon = iconMap[relationshipLevel.icon as keyof typeof iconMap];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header with relationship-based gradient */}
      <div className={`${colors.gradient} px-6 pt-12 pb-8 text-white relative`}>
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setLocation("/friends")}
            className="p-2 bg-white/20 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <button 
            onClick={() => setLocation(`/friends/${friendId}/edit`)}
            className="p-2 bg-white/20 rounded-full"
          >
            <Edit size={20} />
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden">
            {friend.photo ? (
              <img 
                src={friend.photo} 
                alt={`${friend.firstName} ${friend.lastName || ''}'s profile photo`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-3xl font-bold text-white">
                {friend.firstName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-2xl font-bold">{`${friend.firstName} ${friend.lastName || ''}`.trim()}</h1>
              <RelationshipIcon size={20} className="text-white" />
            </div>
            {friend.location && (
              <div className="flex items-center text-white/80 text-sm mt-1">
                <MapPin size={14} className="mr-1" />
                {friend.neighborhood ? `${friend.neighborhood}, ${friend.location}` : friend.location}
              </div>
            )}
            <div className="mt-2">
              <Badge className="bg-white/20 text-white border-white/30">
                {relationshipLevel.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 pb-24 space-y-4">
        
        {/* Quick Actions */}
        <Card className="relative z-10">
          <CardContent className="p-4">
            <div className="flex space-x-4">
              <Button variant="outline" size="sm" className="flex-1">
                <MessageCircle size={16} className="mr-2" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Phone size={16} className="mr-2" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Calendar size={16} className="mr-2" />
                Meet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        {friend.interests && friend.interests.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-dark-gray mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {friend.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lifestyle & Info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-dark-gray">Personal Info</h3>
            
            {friend.lifestyle && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lifestyle</span>
                <Badge variant="outline">{friend.lifestyle}</Badge>
              </div>
            )}
            
            {friend.hasKids !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Has Kids</span>
                <span className="text-sm font-medium">{friend.hasKids ? "Yes" : "No"}</span>
              </div>
            )}
            
            {friend.partner && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Partner</span>
                <span className="text-sm font-medium">{friend.partner}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-dark-gray">Notes</h3>
              {!isEditingNotes && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setNotes(friend.notes || "");
                    setIsEditingNotes(true);
                  }}
                >
                  <Edit size={16} />
                </Button>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add notes about your friend..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={handleSaveNotes}
                    disabled={updateFriendMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingNotes(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {friend.notes || "No notes yet. Click edit to add some!"}
              </p>
            )}
          </CardContent>
        </Card>

      </div>

      <BottomNavigation />
    </div>
  );
}
