import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { 
  UserPlus, 
  MapPin, 
  Edit, 
  Calendar, 
  MessageSquare, 
  Phone, 
  Coffee,
  Gift,
  Camera,
  Trash2,
  ArrowLeft,
  Filter
} from "lucide-react";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Friend } from "@shared/schema";

interface EnrichedActivity extends Activity {
  friend?: Friend;
}

export default function ActivityPage() {
  const [, setLocation] = useLocation();

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  // Enrich activities with friend data
  const enrichedActivities: EnrichedActivity[] = activities.map(activity => ({
    ...activity,
    friend: friends.find(f => f.id === activity.friendId)
  }));

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'added': return UserPlus;
      case 'updated': return Edit;
      case 'moved': return MapPin;
      case 'called': return Phone;
      case 'met': return Coffee;
      case 'birthday': return Gift;
      case 'photo': return Camera;
      case 'note': return MessageSquare;
      default: return Calendar;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'added': return 'bg-green-100 text-green-600';
      case 'updated': return 'bg-blue-100 text-blue-600';
      case 'moved': return 'bg-purple-100 text-purple-600';
      case 'called': return 'bg-orange-100 text-orange-600';
      case 'met': return 'bg-pink-100 text-pink-600';
      case 'birthday': return 'bg-yellow-100 text-yellow-600';
      case 'photo': return 'bg-indigo-100 text-indigo-600';
      case 'note': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getActivityText = (activity: EnrichedActivity) => {
    const friendName = activity.friend ? 
      `${activity.friend.firstName} ${activity.friend.lastName || ''}`.trim() : 
      'Unknown Friend';

    switch (activity.activityType) {
      case 'added':
        return `Added ${friendName} to your network`;
      case 'updated':
        return `Updated ${friendName}'s information`;
      case 'moved':
        return `${friendName} moved to a new location`;
      case 'called':
        return `Called ${friendName}`;
      case 'met':
        return `Met up with ${friendName}`;
      case 'birthday':
        return `${friendName}'s birthday`;
      case 'photo':
        return `Added photo for ${friendName}`;
      case 'note':
        return `Added note about ${friendName}`;
      default:
        return `Activity with ${friendName}`;
    }
  };

  // Group activities by date
  const groupedActivities = enrichedActivities.reduce((acc: { [key: string]: EnrichedActivity[] }, activity) => {
    const date = format(new Date(activity.timestamp || new Date()), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (activitiesLoading) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-500 to-teal-600 px-6 pt-12 pb-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/')}
                className="text-white hover:bg-white/20 p-2"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Activity Feed</h1>
                <p className="text-white/80">Your recent interactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="px-6 py-12 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Activities Yet</h3>
          <p className="text-gray-500 mb-6">
            Start adding friends and interacting with them to see your activity feed.
          </p>
          <Button onClick={() => setLocation('/add-friend')} className="w-full">
            Add Your First Friend
          </Button>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-teal-600 px-6 pt-12 pb-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="text-white hover:bg-white/20 p-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Activity Feed</h1>
              <p className="text-white/80">{activities.length} recent activities</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-2"
          >
            <Filter size={20} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 pb-32 space-y-6">
        {sortedDates.map((date) => (
          <div key={date}>
            {/* Date Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <div className="px-3 py-1 bg-white rounded-full border border-gray-200">
                <span className="text-xs font-medium text-gray-600">
                  {format(new Date(date), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Activities for this date */}
            <div className="space-y-3">
              {groupedActivities[date]
                .sort((a, b) => {
                  const timeA = new Date(a.timestamp || new Date()).getTime();
                  const timeB = new Date(b.timestamp || new Date()).getTime();
                  return timeB - timeA;
                })
                .map((activity) => {
                  const IconComponent = getActivityIcon(activity.activityType);
                  const colorClasses = getActivityColor(activity.activityType);
                  
                  return (
                    <div 
                      key={activity.id}
                      className="bg-white rounded-xl p-4 card-shadow hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        if (activity.friend) {
                          setLocation(`/friends/${activity.friend.id}`);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${colorClasses}`}>
                          <IconComponent size={16} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-gray">
                            {getActivityText(activity)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp || new Date()), { addSuffix: true })}
                          </p>
                          {activity.description && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">
                              {activity.description}
                            </p>
                          )}
                        </div>

                        {activity.friend && (
                          <div className="flex-shrink-0">
                            {activity.friend.photo ? (
                              <img 
                                src={activity.friend.photo} 
                                alt={activity.friend.firstName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {activity.friend.firstName.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Quick Action */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Keep Growing Your Network</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add more friends to see more activities and strengthen your connections.
            </p>
            <Button 
              onClick={() => setLocation('/add-friend')}
              size="sm"
              className="w-full"
            >
              <UserPlus size={16} className="mr-2" />
              Add New Friend
            </Button>
          </div>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}