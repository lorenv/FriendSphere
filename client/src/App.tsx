import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Friends from "@/pages/friends";
import FriendDetail from "@/pages/friend-detail";
import AddFriend from "@/pages/add-friend";
import EditFriend from "@/pages/edit-friend";
import NetworkMap from "@/pages/network-map";
import NameGame from "@/pages/name-game";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/friends" component={Friends} />
      <Route path="/friends/:id" component={FriendDetail} />
      <Route path="/friends/:id/edit" component={EditFriend} />
      <Route path="/add-friend" component={AddFriend} />
      <Route path="/network-map" component={NetworkMap} />
      <Route path="/name-game" component={NameGame} />
      <Route component={NotFound} />
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
