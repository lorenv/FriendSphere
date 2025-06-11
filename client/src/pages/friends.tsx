import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Friend } from "@shared/schema";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FloatingActionButton } from "@/components/floating-action-button";
import { FriendCard } from "@/components/friend-card";
import { RELATIONSHIP_LEVELS } from "@/lib/constants";
import { Search, Filter, Star, Shield, Heart, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const iconMap = {
  star: Star,
  shield: Shield,
  heart: Heart,
  briefcase: Briefcase,
};

const gradientColors = {
  all: "from-coral via-turquoise to-sage",
  new: "from-blue-400 via-blue-500 to-blue-600",
  friend: "from-green-400 via-green-500 to-green-600", 
  close: "from-red-400 via-red-500 to-red-600",
  work: "from-purple-400 via-purple-500 to-purple-600",
};

export default function Friends() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const categoryFilter = urlParams.get('category');
  const viewFilter = urlParams.get('view');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelationshipLevel, setSelectedRelationshipLevel] = useState<string>(categoryFilter || "all");

  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  const filteredFriends = friends.filter(friend => {
    const fullName = `${friend.firstName} ${friend.lastName || ''}`.trim();
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (friend.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRelationshipLevel = selectedRelationshipLevel === "all" || friend.relationshipLevel === selectedRelationshipLevel;
    return matchesSearch && matchesRelationshipLevel;
  });

  // Group friends by location if location view is requested
  const groupedByLocation = viewFilter === 'location' ? 
    filteredFriends.reduce((acc, friend) => {
      const location = friend.location || "Unknown Location";
      if (!acc[location]) acc[location] = [];
      acc[location].push(friend);
      return acc;
    }, {} as Record<string, Friend[]>) : null;

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading friends...</div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const currentGradient = gradientColors[selectedRelationshipLevel as keyof typeof gradientColors] || gradientColors.all;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header with dynamic gradient */}
      <div className={`bg-gradient-to-br ${currentGradient} pt-12 pb-8 transition-all duration-500 ease-in-out`}>
        <div className="px-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Friends</h1>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{filteredFriends.length}</div>
              <div className="text-sm text-white/80">
                {selectedRelationshipLevel === "all" ? "Total" : RELATIONSHIP_LEVELS[selectedRelationshipLevel as keyof typeof RELATIONSHIP_LEVELS]?.label || ""}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/95 border-none"
            />
          </div>

          {/* Relationship Level Filter Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button
              variant={selectedRelationshipLevel === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedRelationshipLevel("all")}
              className={selectedRelationshipLevel === "all" ? "bg-white text-dark-gray" : "text-white/80 hover:bg-white/20"}
            >
              All
            </Button>
            {Object.entries(RELATIONSHIP_LEVELS).map(([key, relationshipLevel]) => {
              const IconComponent = iconMap[relationshipLevel.icon as keyof typeof iconMap];
              return (
                <Button
                  key={key}
                  variant={selectedRelationshipLevel === key ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedRelationshipLevel(key)}
                  className={`flex items-center space-x-1 ${
                    selectedRelationshipLevel === key 
                      ? "bg-white text-dark-gray" 
                      : "text-white/80 hover:bg-white/20"
                  }`}
                >
                  <IconComponent size={14} />
                  <span>{relationshipLevel.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-2 pb-24">
        {viewFilter === 'location' && groupedByLocation ? (
          // Location-grouped view
          <div className="space-y-6">
            {Object.entries(groupedByLocation).map(([location, locationFriends]) => (
              <div key={location}>
                <h3 className="text-lg font-semibold text-dark-gray mb-3">{location}</h3>
                <div className="space-y-3">
                  {locationFriends.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular list view
          <div className="space-y-3 pt-4">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {searchTerm ? "No friends found matching your search" : 
                   selectedRelationshipLevel === "all" ? "No friends added yet" :
                   `No ${RELATIONSHIP_LEVELS[selectedRelationshipLevel as keyof typeof RELATIONSHIP_LEVELS]?.label?.toLowerCase()} friends`}
                </div>
                {!searchTerm && (
                  <p className="text-gray-500 text-sm">
                    {selectedRelationshipLevel === "all" ? 
                      "Add your first friend to get started!" :
                      "Try selecting 'All' or add new friends"}
                  </p>
                )}
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))
            )}
          </div>
        )}
      </div>

      <FloatingActionButton />
      <BottomNavigation />
    </div>
  );
}