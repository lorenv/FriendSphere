import { useQuery } from "@tanstack/react-query";
import { Search, Heart, Users, Briefcase, UserPlus, Gamepad2, Network, MapPin, Download, Star, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Friend, Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { RELATIONSHIP_LEVELS } from "@/lib/constants";

interface EnrichedActivity extends Activity {
  friend?: Friend;
}

interface Stats {
  totalFriends: number;
  closeFriends: number;
  newConnections: number;
  categoryBreakdown: Record<string, number>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats = {
    totalFriends: 0,
    closeFriends: 0,
    newConnections: 0,
    categoryBreakdown: {}
  } } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentActivities = [] } = useQuery<EnrichedActivity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: recentFriends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    select: (friends: Friend[]) => friends.slice(0, 3),
  });

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header Section */}
      <div className="gradient-bg px-6 pt-12 pb-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">FriendCircle</h1>
            <p className="text-white/80 text-sm">Your personal friend tracker</p>
          </div>
          <div className="relative">
            <button className="p-2 bg-white/20 rounded-full">
              <Search className="text-white" size={20} />
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex space-x-4">
          <div className="bg-white/20 rounded-2xl px-4 py-3 flex-1">
            <div className="text-2xl font-bold">{stats.totalFriends}</div>
            <div className="text-xs text-white/80">Total Friends</div>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-3 flex-1">
            <div className="text-2xl font-bold">{stats.closeFriends}</div>
            <div className="text-xs text-white/80">Close Friends</div>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-3 flex-1">
            <div className="text-2xl font-bold">{stats.newConnections}</div>
            <div className="text-xs text-white/80">New This Month</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 -mt-4 pb-24">
        
        {/* Recent Activity Card */}
        <div className="bg-white rounded-3xl p-6 card-shadow mb-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-gray">Recent Activity</h2>
            <Link href="/activities">
              <button className="text-coral text-sm font-medium">View All</button>
            </Link>
          </div>
          
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {activity.friend?.photo ? (
                      <img 
                        src={activity.friend.photo} 
                        alt={`${activity.friend.firstName} ${activity.friend.lastName || ''}'s profile photo`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-lg font-bold text-gray-400">
                        {activity.friend?.firstName?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-dark-gray">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : "Recently"}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-coral rounded-full"></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friend Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-dark-gray mb-4">Friend Categories</h2>
          <div className="grid grid-cols-2 gap-4">
            
            <div 
              onClick={() => setLocation("/friends?category=close")}
              className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-3xl p-4 text-white card-shadow cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <Heart size={24} />
                <span className="text-2xl font-bold">{stats.categoryBreakdown?.close || 0}</span>
              </div>
              <h3 className="font-semibold">Close</h3>
              <p className="text-xs text-white/80">Your inner circle</p>
            </div>
            
            <div 
              onClick={() => setLocation("/friends?category=friend")}
              className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl p-4 text-white card-shadow cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <Shield size={24} />
                <span className="text-2xl font-bold">{stats.categoryBreakdown?.friend || 0}</span>
              </div>
              <h3 className="font-semibold">Friends</h3>
              <p className="text-xs text-white/80">Regular friends</p>
            </div>
            
            <div 
              onClick={() => setLocation("/friends?category=work")}
              className="bg-gradient-to-br from-slate-400 to-slate-600 rounded-3xl p-4 text-white card-shadow cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <Briefcase size={24} />
                <span className="text-2xl font-bold">{stats.categoryBreakdown?.work || 0}</span>
              </div>
              <h3 className="font-semibold">Work</h3>
              <p className="text-xs text-white/80">Professional network</p>
            </div>
            
            <div 
              onClick={() => setLocation("/friends?category=acquaintance")}
              className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-4 text-white card-shadow cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <Star size={24} />
                <span className="text-2xl font-bold">{stats.categoryBreakdown?.acquaintance || 0}</span>
              </div>
              <h3 className="font-semibold">Acquaintance</h3>
              <p className="text-xs text-white/80">New connections</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-dark-gray mb-4">Quick Actions</h2>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            <Link href="/name-game">
              <button className="bg-white rounded-2xl p-4 card-shadow flex flex-col items-center min-w-[80px]">
                <Gamepad2 className="text-coral text-xl mb-2" size={20} />
                <span className="text-xs font-medium text-dark-gray">Name Game</span>
              </button>
            </Link>
            
            <Link href="/network-map">
              <button className="bg-white rounded-2xl p-4 card-shadow flex flex-col items-center min-w-[80px]">
                <Network className="text-turquoise text-xl mb-2" size={20} />
                <span className="text-xs font-medium text-dark-gray">Network Map</span>
              </button>
            </Link>
            
            <Link href="/friends?view=location">
              <button className="bg-white rounded-2xl p-4 card-shadow flex flex-col items-center min-w-[80px]">
                <MapPin className="text-sky text-xl mb-2" size={20} />
                <span className="text-xs font-medium text-dark-gray">By Location</span>
              </button>
            </Link>
            
            <button className="bg-white rounded-2xl p-4 card-shadow flex flex-col items-center min-w-[80px]">
              <Download className="text-mint text-xl mb-2" size={20} />
              <span className="text-xs font-medium text-dark-gray">Import</span>
            </button>
          </div>
        </div>

        {/* Recent Friends */}
        {recentFriends.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark-gray">Recent Friends</h2>
              <Link href="/friends">
                <button className="text-coral text-sm font-medium">View All</button>
              </Link>
            </div>
            
            <div>
              {recentFriends.map((friend) => {
                const fullName = `${friend.firstName} ${friend.lastName || ''}`.trim();
                const relationshipLevel = RELATIONSHIP_LEVELS[friend.relationshipLevel as keyof typeof RELATIONSHIP_LEVELS] || RELATIONSHIP_LEVELS.acquaintance;
                
                const getColorClasses = (level: string) => {
                  switch (level) {
                    case 'close':
                      return { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-500' };
                    case 'friend':
                      return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' };
                    case 'work':
                      return { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500' };
                    default:
                      return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500' };
                  }
                };
                
                const colors = getColorClasses(friend.relationshipLevel);
                const IconMap = { star: Star, shield: Shield, heart: Heart, briefcase: Briefcase };
                const RelationshipIcon = IconMap[relationshipLevel.icon as keyof typeof IconMap];
                
                return (
                  <Link key={friend.id} href={`/friends/${friend.id}`}>
                    <div className={`${colors.bg} ${colors.border} border rounded-2xl p-4 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-all duration-200 mb-3`}>
                      <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
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
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      <BottomNavigation />
      <FloatingActionButton />
    </div>
  );
}
