import { useQuery } from "@tanstack/react-query";
import { User, Settings, Download, Upload, Trash2, BarChart3, Users, MapPin, Calendar, Shield } from "lucide-react";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Friend, Activity } from "@shared/schema";

export default function Profile() {
  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Calculate profile stats
  const stats = {
    totalFriends: friends.length,
    closeFriends: friends.filter(f => f.relationshipLevel === 'close').length,
    newThisMonth: friends.filter(f => {
      // Since friends table doesn't have createdAt, use lastInteraction as proxy
      const friendDate = new Date(f.lastInteraction || new Date());
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return friendDate > thirtyDaysAgo;
    }).length,
    totalActivities: activities.length,
    citiesCount: new Set(friends.map(f => f.location).filter(Boolean)).size,
    avgConnectionsPerMonth: Math.round(friends.length / Math.max(1, getMonthsSinceFirstFriend(friends)))
  };

  function getMonthsSinceFirstFriend(friends: Friend[]): number {
    if (friends.length === 0) return 1;
    
    const oldestFriend = friends.reduce((oldest, friend) => {
      const friendDate = new Date(friend.lastInteraction || new Date());
      const oldestDate = new Date(oldest.lastInteraction || new Date());
      return friendDate < oldestDate ? friend : oldest;
    });
    
    const now = new Date();
    const firstFriendDate = new Date(oldestFriend.lastInteraction || new Date());
    const monthsDiff = (now.getFullYear() - firstFriendDate.getFullYear()) * 12 + 
                      (now.getMonth() - firstFriendDate.getMonth());
    
    return Math.max(1, monthsDiff);
  }

  const exportData = () => {
    const data = {
      friends,
      activities,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friends-network-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to delete all your data? This action cannot be undone.")) {
      if (window.confirm("This will permanently delete all friends and activities. Type 'DELETE' to confirm.")) {
        // This would need API endpoints to actually clear data
        alert("Data clearing functionality would be implemented here with proper API endpoints.");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-6 pt-12 pb-8 text-white">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-white/80">Manage your network</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 pb-32 space-y-6">
        {/* Network Overview */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <BarChart3 className="text-blue-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-dark-gray">Network Overview</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{stats.totalFriends}</div>
              <div className="text-sm text-gray-600">Total Friends</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-rose-600">{stats.closeFriends}</div>
              <div className="text-sm text-gray-600">Close Friends</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{stats.newThisMonth}</div>
              <div className="text-sm text-gray-600">Added This Month</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{stats.citiesCount}</div>
              <div className="text-sm text-gray-600">Cities</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Network Growth</span>
              </div>
              <span className="text-sm text-blue-600">
                ~{stats.avgConnectionsPerMonth} friends/month
              </span>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-xl">
              <Users className="text-green-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-dark-gray">Activity Summary</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-2">
                <Shield size={16} className="text-gray-600" />
                <span className="text-sm font-medium">Total Interactions</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{stats.totalActivities}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-gray-600" />
                <span className="text-sm font-medium">Geographic Reach</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{stats.citiesCount} cities</span>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Settings className="text-orange-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-dark-gray">Data Management</h2>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={exportData}
              variant="outline" 
              className="w-full justify-start space-x-2"
            >
              <Download size={16} />
              <span>Export Your Data</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start space-x-2 opacity-50 cursor-not-allowed"
              disabled
            >
              <Upload size={16} />
              <span>Import Data (Coming Soon)</span>
            </Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-xl">
              <Trash2 className="text-red-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete all your data. This action cannot be undone.
          </p>
          
          <Button 
            onClick={clearAllData}
            variant="destructive" 
            size="sm"
            className="w-full"
          >
            Delete All Data
          </Button>
        </Card>

        {/* App Info */}
        <Card className="p-6 bg-gray-100">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-gray-700">Friends Network</h3>
            <p className="text-xs text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-500">
              Built for meaningful connections
            </p>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}