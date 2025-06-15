import { Friend } from "@shared/schema";
import { RELATIONSHIP_LEVELS } from "@/lib/constants";
import { ChevronRight, Star, Shield, Heart, Briefcase, Stars } from "lucide-react";
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
        accent: 'bg-rose-500',
        ring: 'ring-rose-300'
      };
    case 'friend':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200', 
        icon: 'text-blue-500',
        accent: 'bg-blue-500',
        ring: 'ring-blue-300'
      };
    case 'work':
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        icon: 'text-slate-500',
        accent: 'bg-slate-500',
        ring: 'ring-slate-300'
      };
    default: // acquaintance
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: 'text-emerald-500',
        accent: 'bg-emerald-500',
        ring: 'ring-emerald-300'
      };
  }
};

export function FriendCard({ friend }: FriendCardProps) {
  const relationshipLevel = RELATIONSHIP_LEVELS[friend.relationshipLevel as keyof typeof RELATIONSHIP_LEVELS] || RELATIONSHIP_LEVELS.acquaintance;
  const RelationshipIcon = iconMap[relationshipLevel.icon as keyof typeof iconMap];
  const fullName = `${friend.firstName} ${friend.lastName || ''}`.trim();
  const colors = getColorClasses(friend.relationshipLevel);
  
  const friendUrl = `/friend/${friend.id}`;
  console.log("FriendCard linking to:", friendUrl, "for friend:", friend.firstName);
  
  return (
    <Link href={friendUrl}>
      <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-all duration-200 mb-3`}>
        <div className={`w-14 h-14 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm ring-2 ${colors.ring} ring-opacity-60`}>
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
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{fullName}</h3>
            <RelationshipIcon size={14} className={colors.icon} />
            {friend.isNewFriend && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">New</span>
            )}
          </div>
          
          {friend.location && (
            <p className="text-sm text-gray-600 truncate mb-1">
              {friend.neighborhood ? friend.neighborhood : friend.location}
            </p>
          )}
          
          {friend.interest1 && (
            <span className="inline-block bg-white text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
              {friend.interest1}
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
