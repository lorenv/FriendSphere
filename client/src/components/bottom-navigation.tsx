import { Link, useLocation } from "wouter";
import { Home, Users, Map, User } from "lucide-react";

export function BottomNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50">
      <div className="flex items-center justify-around py-3 px-6">
        <Link href="/">
          <button className={`flex flex-col items-center space-y-1 ${
            isActive("/") ? "text-coral" : "text-gray-400"
          }`}>
            <Home size={20} />
            <span className="text-xs font-medium">Home</span>
          </button>
        </Link>
        
        <Link href="/friends">
          <button className={`flex flex-col items-center space-y-1 ${
            isActive("/friends") ? "text-coral" : "text-gray-400"
          }`}>
            <Users size={20} />
            <span className="text-xs font-medium">Friends</span>
          </button>
        </Link>
        
        <Link href="/network-map">
          <button className={`flex flex-col items-center space-y-1 ${
            isActive("/network-map") ? "text-coral" : "text-gray-400"
          }`}>
            <Map size={20} />
            <span className="text-xs font-medium">Map</span>
          </button>
        </Link>
        
        <Link href="/profile">
          <button className={`flex flex-col items-center space-y-1 ${
            isActive("/profile") ? "text-coral" : "text-gray-400"
          }`}>
            <User size={20} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
