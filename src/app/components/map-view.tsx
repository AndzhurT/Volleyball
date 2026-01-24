import { useState } from "react";
import { MapPin, Filter, Search, Navigation } from "lucide-react";
import { GameCard, type Game } from "./game-card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface MapViewProps {
  games: Game[];
  onRSVP: (gameId: string) => void;
  onViewGameDetails: (gameId: string) => void;
}

export function MapView({ games, onRSVP, onViewGameDetails }: MapViewProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [skillFilter, setSkillFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock map pins for visual representation
  const mapPins = games.map((game, index) => ({
    id: game.id,
    x: 15 + (index * 17) % 70,
    y: 15 + (index * 23) % 70,
    game,
  }));

  const filteredGames = games.filter((game) => {
    const matchesSkill = skillFilter === "all" || game.skillLevel === skillFilter;
    const matchesType = typeFilter === "all" || game.type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      game.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSkill && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2">Find Games Near You</h1>
        <p className="text-muted-foreground">
          Discover volleyball games happening in your area
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 border-2 border-border/30 bg-card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by location or game name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-border"
            />
          </div>
          <div className="flex gap-3">
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-[160px] bg-input-background border-border">
                <SelectValue placeholder="Skill Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] bg-input-background border-border">
                <SelectValue placeholder="Game Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="competitive">Competitive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-border">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="relative overflow-hidden border-2 border-border/30 bg-card h-[600px]">
            {/* Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/10">
              {/* Grid Pattern */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(var(--border) 1px, transparent 1px),
                    linear-gradient(90deg, var(--border) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />
              
              {/* Map Pins */}
              {mapPins
                .filter((pin) => filteredGames.some((g) => g.id === pin.game.id))
                .map((pin) => (
                  <button
                    key={pin.id}
                    onClick={() => setSelectedGame(pin.game)}
                    className="absolute transform -translate-x-1/2 -translate-y-full group"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  >
                    <div className="relative">
                      <MapPin
                        className={`w-10 h-10 transition-all ${
                          selectedGame?.id === pin.id
                            ? "text-secondary scale-125 drop-shadow-lg"
                            : "text-primary hover:scale-110"
                        }`}
                        fill="currentColor"
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge className="whitespace-nowrap text-xs bg-card text-foreground border-2 border-primary shadow-lg">
                          {pin.game.title}
                        </Badge>
                      </div>
                      {pin.game.spotsLeft <= 2 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border-2 border-card animate-pulse" />
                      )}
                    </div>
                  </button>
                ))}

              {/* Location Indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute w-16 h-16 bg-info/20 rounded-full animate-ping" />
                  <div className="relative w-8 h-8 bg-info rounded-full border-4 border-card shadow-lg flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-card" />
                  </div>
                </div>
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="bg-card shadow-lg border-2 border-border"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>

            {/* Results Counter */}
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-card text-foreground border-2 border-border shadow-lg px-4 py-2">
                {filteredGames.length} games found
              </Badge>
            </div>
          </Card>
        </div>

        {/* Game Details Sidebar */}
        <div className="space-y-4">
          {selectedGame ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl">Selected Game</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGame(null)}
                >
                  Clear
                </Button>
              </div>
              <GameCard
                game={selectedGame}
                onRSVP={onRSVP}
                onViewDetails={onViewGameDetails}
              />
            </div>
          ) : (
            <div>
              <h3 className="text-xl mb-4">Nearby Games</h3>
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
                {filteredGames.slice(0, 8).map((game) => (
                  <Card
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className="p-4 cursor-pointer hover:shadow-md transition-all border-2 border-border/30 hover:border-primary/40 bg-card"
                  >
                    <h4 className="mb-2">{game.title}</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{game.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{game.date}</span>
                        <span>•</span>
                        <span>{game.time}</span>
                      </div>
                      {game.distance && (
                        <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">
                          {game.distance}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
