import { Calendar, MapPin, Users, Clock, Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  distance?: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  spotsLeft: number;
  totalSpots: number;
  type: "casual" | "competitive";
  courtType: "indoor" | "outdoor" | "beach";
  playersJoined: Array<{ id: string; name: string; avatar: string }>;
}

interface GameCardProps {
  game: Game;
  onRSVP?: (gameId: string) => void;
  onViewDetails?: (gameId: string) => void;
  isJoined?: boolean;
}

export function GameCard({ game, onRSVP, onViewDetails, isJoined = false }: GameCardProps) {
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

  const getTypeColor = (type: string) => {
    return type === "competitive" 
      ? "bg-secondary/10 text-secondary border-secondary/20"
      : "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-border hover:border-primary/50 bg-card cursor-pointer">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg mb-2">{game.title}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className={getSkillLevelColor(game.skillLevel)}>
                {game.skillLevel}
              </Badge>
              <Badge variant="outline" className={getTypeColor(game.type)}>
                <Trophy className="w-3 h-3 mr-1" />
                {game.type}
              </Badge>
              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                {game.courtType}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{game.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{game.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{game.location}</span>
            {game.distance && (
              <span className="text-xs text-muted-foreground ml-auto">({game.distance})</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className={game.spotsLeft <= 2 ? "text-warning" : "text-muted-foreground"}>
              {game.spotsLeft} spots left
            </span>
            <span className="text-muted-foreground">/ {game.totalSpots} total</span>
          </div>
        </div>

        {game.playersJoined.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {game.playersJoined.slice(0, 3).map((player) => (
                <div
                  key={player.id}
                  className="w-8 h-8 rounded-full bg-primary border-2 border-card overflow-hidden"
                  title={player.name}
                >
                  {player.avatar && (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
            {game.playersJoined.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{game.playersJoined.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {isJoined ? (
            <Button variant="outline" className="flex-1" disabled>
              Joined ✓
            </Button>
          ) : (
            <Button
              onClick={() => onRSVP?.(game.id)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={game.spotsLeft === 0}
            >
              {game.spotsLeft === 0 ? "Full" : "Join Game"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onViewDetails?.(game.id)}
            className="border-border hover:border-primary/50"
          >
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
