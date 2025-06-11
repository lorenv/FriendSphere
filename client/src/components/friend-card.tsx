import { Friend } from "@shared/schema";
import { RELATIONSHIP_LEVELS } from "@/lib/constants";
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

// Color mapping for relationship levels
const getColorClasses = (level: string) => {
  switch (level) {
    case 'close':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        icon: 'text-rose-500',
        accent: 'bg-rose-500'
      };
    case 'friend':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200', 
        icon: 'text-blue-500',
        accent: 'bg-blue-500'
      };
    case 'professional':
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'text-gray-500',
        accent: 'bg-gray-500'
      };
    default: // new
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-500',
        accent: 'bg-green-500'
      };
  }
};

export function FriendCard({ friend }: FriendCardProps) {
  const relationshipLevel = RELATIONSHIP_LEVELS[friend.relationshipLevel as keyof typeof RELATIONSHIP_LEVELS] || RELATIONSHIP_LEVELS.new;
  const RelationshipIcon = iconMap[relationshipLevel.icon as keyof typeof iconMap];
  const fullName = `${friend.firstName} ${friend.lastName || ''}`.trim();
  const colors = getColorClasses(friend.relationshipLevel);
  
  return (
    <Link href={`/friends/${friend.id}`}>
      <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-all duration-200 mb-3`}>
        <div className="relative w-14 h-14 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
          {friend.photo ? (
            <img 
              src={friend.photo} 
              alt={`${fullName}'s profile photo`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-lg font-semibold text-gray-500">
              {friend.firstName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Subtle relationship indicator dot */}
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${colors.accent} flex items-center justify-center`}>
            <RelationshipIcon size={8} className="text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{fullName}</h3>
            <RelationshipIcon size={14} className={colors.icon} />
          </div>
          
          {friend.location && (
            <p className="text-sm text-gray-600 truncate mb-1">
              {friend.neighborhood ? friend.neighborhood : friend.location}
            </p>
          )}
          
          {friend.interests && friend.interests.length > 0 && (
            <span className="inline-block bg-white text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
              {friend.interests[0]}
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          <ChevronRight size={18} className="text-gray-400" />
        </div>
      </div>
    </Link>
  );
}
