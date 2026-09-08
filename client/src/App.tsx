
import EGChain from "@/pages/EGChain";import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const Upload = lazy(() => import("./pages/Upload"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const Trending = lazy(() => import("./pages/Trending"));
const Profile = lazy(() => import("./pages/Profile"));
const SpinWheel = lazy(() => import("./pages/SpinWheel"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Feed = lazy(() => import("./pages/Feed"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const Hashtags = lazy(() => import("./pages/Hashtags"));
const HashtagVideos = lazy(() => import("./pages/HashtagVideos"));
const Challenges = lazy(() => import("./pages/Challenges"));
const ChallengeDetail = lazy(() => import("./pages/ChallengeDetail"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Publish = lazy(() => import("./pages/Publish"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const CommunityTrends = lazy(() => import("./pages/CommunityTrends"));
const CommunityTrendDetail = lazy(() => import("./pages/CommunityTrendDetail"));
const NewCommunityTrend = lazy(() => import("./pages/NewCommunityTrend"));
const LocalChallenges = lazy(() => import("./pages/LocalChallenges"));
const LocalChallengeDetail = lazy(() => import("./pages/LocalChallengeDetail"));
const ContentAssistant = lazy(() => import("./pages/ContentAssistant"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const Competitions = lazy(() => import("./pages/Competitions"));
const CompetitionDetail = lazy(() => import("./pages/CompetitionDetail"));
const NewCompetition = lazy(() => import("./pages/NewCompetition"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const Referrals = lazy(() => import("./pages/Referrals"));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/upload" component={Upload} />
        <Route path="/video/:id" component={VideoDetail} />
        <Route path="/trending" component={Trending} />
        <Route path="/profile/:id" component={Profile} />
        <Route path="/spin" component={SpinWheel} />
        <Route path="/search" component={SearchPage} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/feed" component={Feed} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/messages" component={Messages} />
        <Route path="/hashtags" component={Hashtags} />
        <Route path="/hashtag/:name" component={HashtagVideos} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/challenge/:id" component={ChallengeDetail} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/publish" component={Publish} />
        <Route path="/post/:id" component={PostDetail} />
        <Route path="/community-trends" component={CommunityTrends} />
        <Route path="/community-trends/new" component={NewCommunityTrend} />
        <Route path="/community-trends/:id" component={CommunityTrendDetail} />
        <Route path="/local-challenges" component={LocalChallenges} />
        <Route path="/local-challenges/:id" component={LocalChallengeDetail} />
        <Route path="/content-assistant" component={ContentAssistant} />
        <Route path="/creator-dashboard" component={CreatorDashboard} />
        <Route path="/competitions" component={Competitions} />
        <Route path="/competitions/new" component={NewCompetition} />
        <Route path="/competitions/:id" component={CompetitionDetail} />
        <Route path="/notification-settings" component={NotificationSettings} />
        <Route path="/referrals" component={Referrals} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>

<Route path="/eg-chain" component={EGChain} />
<Route path="/chain" component={EGChain} />
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
