import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
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

import PhotoImport from "@/pages/photo-import";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={Home} />
      <Route path="/friends" component={Friends} />
      <Route path="/friend/:id" component={FriendDetail} />
      <Route path="/friend/:id/edit" component={EditFriend} />
      <Route path="/add-friend" component={AddFriend} />
      <Route path="/photo-import" component={PhotoImport} />
      <Route path="/network-map" component={NetworkMap} />
      <Route path="/name-game" component={NameGame} />
      <Route path="/activity" component={Activity} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;