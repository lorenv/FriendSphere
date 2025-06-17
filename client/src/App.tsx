import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Friend Manager</h1>
        <p>Loading application...</p>
      </div>} />
      <Route component={() => <div>404 - Page not found</div>} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Router />
      </div>
    </QueryClientProvider>
  );
}

export default App;