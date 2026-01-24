import { useState } from "react";
import { Home, MapPin, User, Plus, Users, Bell } from "lucide-react";
import { Button } from "./components/ui/button";
import { Dashboard } from "./components/dashboard";
import { MapView } from "./components/map-view";
import { ProfileView } from "./components/profile-view";
import { CreateGameDialog } from "./components/create-game-dialog";
import type { Game } from "./components/game-card";
import type { Player } from "./components/player-card";

type View = "dashboard" | "map" | "profile" | "browse";

function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock Data
  const mockGames: Game[] = [
    {
      id: "1",
      title: "Saturday Morning Volleyball",
      date: "Jan 11, 2026",
      time: "9:00 AM",
      location: "Downtown Sports Center",
      distance: "1.2 mi",
      skillLevel: "Intermediate",
      spotsLeft: 3,
      totalSpots: 12,
      type: "casual",
      courtType: "indoor",
      playersJoined: [
        { id: "p1", name: "Sarah J", avatar: "https://images.unsplash.com/photo-1695918428487-7934244c19ac?w=100&h=100&fit=crop" },
        { id: "p2", name: "Mike C", avatar: "" },
        { id: "p3", name: "Emma D", avatar: "" },
      ],
    },
    {
      id: "2",
      title: "Competitive Beach Tournament",
      date: "Jan 12, 2026",
      time: "2:00 PM",
      location: "Sunset Beach Courts",
      distance: "3.8 mi",
      skillLevel: "Advanced",
      spotsLeft: 1,
      totalSpots: 8,
      type: "competitive",
      courtType: "beach",
      playersJoined: [
        { id: "p4", name: "John D", avatar: "" },
        { id: "p5", name: "Lisa M", avatar: "" },
      ],
    },
    {
      id: "3",
      title: "Beginner Friendly Game",
      date: "Jan 13, 2026",
      time: "6:30 PM",
      location: "Community Recreation Center",
      distance: "0.8 mi",
      skillLevel: "Beginner",
      spotsLeft: 6,
      totalSpots: 12,
      type: "casual",
      courtType: "indoor",
      playersJoined: [
        { id: "p6", name: "Alex K", avatar: "" },
      ],
    },
    {
      id: "4",
      title: "Sunday Afternoon Social",
      date: "Jan 14, 2026",
      time: "3:00 PM",
      location: "Riverside Park",
      distance: "2.1 mi",
      skillLevel: "All Levels",
      spotsLeft: 8,
      totalSpots: 16,
      type: "casual",
      courtType: "outdoor",
      playersJoined: [
        { id: "p7", name: "Chris P", avatar: "" },
        { id: "p8", name: "Taylor R", avatar: "" },
      ],
    },
    {
      id: "5",
      title: "Competitive Indoor League",
      date: "Jan 15, 2026",
      time: "7:00 PM",
      location: "Elite Volleyball Arena",
      distance: "4.5 mi",
      skillLevel: "Advanced",
      spotsLeft: 0,
      totalSpots: 10,
      type: "competitive",
      courtType: "indoor",
      playersJoined: [
        { id: "p9", name: "Jordan B", avatar: "" },
        { id: "p10", name: "Morgan S", avatar: "" },
      ],
    },
    {
      id: "6",
      title: "Wednesday Night Pick-up",
      date: "Jan 17, 2026",
      time: "8:00 PM",
      location: "City Sports Complex",
      distance: "1.5 mi",
      skillLevel: "Intermediate",
      spotsLeft: 4,
      totalSpots: 12,
      type: "casual",
      courtType: "indoor",
      playersJoined: [
        { id: "p11", name: "Sam W", avatar: "" },
      ],
    },
  ];

  const mockPlayers: Player[] = [
    {
      id: "p1",
      name: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1695918428487-7934244c19ac?w=200&h=200&fit=crop",
      location: "Downtown",
      skillLevel: "Advanced",
      positions: ["Outside Hitter", "Setter"],
      gamesPlayed: 156,
      rating: 4.8,
      bio: "Passionate volleyball player with 8 years of experience. Love competitive games and meeting new people!",
      isFollowing: false,
    },
    {
      id: "p2",
      name: "Mike Chen",
      avatar: "",
      location: "North District",
      skillLevel: "Intermediate",
      positions: ["Middle Blocker"],
      gamesPlayed: 89,
      rating: 4.3,
      bio: "Looking to improve my blocking skills and play more competitive games.",
      isFollowing: false,
    },
    {
      id: "p3",
      name: "Emma Davis",
      avatar: "",
      location: "West Side",
      skillLevel: "Intermediate",
      positions: ["Libero", "Defensive Specialist"],
      gamesPlayed: 124,
      rating: 4.6,
      bio: "Defense is my specialty! Always ready for a good game.",
      isFollowing: true,
    },
    {
      id: "p4",
      name: "Alex Rivera",
      avatar: "",
      location: "East Bay",
      skillLevel: "Beginner",
      positions: ["Learning All"],
      gamesPlayed: 23,
      rating: 3.9,
      bio: "New to volleyball but loving every minute of it!",
      isFollowing: false,
    },
  ];

  const currentUser: Player & any = {
    id: "current",
    name: "Alex Thompson",
    avatar: "https://images.unsplash.com/photo-1695918428487-7934244c19ac?w=200&h=200&fit=crop",
    location: "San Francisco, CA",
    skillLevel: "Intermediate" as const,
    positions: ["Outside Hitter", "Setter"],
    gamesPlayed: 87,
    rating: 4.5,
    bio: "Volleyball enthusiast looking to connect with local players and improve my game!",
    gamesAttended: mockGames.slice(0, 3),
    followers: mockPlayers.slice(0, 2),
    following: mockPlayers.slice(2, 4),
    achievements: [
      { title: "First Game Completed", icon: "trophy", date: "Earned 3 months ago" },
      { title: "Team Player", icon: "users", date: "Earned 2 months ago" },
      { title: "Perfect Attendance", icon: "calendar", date: "Earned 1 month ago" },
      { title: "Top Rated Player", icon: "star", date: "Earned 2 weeks ago" },
      { title: "Community Leader", icon: "award", date: "Earned 1 week ago" },
      { title: "50 Games Milestone", icon: "trophy", date: "Earned 3 days ago" },
    ],
    stats: {
      winRate: 67,
      hoursPlayed: 145,
      favoritePosition: "Outside Hitter",
      memberSince: "March 2025",
    },
  };

  const handleCreateGame = (gameData: any) => {
    console.log("Creating game:", gameData);
    // In a real app, this would send to backend
  };

  const handleRSVP = (gameId: string) => {
    console.log("RSVP to game:", gameId);
    // In a real app, this would send to backend
  };

  const handleViewGameDetails = (gameId: string) => {
    console.log("View game details:", gameId);
    // Could open a modal or navigate to details page
  };

  const handleConnect = (playerId: string) => {
    console.log("Connect with player:", playerId);
    // In a real app, this would send to backend
  };

  const handleViewProfile = (playerId: string) => {
    console.log("View profile:", playerId);
    setCurrentView("profile");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xl">🏐</span>
              </div>
              <h1 className="text-xl font-medium">VolleyConnect</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={currentView === "dashboard" ? "default" : "ghost"}
                onClick={() => setCurrentView("dashboard")}
                className={currentView === "dashboard" ? "bg-primary text-primary-foreground" : ""}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant={currentView === "map" ? "default" : "ghost"}
                onClick={() => setCurrentView("map")}
                className={currentView === "map" ? "bg-primary text-primary-foreground" : ""}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Find Games
              </Button>
              <Button
                variant={currentView === "browse" ? "default" : "ghost"}
                onClick={() => setCurrentView("browse")}
                className={currentView === "browse" ? "bg-primary text-primary-foreground" : ""}
              >
                <Users className="w-4 h-4 mr-2" />
                Players
              </Button>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create Game</span>
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
              </Button>
              <Button
                variant={currentView === "profile" ? "default" : "ghost"}
                size="icon"
                onClick={() => setCurrentView("profile")}
                className={currentView === "profile" ? "bg-primary text-primary-foreground" : ""}
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" && (
          <Dashboard
            upcomingGames={mockGames.slice(0, 3)}
            nearbyGames={mockGames}
            suggestedPlayers={mockPlayers}
            onRSVP={handleRSVP}
            onViewGameDetails={handleViewGameDetails}
            onConnect={handleConnect}
            onViewProfile={handleViewProfile}
          />
        )}

        {currentView === "map" && (
          <MapView
            games={mockGames}
            onRSVP={handleRSVP}
            onViewGameDetails={handleViewGameDetails}
          />
        )}

        {currentView === "profile" && (
          <ProfileView
            isOwnProfile={true}
            player={currentUser}
            onEditProfile={() => console.log("Edit profile")}
            onConnect={handleConnect}
          />
        )}

        {currentView === "browse" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl mb-2">Discover Players</h1>
              <p className="text-muted-foreground">
                Connect with volleyball players in your community
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockPlayers.map((player) => (
                <div key={player.id}>
                  <div className="mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1764254811090-af4a43594a03?w=800&h=400&fit=crop"
                      alt="Players"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  {/* Player card will go here */}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Game Dialog */}
      <CreateGameDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateGame={handleCreateGame}
      />

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t-2 border-border/30 bg-card/95 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button
            variant={currentView === "dashboard" ? "default" : "ghost"}
            onClick={() => setCurrentView("dashboard")}
            className={`flex-col h-auto py-2 ${currentView === "dashboard" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">Home</span>
          </Button>
          <Button
            variant={currentView === "map" ? "default" : "ghost"}
            onClick={() => setCurrentView("map")}
            className={`flex-col h-auto py-2 ${currentView === "map" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <MapPin className="w-5 h-5 mb-1" />
            <span className="text-xs">Map</span>
          </Button>
          <Button
            variant={currentView === "browse" ? "default" : "ghost"}
            onClick={() => setCurrentView("browse")}
            className={`flex-col h-auto py-2 ${currentView === "browse" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-xs">Players</span>
          </Button>
          <Button
            variant={currentView === "profile" ? "default" : "ghost"}
            onClick={() => setCurrentView("profile")}
            className={`flex-col h-auto py-2 ${currentView === "profile" ? "bg-primary text-primary-foreground" : ""}`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>

      {/* Add padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
}

export default App;
