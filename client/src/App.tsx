import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Friends from "@/pages/friends";
import FriendDetail from "@/pages/friend-detail";
import AddFriend from "@/pages/add-friend";
import EditFriend from "@/pages/edit-friend";
import NetworkMap from "@/pages/network-map";
import NameGame from "@/pages/name-game";
import Activity from "@/pages/activity";
import Profile from "@/pages/profile";
import Login from "@/pages/login";
import Register from "@/pages/register";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated ? (
        // Protected routes - user is logged in
        <>
          <Route path="/" component={Home} />
          <Route path="/friends" component={Friends} />
          <Route path="/friends/:id" component={FriendDetail} />
          <Route path="/friends/:id/edit" component={EditFriend} />
          <Route path="/add-friend" component={AddFriend} />
          <Route path="/network-map" component={NetworkMap} />
          <Route path="/name-game" component={NameGame} />
          <Route path="/activity" component={Activity} />
          <Route path="/profile" component={Profile} />
          <Route path="/login" component={() => { window.location.href = "/"; return null; }} />
          <Route path="/register" component={() => { window.location.href = "/"; return null; }} />
          <Route component={NotFound} />
        </>
      ) : (
        // Public routes - user is not logged in
        <>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route component={() => { window.location.href = "/login"; return null; }} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
