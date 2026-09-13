import { MapPin, Star, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  positions: string[];
  gamesPlayed: number;
  rating: number;
  bio?: string;
  isFollowing?: boolean;
}

interface PlayerCardProps {
  player: Player;
  onConnect?: (playerId: string) => void;
  onViewProfile?: (playerId: string) => void;
  compact?: boolean;
}

export function PlayerCard({ player, onConnect, onViewProfile, compact = false }: PlayerCardProps) {
  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-success/10 text-success border-success/20";
      case "Intermediate":
        return "bg-warning/10 text-warning border-warning/20";
      case "Advanced":
        return "bg-danger/10 text-danger border-danger/20";
      default:
        return "bg-info/10 text-info border-info/20";
    }
  };

  if (compact) {
    return (
      <Card className="p-4 hover:shadow-md transition-all border border-border hover:border-primary/50 bg-card cursor-pointer">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={player.avatar} alt={player.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {player.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <h4 className="truncate">{player.name}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span>{player.rating.toFixed(1)}</span>
              <span>•</span>
              <span>{player.gamesPlayed} games</span>
            </div>
          </div>
          <Button
            size="sm"
            variant={player.isFollowing ? "outline" : "default"}
            onClick={() => onConnect?.(player.id)}
            className={!player.isFollowing ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}
          >
            {player.isFollowing ? "Following" : "Follow"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-border hover:border-primary/50 bg-card cursor-pointer">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={player.avatar} alt={player.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {player.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="mb-1">{player.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="w-3 h-3" />
              <span>{player.location}</span>
            </div>
            <Badge variant="outline" className={getSkillLevelColor(player.skillLevel)}>
              {player.skillLevel}
            </Badge>
          </div>
        </div>

        {player.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{player.bio}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Games Played</div>
              <div className="font-medium">{player.gamesPlayed}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-warning fill-warning" />
            <div>
              <div className="text-sm text-muted-foreground">Rating</div>
              <div className="font-medium">{player.rating.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {player.positions.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Positions</div>
            <div className="flex flex-wrap gap-2">
              {player.positions.map((position) => (
                <Badge
                  key={position}
                  variant="outline"
                  className="bg-muted/50 text-muted-foreground border-border"
                >
                  {position}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onConnect?.(player.id)}
            variant={player.isFollowing ? "outline" : "default"}
            className={`flex-1 ${!player.isFollowing ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
          >
            {player.isFollowing ? "Following" : "Follow"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onViewProfile?.(player.id)}
            className="border-border hover:border-primary/50"
          >
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  );
}
