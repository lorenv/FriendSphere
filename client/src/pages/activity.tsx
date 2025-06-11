import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, UserPlus, Edit, Trash2, MessageCircle, Phone, Video, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Activity, Friend } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

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
    friend: friends.find(friend => friend.id === activity.friendId)
  }));

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return UserPlus;
      case 'updated':
        return Edit;
      case 'deleted':
        return Trash2;
      case 'call':
        return Phone;
      case 'video_call':
        return Video;
      case 'message':
        return MessageCircle;
      case 'email':
        return Mail;
      default:
        return Calendar;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'text-green-600 bg-green-100';
      case 'updated':
        return 'text-blue-600 bg-blue-100';
      case 'deleted':
        return 'text-red-600 bg-red-100';
      case 'call':
      case 'video_call':
        return 'text-purple-600 bg-purple-100';
      case 'message':
        return 'text-indigo-600 bg-indigo-100';
      case 'email':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityText = (activity: EnrichedActivity) => {
    const friendName = activity.friend ? `${activity.friend.firstName} ${activity.friend.lastName || ''}`.trim() : 'Unknown friend';
    
    switch (activity.activityType) {
      case 'created':
        return `Added ${friendName} to your network`;
      case 'updated':
        return `Updated ${friendName}'s profile`;
      case 'deleted':
        return `Removed ${friendName} from your network`;
      case 'call':
        return `Called ${friendName}`;
      case 'video_call':
        return `Video call with ${friendName}`;
      case 'message':
        return `Messaged ${friendName}`;
      case 'email':
        return `Emailed ${friendName}`;
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
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading activities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-dark-gray">Activity</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 pb-32">
        {enrichedActivities.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No activity yet</h3>
            <p className="text-gray-500">Your friend interactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-4">
                {/* Date Header */}
                <div className="sticky top-0 bg-gray-50 py-2">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
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
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                  {activity.friend.photo ? (
                                    <img 
                                      src={activity.friend.photo} 
                                      alt={activity.friend.firstName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-gray-600 font-semibold text-sm">
                                      {activity.friend.firstName.charAt(0)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}