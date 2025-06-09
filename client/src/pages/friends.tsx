import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Friend } from "@shared/schema";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FloatingActionButton } from "@/components/floating-action-button";
import { FriendCard } from "@/components/friend-card";
import { FRIEND_CATEGORIES } from "@/lib/constants";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Friends() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const categoryFilter = urlParams.get('category');
  const viewFilter = urlParams.get('view');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || "all");

  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (friend.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || friend.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header */}
      <div className="gradient-bg px-6 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Friends</h1>
            <p className="text-white/80 text-sm">{filteredFriends.length} friends</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
          <Input
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60"
          />
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-white text-dark-gray" : "text-white/80 hover:bg-white/20"}
          >
            All
          </Button>
          {Object.entries(FRIEND_CATEGORIES).map(([key, category]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className={selectedCategory === key ? "bg-white text-dark-gray" : "text-white/80 hover:bg-white/20"}
            >
              {category.label}
            </Button>
          ))}
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
                <div className="text-gray-400 mb-2">No friends found</div>
                <p className="text-sm text-gray-500">
                  {searchTerm ? "Try a different search term" : "Add your first friend to get started"}
                </p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
}
