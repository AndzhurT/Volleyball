import { Calendar, MapPin, Activity, Users } from "lucide-react";
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
    { label: "Games This Month", value: "12", icon: Calendar, color: "text-primary-foreground" },
    { label: "Hours Played", value: "24", icon: Activity, color: "text-primary-foreground" },
    { label: "New Friends", value: "8", icon: Users, color: "text-primary-foreground" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section with Stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 text-primary-foreground">
        <div className="relative z-10">
          <h1 className="text-3xl mb-2">Welcome back, Alex! 👋</h1>
          <p className="text-primary-foreground/80 mb-6">
            You have {upcomingGames.length} upcoming games and {nearbyGames.length} new games in your area
          </p>

          {/* Stats inside header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-primary-foreground/10 backdrop-blur-sm border-2 border-primary-foreground/20 rounded-lg p-4 hover:bg-primary-foreground/15 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-primary-foreground/20 ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl">{stat.value}</div>
                      <div className="text-sm text-primary-foreground/70">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="bg-card text-foreground hover:bg-card/90">
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
            <Button
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Find Games Nearby
            </Button>
          </div>
        </div>

        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-secondary/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-gradient-to-tr from-primary-foreground/10 to-transparent rounded-full blur-2xl" />
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
            <Card key={index} className="p-4 border-2 border-border/30 bg-card">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>{" "}
                    <span className="font-medium">{activity.game}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/30">
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
