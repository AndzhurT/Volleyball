import { Calendar, MapPin, Activity, TrendingUp } from "lucide-react";
import { GameCard, type Game } from "./game-card";
import { PlayerCard, type Player } from "./player-card";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface DashboardProps {
  upcomingGames: Game[];
  nearbyGames: Game[];
  suggestedPlayers: Player[];
  onRSVP: (gameId: string) => void;
  onViewGameDetails: (gameId: string) => void;
  onConnect: (playerId: string) => void;
  onViewProfile: (playerId: string) => void;
}

export function Dashboard({
  upcomingGames,
  nearbyGames,
  suggestedPlayers,
  onRSVP,
  onViewGameDetails,
  onConnect,
  onViewProfile,
}: DashboardProps) {
  const stats = [
    { label: "Games This Month", value: "12", icon: Calendar, color: "text-primary" },
    { label: "Hours Played", value: "24", icon: Activity, color: "text-secondary" },
    { label: "Win Rate", value: "67%", icon: TrendingUp, color: "text-success" },
    { label: "New Friends", value: "8", icon: MapPin, color: "text-info" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground">
        <div className="relative z-10">
          <h1 className="text-3xl mb-2">Welcome back, Alex! 👋</h1>
          <p className="text-primary-foreground/90 mb-6">
            You have {upcomingGames.length} upcoming games and {nearbyGames.length} new games in your area
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="bg-card text-foreground hover:bg-card/90 border border-border">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
            <Button variant="outline" className="border-primary-foreground/50 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20">
              <MapPin className="w-4 h-4 mr-2" />
              Find Games Nearby
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-5 border border-border hover:border-primary/50 transition-all bg-card cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl mb-1">Your Upcoming Games</h2>
            <p className="text-muted-foreground">Games you've joined and scheduled</p>
          </div>
          <Button variant="outline" className="border-border hover:border-primary/50">
            View All
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingGames.slice(0, 3).map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onRSVP={onRSVP}
              onViewDetails={onViewGameDetails}
              isJoined={true}
            />
          ))}
        </div>
      </section>

      {/* Nearby Games */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl mb-1">Discover Nearby Games</h2>
            <p className="text-muted-foreground">New games happening in your area</p>
          </div>
          <Button variant="outline" className="border-border hover:border-primary/50">
            View Map
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyGames.slice(0, 6).map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onRSVP={onRSVP}
              onViewDetails={onViewGameDetails}
            />
          ))}
        </div>
      </section>

      {/* Suggested Players */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl mb-1">Players You May Know</h2>
            <p className="text-muted-foreground">Connect with players in your area</p>
          </div>
          <Button variant="outline" className="border-border hover:border-primary/50">
            See More
          </Button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onConnect={onConnect}
              onViewProfile={onViewProfile}
              compact
            />
          ))}
        </div>
      </section>

      {/* Activity Feed */}
      <section>
        <div className="mb-4">
          <h2 className="text-2xl mb-1">Recent Activity</h2>
          <p className="text-muted-foreground">What's happening in your network</p>
        </div>
        <div className="space-y-3">
          {[
            { user: "Sarah Johnson", action: "joined", game: "Sunday Beach Volleyball", time: "2 hours ago" },
            { user: "Mike Chen", action: "created", game: "Competitive Indoor Match", time: "4 hours ago" },
            { user: "Emma Davis", action: "completed", game: "Friday Night Volleyball", time: "Yesterday" },
          ].map((activity, index) => (
            <Card key={index} className="p-4 border border-border bg-card hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>{" "}
                    <span className="font-medium">{activity.game}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                  {activity.action}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
