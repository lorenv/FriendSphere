import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Friend, Relationship } from "@shared/schema";
import { BottomNavigation } from "@/components/bottom-navigation";
import { RELATIONSHIP_LEVELS } from "@/lib/constants";
import { ArrowLeft, ZoomIn, ZoomOut, MapPin, Users, Network } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NetworkNode {
  id: number;
  name: string;
  category: string;
  x: number;
  y: number;
  color: string;
  connections: number[];
}

interface NetworkLink {
  source: number;
  target: number;
  type: string;
}

interface LocationGroup {
  location: string;
  friends: Friend[];
  x: number;
  y: number;
  color: string;
  isArea: boolean;
  neighborhoodCount: number;
}

export default function NetworkMap() {
  const [, setLocation] = useLocation();
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
  });

  const { data: allRelationships = [] } = useQuery<Relationship[]>({
    queryKey: ["/api/relationships"],
    queryFn: async () => {
      // Since we don't have a direct endpoint for all relationships,
      // we'll simulate this based on the introducedBy field
      const relationships: Relationship[] = [];
      friends.forEach(friend => {
        if (friend.introducedBy) {
          relationships.push({
            id: relationships.length + 1,
            friendId: friend.id,
            relatedFriendId: friend.introducedBy,
            relationshipType: "introduced_by"
          });
        }
      });
      return relationships;
    },
    enabled: friends.length > 0,
  });

  // Location clustering logic
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const locationClusters = useMemo(() => {
    if (friends.length === 0) return { areas: [], neighborhoods: new Map() };

    // Location mapping patterns for major metropolitan areas
    const areaPatterns = {
      'Los Angeles': [
        'LA', 'Los Angeles', 'Hollywood', 'Beverly Hills', 'Santa Monica', 
        'Venice', 'West Hollywood', 'Culver City', 'Marina del Rey', 
        'Manhattan Beach', 'Hermosa Beach', 'Redondo Beach', 'El Segundo',
        'Westwood', 'Brentwood', 'Pacific Palisades', 'Malibu', 'Pasadena',
        'Glendale', 'Burbank', 'Studio City', 'North Hollywood', 'Sherman Oaks',
        'Encino', 'Tarzana', 'Calabasas', 'Woodland Hills', 'Canoga Park'
      ],
      'San Francisco Bay Area': [
        'San Francisco', 'SF', 'Oakland', 'Berkeley', 'Palo Alto', 'Mountain View',
        'Menlo Park', 'Redwood City', 'San Mateo', 'Fremont', 'Hayward',
        'Union City', 'Sunnyvale', 'Santa Clara', 'San Jose', 'Cupertino',
        'Saratoga', 'Los Gatos', 'Campbell', 'Milpitas', 'Foster City'
      ],
      'New York City': [
        'NYC', 'New York', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx',
        'Staten Island', 'Long Island City', 'Williamsburg', 'Park Slope',
        'DUMBO', 'SoHo', 'Tribeca', 'Upper East Side', 'Upper West Side',
        'Chelsea', 'Greenwich Village', 'East Village', 'Midtown', 'Harlem'
      ],
      'Chicago': [
        'Chicago', 'Lincoln Park', 'Wicker Park', 'Bucktown', 'Logan Square',
        'River North', 'Gold Coast', 'Old Town', 'Lincoln Square', 'Lakeview',
        'Boystown', 'Andersonville', 'Uptown', 'Rogers Park', 'Evanston'
      ],
      'Seattle': [
        'Seattle', 'Capitol Hill', 'Fremont', 'Ballard', 'Queen Anne',
        'Belltown', 'South Lake Union', 'Wallingford', 'Greenwood',
        'Phinney Ridge', 'University District', 'Bellevue', 'Redmond', 'Kirkland'
      ],
      'Austin': [
        'Austin', 'South Austin', 'East Austin', 'West Austin', 'North Austin',
        'Downtown Austin', 'Zilker', 'Travis Heights', 'Barton Hills',
        'Mueller', 'Cedar Park', 'Round Rock', 'Pflugerville'
      ],
      'Miami': [
        'Miami', 'Miami Beach', 'South Beach', 'Wynwood', 'Little Havana',
        'Coral Gables', 'Coconut Grove', 'Aventura', 'Bal Harbour',
        'Key Biscayne', 'Homestead', 'Kendall', 'Doral'
      ]
    };

    const areaGroups = new Map<string, Friend[]>();
    const neighborhoodsByArea = new Map<string, Map<string, Friend[]>>();
    const unmatchedFriends: Friend[] = [];

    // Group friends by metropolitan areas
    friends.forEach(friend => {
      const location = friend.location || 'Unknown Location';
      let matchedArea: string | null = null;

      // Check if location matches any area pattern
      for (const [area, patterns] of Object.entries(areaPatterns)) {
        if (patterns.some(pattern => 
          location.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(location.toLowerCase())
        )) {
          matchedArea = area;
          break;
        }
      }

      if (matchedArea) {
        // Add to area group
        if (!areaGroups.has(matchedArea)) {
          areaGroups.set(matchedArea, []);
          neighborhoodsByArea.set(matchedArea, new Map());
        }
        areaGroups.get(matchedArea)!.push(friend);

        // Also group by specific neighborhood within area
        const neighborhoods = neighborhoodsByArea.get(matchedArea)!;
        if (!neighborhoods.has(location)) {
          neighborhoods.set(location, []);
        }
        neighborhoods.get(location)!.push(friend);
      } else {
        unmatchedFriends.push(friend);
      }
    });

    // Add individual locations for unmatched friends
    unmatchedFriends.forEach(friend => {
      const location = friend.location || 'Unknown Location';
      if (!areaGroups.has(location)) {
        areaGroups.set(location, []);
      }
      areaGroups.get(location)!.push(friend);
    });

    const colors = ['coral', 'turquoise', 'mint', 'sky', 'lavender'];
    let colorIndex = 0;

    const areas = Array.from(areaGroups.entries()).map(([area, friendList], index) => {
      const angle = (index / areaGroups.size) * 2 * Math.PI;
      const centerX = 200;
      const centerY = 300;
      const radius = 100;
      
      return {
        location: area,
        friends: friendList,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color: colors[colorIndex++ % colors.length],
        isArea: areaPatterns.hasOwnProperty(area),
        neighborhoodCount: neighborhoodsByArea.get(area)?.size || 0
      };
    });

    return { areas, neighborhoods: neighborhoodsByArea };
  }, [friends]);

  const toggleAreaExpansion = (area: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(area)) {
      newExpanded.delete(area);
    } else {
      newExpanded.add(area);
    }
    setExpandedAreas(newExpanded);
  };

  // Relationship network data (family tree style)
  const networkData = useMemo(() => {
    if (friends.length === 0) return { nodes: [], links: [] };

    // Create a hierarchical layout based on introduction relationships
    const levels = new Map<number, number>();
    const processedFriends = new Set<number>();
    const rootFriends: Friend[] = [];
    
    // Find root friends (not introduced by anyone)
    friends.forEach(friend => {
      if (!friend.introducedBy) {
        rootFriends.push(friend);
        levels.set(friend.id, 0);
        processedFriends.add(friend.id);
      }
    });

    // Build levels based on introduction chains
    let currentLevel = 1;
    let remainingFriends = friends.filter(f => !processedFriends.has(f.id));
    
    while (remainingFriends.length > 0 && currentLevel < 5) {
      const currentLevelFriends: Friend[] = [];
      
      remainingFriends.forEach(friend => {
        if (friend.introducedBy && processedFriends.has(friend.introducedBy)) {
          levels.set(friend.id, currentLevel);
          processedFriends.add(friend.id);
          currentLevelFriends.push(friend);
        }
      });
      
      if (currentLevelFriends.length === 0) break;
      
      remainingFriends = remainingFriends.filter(f => !processedFriends.has(f.id));
      currentLevel++;
    }

    // Position remaining friends at the bottom level
    remainingFriends.forEach(friend => {
      levels.set(friend.id, currentLevel);
    });

    // Create nodes with hierarchical positioning
    const nodes: NetworkNode[] = friends.map(friend => {
      const level = levels.get(friend.id) || 0;
      const friendsAtLevel = friends.filter(f => levels.get(f.id) === level);
      const indexAtLevel = friendsAtLevel.findIndex(f => f.id === friend.id);
      
      const relationshipLevel = RELATIONSHIP_LEVELS[friend.relationshipLevel as keyof typeof RELATIONSHIP_LEVELS] || RELATIONSHIP_LEVELS.acquaintance;
      
      const x = 50 + (indexAtLevel * 300 / Math.max(1, friendsAtLevel.length - 1));
      const y = 80 + (level * 80);
      
      return {
        id: friend.id,
        name: `${friend.firstName} ${friend.lastName || ''}`.trim(),
        category: friend.relationshipLevel,
        x: Math.min(350, Math.max(50, x)),
        y,
        color: relationshipLevel.color || '#10b981',
        connections: [],
      };
    });

    // Create links based on introduction relationships
    const links: NetworkLink[] = [];
    friends.forEach(friend => {
      if (friend.introducedBy) {
        links.push({
          source: friend.introducedBy,
          target: friend.id,
          type: 'introduced_by',
        });
      }
    });

    return { nodes, links };
  }, [friends]);

  const handleNodeClick = (nodeId: number) => {
    if (selectedNode === nodeId) {
      setLocation(`/friends/${nodeId}`);
    } else {
      setSelectedNode(nodeId);
    }
  };

  if (friends.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coral via-turquoise to-mint pb-20">
        <div className="bg-white/10 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => setLocation("/")}
            className="p-2 text-white hover:bg-white/20 rounded-xl"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">Maps</h1>
          <div className="w-10"></div>
        </div>
        
        <div className="p-4">
          <div className="bg-white/90 rounded-3xl p-6 card-shadow">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Network size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Friends Yet</h3>
              <p className="text-gray-500">Add some friends to see your maps!</p>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral via-turquoise to-mint pb-20">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => setLocation("/")}
          className="p-2 text-white hover:bg-white/20 rounded-xl"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Maps</h1>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))}
            className="text-white hover:bg-white/20"
          >
            <ZoomIn size={20} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
            className="text-white hover:bg-white/20"
          >
            <ZoomOut size={20} />
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-4">
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="network" className="flex items-center space-x-2">
              <Network size={16} />
              <span>Relationship Tree</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center space-x-2">
              <MapPin size={16} />
              <span>Location Map</span>
            </TabsTrigger>
          </TabsList>

          {/* Relationship Network Tab */}
          <TabsContent value="network">
            <div className="bg-white/90 rounded-3xl p-6 card-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Relationship Tree</h3>
                <p className="text-sm text-gray-600">Shows how your friends are connected through introductions</p>
              </div>
              <div className="relative overflow-auto" style={{ height: '500px' }}>
                <svg 
                  width="400" 
                  height="600" 
                  style={{ transform: `scale(${zoom})` }}
                  className="transition-transform duration-200"
                >
                  {/* Arrow marker definition */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#94a3b8"
                      />
                    </marker>
                  </defs>

                  {/* Draw links first (behind nodes) */}
                  {networkData.links.map((link, index) => {
                    const sourceNode = networkData.nodes.find(n => n.id === link.source);
                    const targetNode = networkData.nodes.find(n => n.id === link.target);
                    if (!sourceNode || !targetNode) return null;

                    return (
                      <line
                        key={index}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}

                  {/* Draw nodes */}
                  {networkData.nodes.map(node => (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={selectedNode === node.id ? "24" : "20"}
                        fill={`var(--${node.color})`}
                        stroke="white"
                        strokeWidth="3"
                        className="cursor-pointer transition-all duration-200"
                        onClick={() => handleNodeClick(node.id)}
                      />
                      <text
                        x={node.x}
                        y={node.y + 35}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700 cursor-pointer"
                        onClick={() => handleNodeClick(node.id)}
                      >
                        {node.name.length > 12 ? node.name.substring(0, 12) + '...' : node.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </TabsContent>

          {/* Location Map Tab */}
          <TabsContent value="location">
            <div className="bg-white/90 rounded-3xl p-6 card-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Friends by Location</h3>
                <p className="text-sm text-gray-600">Geographic distribution of your friend network</p>
              </div>
              <div className="relative overflow-hidden" style={{ height: '400px' }}>
                <svg 
                  width="100%" 
                  height="100%" 
                  style={{ transform: `scale(${zoom})` }}
                  className="transition-transform duration-200"
                >
                  {/* Draw location groups */}
                  {locationClusters.areas.map((group, index) => (
                    <g key={index}>
                      {/* Location circle */}
                      <circle
                        cx={group.x}
                        cy={group.y}
                        r={Math.max(30, group.friends.length * 8)}
                        fill={`var(--${group.color})`}
                        fillOpacity="0.3"
                        stroke={`var(--${group.color})`}
                        strokeWidth="3"
                        className="cursor-pointer hover:fillOpacity-50"
                        onClick={() => group.isArea && toggleAreaExpansion(group.location)}
                      />
                      
                      {/* Location label */}
                      <text
                        x={group.x}
                        y={group.y - Math.max(35, group.friends.length * 8 + 5)}
                        textAnchor="middle"
                        className="text-sm font-bold fill-gray-800"
                      >
                        {group.location}
                      </text>
                      
                      {/* Friend count */}
                      <text
                        x={group.x}
                        y={group.y}
                        textAnchor="middle"
                        className="text-lg font-bold fill-white"
                      >
                        {group.friends.length}
                      </text>
                      
                      {/* Area indicator */}
                      {group.isArea && (
                        <text
                          x={group.x}
                          y={group.y + 15}
                          textAnchor="middle"
                          className="text-xs fill-gray-700"
                        >
                          {expandedAreas.has(group.location) ? '▼ Click to collapse' : '▶ Click to expand'}
                        </text>
                      )}
                      
                      {/* Single location indicator */}
                      {!group.isArea && (
                        <text
                          x={group.x}
                          y={group.y + 15}
                          textAnchor="middle"
                          className="text-xs fill-gray-700"
                        >
                          {group.friends.length === 1 
                            ? `${group.friends[0].firstName} ${group.friends[0].lastName || ''}`.trim()
                            : `${group.friends.length} friends`
                          }
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
              
              {/* Location breakdown */}
              <div className="mt-6 space-y-3">
                <h4 className="font-semibold text-gray-800">Location Breakdown</h4>
                {locationClusters.areas.map((group, index) => (
                  <div key={index} className="space-y-2">
                    {/* Main area/location */}
                    <div 
                      className={`flex items-center justify-between p-3 bg-white/50 rounded-xl ${
                        group.isArea ? 'cursor-pointer hover:bg-white/70' : ''
                      }`}
                      onClick={() => group.isArea && toggleAreaExpansion(group.location)}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: `var(--${group.color})` }}
                        ></div>
                        <span className="font-medium text-gray-800">{group.location}</span>
                        {group.isArea && (
                          <span className="text-xs text-gray-500">
                            {expandedAreas.has(group.location) ? '▼' : '▶'}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">{group.friends.length}</div>
                        <div className="text-xs text-gray-500">
                          {group.friends.length === 1 ? 'friend' : 'friends'}
                          {group.isArea && ` in ${group.neighborhoodCount} ${group.neighborhoodCount === 1 ? 'area' : 'areas'}`}
                        </div>
                      </div>
                    </div>

                    {/* Expanded neighborhoods */}
                    {group.isArea && expandedAreas.has(group.location) && (
                      <div className="ml-8 space-y-2">
                        {(() => {
                          const neighborhoods = locationClusters.neighborhoods.get(group.location);
                          if (!neighborhoods) return null;
                          
                          const entries = Array.from(neighborhoods.entries()) as [string, Friend[]][];
                          return entries.map(([neighborhood, neighborhoodFriends], idx) => (
                            <div key={`${neighborhood}-${idx}`} className="flex items-center justify-between p-2 bg-white/30 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: `var(--${group.color})`, opacity: 0.7 }}
                                ></div>
                                <span className="text-sm text-gray-700">{neighborhood}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-700">{neighborhoodFriends.length}</div>
                                <div className="text-xs text-gray-500">
                                  {neighborhoodFriends.map(f => `${f.firstName} ${f.lastName || ''}`.trim()).join(', ')}
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}