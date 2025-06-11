import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Friend } from "@shared/schema";
import { BottomNavigation } from "@/components/bottom-navigation";
import { ArrowLeft, Users, ChevronRight, UserPlus, Heart, Shield, Briefcase, Star, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface ConnectionGroup {
  title: string;
  count: number;
  friends: Friend[];
  color: string;
  icon: any;
  description: string;
}

interface IntroductionChain {
  introducer: Friend;
  introducedFriends: Friend[];
}

type ViewMode = 'overview' | 'introducer' | 'friend-detail';

export default function NetworkMap() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedIntroducer, setSelectedIntroducer] = useState<Friend | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  // Get relationship level colors and icons
  const getRelationshipColors = (level: string) => {
    switch (level) {
      case 'close':
        return { color: 'from-rose-400 to-rose-600', icon: Heart };
      case 'friend':
        return { color: 'from-blue-400 to-blue-600', icon: Shield };
      case 'work':
        return { color: 'from-slate-400 to-slate-600', icon: Briefcase };
      default: // acquaintance
        return { color: 'from-emerald-400 to-emerald-600', icon: Star };
    }
  };

  // Build connection groups for overview
  const connectionGroups: ConnectionGroup[] = [
    {
      title: "Close Friends",
      count: friends.filter(f => f.relationshipLevel === 'close').length,
      friends: friends.filter(f => f.relationshipLevel === 'close'),
      color: "from-rose-400 to-rose-600",
      icon: Heart,
      description: "Your inner circle"
    },
    {
      title: "Friends",
      count: friends.filter(f => f.relationshipLevel === 'friend').length,
      friends: friends.filter(f => f.relationshipLevel === 'friend'),
      color: "from-blue-400 to-blue-600",
      icon: Shield,
      description: "Regular friends"
    },
    {
      title: "Work Network",
      count: friends.filter(f => f.relationshipLevel === 'work').length,
      friends: friends.filter(f => f.relationshipLevel === 'work'),
      color: "from-slate-400 to-slate-600",
      icon: Briefcase,
      description: "Professional connections"
    },
    {
      title: "Acquaintances",
      count: friends.filter(f => f.relationshipLevel === 'acquaintance').length,
      friends: friends.filter(f => f.relationshipLevel === 'acquaintance'),
      color: "from-emerald-400 to-emerald-600",
      icon: Star,
      description: "New connections"
    }
  ];

  // Build introduction chains
  const introductionChains: IntroductionChain[] = friends
    .filter(friend => friend.introducedBy)
    .reduce((acc: IntroductionChain[], friend) => {
      const introducer = friends.find(f => f.id === friend.introducedBy);
      if (!introducer) return acc;

      const existingChain = acc.find(chain => chain.introducer.id === introducer.id);
      if (existingChain) {
        existingChain.introducedFriends.push(friend);
      } else {
        acc.push({
          introducer,
          introducedFriends: [friend]
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.introducedFriends.length - a.introducedFriends.length);

  // Get hierarchical location-based connections
  const locationHierarchy = friends.reduce((acc: { [key: string]: { [key: string]: Friend[] } }, friend) => {
    if (friend.location) {
      const city = friend.location;
      const neighborhood = friend.neighborhood || 'Other areas';
      
      if (!acc[city]) acc[city] = {};
      if (!acc[city][neighborhood]) acc[city][neighborhood] = [];
      acc[city][neighborhood].push(friend);
    }
    return acc;
  }, {});

  // Build hierarchical clusters
  const locationClusters = Object.entries(locationHierarchy)
    .map(([city, neighborhoods]) => {
      const totalFriends = Object.values(neighborhoods).flat().length;
      const neighborhoodCount = Object.keys(neighborhoods).length;
      
      return {
        city,
        totalFriends,
        neighborhoodCount,
        neighborhoods: Object.entries(neighborhoods)
          .sort(([, a], [, b]) => b.length - a.length)
          .map(([neighborhood, friends]) => ({
            neighborhood,
            friends,
            count: friends.length
          }))
      };
    })
    .filter(cluster => cluster.totalFriends >= 1)
    .sort((a, b) => b.totalFriends - a.totalFriends)
    .slice(0, 5);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Network Summary */}
      <div className="bg-white rounded-2xl p-6 card-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Users className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-dark-gray">Your Network</h3>
            <p className="text-sm text-gray-500">{friends.length} total connections</p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-rose-600">{friends.filter(f => f.relationshipLevel === 'close').length}</div>
            <div className="text-xs text-gray-500">Close</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{friends.filter(f => f.relationshipLevel === 'friend').length}</div>
            <div className="text-xs text-gray-500">Friends</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-600">{friends.filter(f => f.relationshipLevel === 'work').length}</div>
            <div className="text-xs text-gray-500">Work</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600">{friends.filter(f => f.relationshipLevel === 'acquaintance').length}</div>
            <div className="text-xs text-gray-500">New</div>
          </div>
        </div>
      </div>

      {/* Introduction Chains */}
      {introductionChains.length > 0 && (
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-xl">
              <UserPlus className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-dark-gray">Connection Makers</h3>
              <p className="text-sm text-gray-500">Friends who introduced you to others</p>
            </div>
          </div>

          <div className="space-y-3">
            {introductionChains.slice(0, 5).map((chain) => {
              const { color } = getRelationshipColors(chain.introducer.relationshipLevel || 'acquaintance');
              return (
                <div 
                  key={chain.introducer.id}
                  onClick={() => {
                    setSelectedIntroducer(chain.introducer);
                    setViewMode('introducer');
                  }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center overflow-hidden`}>
                      {chain.introducer.photo ? (
                        <img 
                          src={chain.introducer.photo} 
                          alt={chain.introducer.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {chain.introducer.firstName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-dark-gray">
                        {chain.introducer.firstName} {chain.introducer.lastName || ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        Introduced {chain.introducedFriends.length} friend{chain.introducedFriends.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              );
            })}
          </div>

          {introductionChains.length > 5 && (
            <button className="w-full mt-3 py-2 text-blue-600 text-sm font-medium">
              View all connection makers
            </button>
          )}
        </div>
      )}

      {/* Location Clusters */}
      {locationClusters.length > 0 && (
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Users className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-dark-gray">Geographic Clusters</h3>
              <p className="text-sm text-gray-500">Cities and neighborhoods with multiple connections</p>
            </div>
          </div>

          <div className="space-y-4">
            {locationClusters.map((cluster) => (
              <div key={cluster.city} className="space-y-2">
                {/* City Header */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-dark-gray">{cluster.city}</p>
                    <p className="text-sm text-gray-500">
                      {cluster.totalFriends} friends in {cluster.neighborhoodCount} area{cluster.neighborhoodCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {cluster.neighborhoods.flatMap(n => n.friends).slice(0, 4).map((friend) => {
                      const { color } = getRelationshipColors(friend.relationshipLevel || 'acquaintance');
                      return (
                        <div 
                          key={friend.id}
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center border-2 border-white overflow-hidden`}
                        >
                          {friend.photo ? (
                            <img 
                              src={friend.photo} 
                              alt={friend.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-xs">
                              {friend.firstName.charAt(0)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {cluster.totalFriends > 4 && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white">
                        <span className="text-gray-600 font-semibold text-xs">
                          +{cluster.totalFriends - 4}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Neighborhoods */}
                <div className="ml-4 space-y-2">
                  {cluster.neighborhoods.map((neighborhood) => (
                    <div 
                      key={neighborhood.neighborhood}
                      className="flex items-center justify-between p-2 bg-gray-100 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-dark-gray">
                          {neighborhood.neighborhood === 'Other areas' ? 'Other areas' : neighborhood.neighborhood}
                        </p>
                        <p className="text-xs text-gray-500">{neighborhood.count} friend{neighborhood.count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex -space-x-1">
                        {neighborhood.friends.slice(0, 3).map((friend) => {
                          const { color } = getRelationshipColors(friend.relationshipLevel || 'acquaintance');
                          return (
                            <div 
                              key={friend.id}
                              className={`w-6 h-6 rounded-full bg-gradient-to-br ${color} flex items-center justify-center border border-white overflow-hidden`}
                            >
                              {friend.photo ? (
                                <img 
                                  src={friend.photo} 
                                  alt={friend.firstName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-xs">
                                  {friend.firstName.charAt(0)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {neighborhood.count > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center border border-white">
                            <span className="text-gray-600 font-bold text-xs">
                              +{neighborhood.count - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderIntroducerView = () => {
    if (!selectedIntroducer) return null;
    
    const chain = introductionChains.find(c => c.introducer.id === selectedIntroducer.id);
    if (!chain) return null;

    const { color } = getRelationshipColors(selectedIntroducer.relationshipLevel || 'acquaintance');

    return (
      <div className="space-y-6">
        {/* Introducer Header */}
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center overflow-hidden`}>
              {selectedIntroducer.photo ? (
                <img 
                  src={selectedIntroducer.photo} 
                  alt={selectedIntroducer.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {selectedIntroducer.firstName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-dark-gray">
                {selectedIntroducer.firstName} {selectedIntroducer.lastName || ''}
              </h2>
              <p className="text-gray-500">
                Introduced you to {chain.introducedFriends.length} friend{chain.introducedFriends.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Introduced Friends */}
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <h3 className="font-semibold text-dark-gray mb-4">People they introduced you to</h3>
          <div className="space-y-3">
            {chain.introducedFriends.map((friend) => {
              const friendColors = getRelationshipColors(friend.relationshipLevel || 'acquaintance');
              return (
                <div 
                  key={friend.id}
                  onClick={() => {
                    setSelectedFriend(friend);
                    setViewMode('friend-detail');
                  }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${friendColors.color} flex items-center justify-center overflow-hidden`}>
                      {friend.photo ? (
                        <img 
                          src={friend.photo} 
                          alt={friend.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {friend.firstName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-dark-gray">
                        {friend.firstName} {friend.lastName || ''}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {friend.relationshipLevel || 'acquaintance'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderFriendDetail = () => {
    if (!selectedFriend) return null;

    const { color } = getRelationshipColors(selectedFriend.relationshipLevel || 'acquaintance');
    const introducer = selectedFriend.introducedBy ? friends.find(f => f.id === selectedFriend.introducedBy) : null;
    const mutualConnections = friends.filter(f => 
      f.id !== selectedFriend.id && 
      f.location === selectedFriend.location
    );

    return (
      <div className="space-y-6">
        {/* Friend Header */}
        <div className="bg-white rounded-2xl p-6 card-shadow">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center overflow-hidden`}>
              {selectedFriend.photo ? (
                <img 
                  src={selectedFriend.photo} 
                  alt={selectedFriend.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {selectedFriend.firstName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-dark-gray">
                {selectedFriend.firstName} {selectedFriend.lastName || ''}
              </h2>
              <p className="text-gray-500 capitalize">
                {selectedFriend.relationshipLevel || 'acquaintance'}
              </p>
              {selectedFriend.location && (
                <p className="text-sm text-gray-400">
                  {selectedFriend.neighborhood ? `${selectedFriend.neighborhood}, ` : ''}{selectedFriend.location}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/friends/${selectedFriend.id}`)}
              className="text-blue-600 border-blue-200"
            >
              View Profile
            </Button>
          </div>
        </div>

        {/* Connection Info */}
        {introducer && (
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h3 className="font-semibold text-dark-gray mb-3">How you met</h3>
            <div 
              onClick={() => {
                setSelectedIntroducer(introducer);
                setViewMode('introducer');
              }}
              className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlus className="text-green-600" size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Introduced by</p>
                <p className="font-medium text-dark-gray">
                  {introducer.firstName} {introducer.lastName || ''}
                </p>
              </div>
              <ArrowRight size={16} className="text-green-600" />
            </div>
          </div>
        )}

        {/* Mutual Connections */}
        {mutualConnections.length > 0 && (
          <div className="bg-white rounded-2xl p-6 card-shadow">
            <h3 className="font-semibold text-dark-gray mb-3">
              Mutual connections ({mutualConnections.length})
            </h3>
            <div className="space-y-2">
              {mutualConnections.slice(0, 3).map((friend) => {
                const friendColors = getRelationshipColors(friend.relationshipLevel || 'acquaintance');
                return (
                  <div key={friend.id} className="flex items-center space-x-3 p-2 rounded-lg">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${friendColors.color} flex items-center justify-center overflow-hidden`}>
                      {friend.photo ? (
                        <img 
                          src={friend.photo} 
                          alt={friend.firstName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-xs">
                          {friend.firstName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-gray">
                      {friend.firstName} {friend.lastName || ''}
                    </p>
                  </div>
                );
              })}
              {mutualConnections.length > 3 && (
                <p className="text-sm text-gray-500 pl-11">
                  +{mutualConnections.length - 3} more in {selectedFriend.location}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'introducer':
        return selectedIntroducer ? `${selectedIntroducer.firstName}'s Introductions` : 'Connections';
      case 'friend-detail':
        return selectedFriend ? `${selectedFriend.firstName}'s Network` : 'Friend Detail';
      default:
        return 'Connection Explorer';
    }
  };

  const handleBack = () => {
    if (viewMode === 'introducer' || viewMode === 'friend-detail') {
      setViewMode('overview');
      setSelectedIntroducer(null);
      setSelectedFriend(null);
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-dark-gray">{getTitle()}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 pb-32">
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'introducer' && renderIntroducerView()}
        {viewMode === 'friend-detail' && renderFriendDetail()}
      </div>

      <BottomNavigation />
    </div>
  );
}