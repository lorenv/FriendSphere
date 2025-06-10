import { Friend } from "@shared/schema";
import { FRIEND_CATEGORIES, RELATIONSHIP_LEVELS } from "@/lib/constants";
import { ChevronRight, Star, Shield, Heart, Briefcase } from "lucide-react";
import { Link } from "wouter";

interface FriendCardProps {
  friend: Friend;
}

const iconMap = {
  star: Star,
  shield: Shield,
  heart: Heart,
  briefcase: Briefcase,
};

export function FriendCard({ friend }: FriendCardProps) {
  const category = FRIEND_CATEGORIES[friend.category as keyof typeof FRIEND_CATEGORIES] || FRIEND_CATEGORIES.friends;
  const relationshipLevel = RELATIONSHIP_LEVELS[friend.relationshipLevel as keyof typeof RELATIONSHIP_LEVELS] || RELATIONSHIP_LEVELS.new;
  const RelationshipIcon = iconMap[relationshipLevel.icon as keyof typeof iconMap];
  const fullName = `${friend.firstName} ${friend.lastName || ''}`.trim();
  
  return (
    <Link href={`/friends/${friend.id}`}>
      <div className="bg-white rounded-2xl p-4 card-shadow flex items-center space-x-4 cursor-pointer hover:shadow-lg transition-shadow">
        <div className="relative w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center overflow-hidden">
          {friend.photo ? (
            <img 
              src={friend.photo} 
              alt={`${fullName}'s profile photo`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-2xl font-bold text-gray-400">
              {friend.firstName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Relationship Level Icon */}
          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-${relationshipLevel.color}-500 flex items-center justify-center`}>
            <RelationshipIcon size={12} className="text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-dark-gray">{fullName}</h3>
            <RelationshipIcon size={14} className={`text-${relationshipLevel.color}-500`} />
          </div>
          {friend.location && (
            <p className="text-sm text-gray-500 mb-1">
              {friend.neighborhood ? `${friend.neighborhood}, ${friend.location}` : friend.location}
            </p>
          )}
          <div className="flex items-center space-x-2">
            <span className={`bg-${category.color}/10 text-${category.color} text-xs px-2 py-1 rounded-full font-medium`}>
              {category.label}
            </span>
            {friend.interests && friend.interests.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                {friend.interests[0]}
              </span>
            )}
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-coral">
          <ChevronRight size={16} />
        </button>
      </div>
    </Link>
  );
}
