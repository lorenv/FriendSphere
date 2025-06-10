import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Friend, Relationship } from "@shared/schema";
import { BottomNavigation } from "@/components/bottom-navigation";
import { FRIEND_CATEGORIES } from "@/lib/constants";
import { ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

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

  const networkData = useMemo(() => {
    if (friends.length === 0) return { nodes: [], links: [] };

    const centerX = 200;
    const centerY = 300;
    const radius = 120;

    // Create nodes
    const nodes: NetworkNode[] = friends.map((friend, index) => {
      const angle = (index / friends.length) * 2 * Math.PI;
      const category = FRIEND_CATEGORIES[friend.category as keyof typeof FRIEND_CATEGORIES] || FRIEND_CATEGORIES.friends;
      
      return {
        id: friend.id,
        name: `${friend.firstName} ${friend.lastName || ''}`.trim(),
        category: friend.category,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color: category.color,
        connections: [],
      };
    });

    // Create links based on relationships
    const links: NetworkLink[] = [];
    allRelationships.forEach(rel => {
      links.push({
        source: rel.friendId,
        target: rel.relatedFriendId,
        type: rel.relationshipType,
      });
    });

    // Update connection counts
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (sourceNode) sourceNode.connections.push(link.target);
      if (targetNode) targetNode.connections.push(link.source);
    });

    return { nodes, links };
  }, [friends, allRelationships]);

  const handleNodeClick = (nodeId: number) => {
    if (selectedNode === nodeId) {
      setLocation(`/friends/${nodeId}`);
    } else {
      setSelectedNode(nodeId);
    }
  };

  if (friends.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
        <div className="gradient-bg px-6 pt-12 pb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setLocation("/")}
              className="p-2 bg-white/20 rounded-full"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">Network Map</h1>
            <div className="w-10"></div>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-500 mb-2">No friends to map</div>
            <p className="text-sm text-gray-400">Add some friends to see your network</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative overflow-hidden">
      {/* Header */}
      <div className="gradient-bg px-6 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setLocation("/")}
            className="p-2 bg-white/20 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Network Map</h1>
          <div className="w-10"></div>
        </div>
        
        <p className="text-white/80 text-sm">Visualize your friend connections</p>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          >
            <ZoomOut size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          >
            <ZoomIn size={16} />
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          {friends.length} friends
        </div>
      </div>

      {/* Network Visualization */}
      <div className="px-6 pb-24">
        <div className="bg-gray-50 rounded-3xl p-6 h-96 relative overflow-hidden">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 400 600"
            style={{ transform: `scale(${zoom})` }}
            className="transition-transform duration-200"
          >
            {/* Links */}
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
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  opacity={selectedNode && (selectedNode === link.source || selectedNode === link.target) ? 1 : 0.3}
                />
              );
            })}

            {/* Nodes */}
            {networkData.nodes.map((node) => {
              const isSelected = selectedNode === node.id;
              const isConnected = selectedNode && node.connections.includes(selectedNode);
              const opacity = selectedNode && !isSelected && !isConnected ? 0.3 : 1;
              
              return (
                <g key={node.id} opacity={opacity}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 25 : 20}
                    fill={`hsl(${node.color === 'coral' ? '2, 100%, 69%' : 
                                 node.color === 'turquoise' ? '177, 48%, 60%' :
                                 node.color === 'sky' ? '202, 65%, 56%' :
                                 node.color === 'mint' ? '146, 33%, 67%' :
                                 '300, 47%, 72%'})`}
                    stroke="white"
                    strokeWidth={isSelected ? 4 : 2}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => handleNodeClick(node.id)}
                  />
                  <text
                    x={node.x}
                    y={node.y + 35}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#374151"
                    className="pointer-events-none"
                  >
                    {node.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Selected Node Info */}
          {selectedNode && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-4 card-shadow">
              {(() => {
                const node = networkData.nodes.find(n => n.id === selectedNode);
                if (!node) return null;
                const friend = friends.find(f => f.id === selectedNode);
                if (!friend) return null;
                
                return (
                  <div>
                    <h3 className="font-semibold text-dark-gray">{`${friend.firstName} ${friend.lastName || ''}`.trim()}</h3>
                    <p className="text-sm text-gray-500">
                      {FRIEND_CATEGORIES[friend.category as keyof typeof FRIEND_CATEGORIES]?.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {node.connections.length} connections
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-2 w-full bg-coral hover:bg-coral/90"
                      onClick={() => setLocation(`/friends/${selectedNode}`)}
                    >
                      View Details
                    </Button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white rounded-2xl p-4 card-shadow">
          <h3 className="font-semibold text-dark-gray mb-3">Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(FRIEND_CATEGORIES).map(([key, category]) => {
              const count = friends.filter(f => f.category === key).length;
              if (count === 0) return null;
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${category.color === 'coral' ? '2, 100%, 69%' : 
                                                 category.color === 'turquoise' ? '177, 48%, 60%' :
                                                 category.color === 'sky' ? '202, 65%, 56%' :
                                                 category.color === 'mint' ? '146, 33%, 67%' :
                                                 '300, 47%, 72%'})` 
                    }}
                  />
                  <span className="text-sm text-gray-600">{category.label} ({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
