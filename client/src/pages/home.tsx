import { useQuery } from "@tanstack/react-query";
import { Search, Heart, Users, Briefcase, UserPlus, Gamepad2, Network, MapPin, Download } from "lucide-react";
import { Link } from "wouter";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Friend, Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

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
            
            <Link href="/friends?category=close_friends">
              <div className="bg-gradient-to-br from-coral to-coral/80 rounded-3xl p-4 text-white card-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <Heart size={24} />
                  <span className="text-2xl font-bold">{stats.categoryBreakdown?.close_friends || 0}</span>
                </div>
                <h3 className="font-semibold">Close Friends</h3>
                <p className="text-xs text-white/80">Your inner circle</p>
              </div>
            </Link>
            
            <Link href="/friends?category=friends">
              <div className="bg-gradient-to-br from-turquoise to-turquoise/80 rounded-3xl p-4 text-white card-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <Users size={24} />
                  <span className="text-2xl font-bold">{stats.categoryBreakdown?.friends || 0}</span>
                </div>
                <h3 className="font-semibold">Friends</h3>
                <p className="text-xs text-white/80">Regular friends</p>
              </div>
            </Link>
            
            <Link href="/friends?category=work_friends">
              <div className="bg-gradient-to-br from-sky to-sky/80 rounded-3xl p-4 text-white card-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <Briefcase size={24} />
                  <span className="text-2xl font-bold">{stats?.categoryBreakdown?.work_friends || 0}</span>
                </div>
                <h3 className="font-semibold">Work Friends</h3>
                <p className="text-xs text-white/80">Professional network</p>
              </div>
            </Link>
            
            <Link href="/friends?category=new_friends">
              <div className="bg-gradient-to-br from-mint to-mint/80 rounded-3xl p-4 text-white card-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <UserPlus size={24} />
                  <span className="text-2xl font-bold">{stats?.categoryBreakdown?.new_friends || 0}</span>
                </div>
                <h3 className="font-semibold">New Friends</h3>
                <p className="text-xs text-white/80">Recently met</p>
              </div>
            </Link>
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
            
            <div className="space-y-3">
              {recentFriends.map((friend) => {
                const fullName = `${friend.firstName} ${friend.lastName || ''}`.trim();
                return (
                  <Link key={friend.id} href={`/friends/${friend.id}`}>
                    <div className="bg-white rounded-2xl p-4 card-shadow flex items-center space-x-4 cursor-pointer">
                      <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center overflow-hidden">
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
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-dark-gray">{fullName}</h3>
                        {friend.location && (
                          <p className="text-sm text-gray-500 mb-1">{friend.location}</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="bg-coral/10 text-coral text-xs px-2 py-1 rounded-full font-medium">
                            {friend.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {friend.interests && friend.interests.length > 0 && (
                            <span className="bg-turquoise/10 text-turquoise text-xs px-2 py-1 rounded-full font-medium">
                              {friend.interests[0]}
                            </span>
                          )}
                        </div>
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
