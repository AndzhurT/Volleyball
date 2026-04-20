import { useEffect, useMemo, useState } from "react";
import { MapPin, Filter, Search, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { GameCard, type Game } from "./game-card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface GameWithCoords extends Game {
  latitude: number;
  longitude: number;
}

interface MapViewProps {
  games: GameWithCoords[];
  onRSVP: (gameId: string) => void;
  onViewGameDetails: (gameId: string) => void;
}

const volleyballIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FlyToGame({
  selectedGame,
}: {
  selectedGame: GameWithCoords | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedGame &&
      typeof selectedGame.latitude === "number" &&
      typeof selectedGame.longitude === "number"
    ) {
      map.flyTo([selectedGame.latitude, selectedGame.longitude], 13, {
        duration: 1.2,
      });
    }
  }, [selectedGame, map]);

  return null;
}

export function MapView({
  games,
  onRSVP,
  onViewGameDetails,
}: MapViewProps) {
  const [selectedGame, setSelectedGame] = useState<GameWithCoords | null>(null);
  const [skillFilter, setSkillFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSkill =
        skillFilter === "all" || game.skillLevel === skillFilter;
      const matchesType = typeFilter === "all" || game.type === typeFilter;
      const matchesSearch =
        !searchQuery ||
        game.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSkill && matchesType && matchesSearch;
    });
  }, [games, skillFilter, typeFilter, searchQuery]);

  const validGames = filteredGames.filter(
  (game) =>
    typeof game.latitude === "number" &&
    typeof game.longitude === "number"
);

  const defaultCenter: [number, number] =
    validGames.length > 0
      ? [validGames[0].latitude, validGames[0].longitude]
      : [39.9526, -75.1652];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Find Games Near You</h1>
        <p className="text-muted-foreground">
          Discover volleyball games happening in your area
        </p>
      </div>

      <Card className="p-4 border-2 border-border/30 bg-card">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by location or game name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-border"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
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
        <div className="lg:col-span-2">
          <Card className="relative overflow-hidden border-2 border-border/30 bg-card h-[600px]">
            <MapContainer
              center={defaultCenter}
              zoom={11}
              scrollWheelZoom={true}
              className="h-full w-full z-0"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FlyToGame selectedGame={selectedGame} />

              {validGames.map((game) => (
                <Marker
                  key={game.id}
                  position={[game.latitude, game.longitude]}
                  icon={volleyballIcon}
                  eventHandlers={{
                    click: () => setSelectedGame(game),
                  }}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[180px]">
                      <h4 className="font-semibold">{game.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {game.location}
                      </p>
                      <p className="text-sm">
                        {game.date} • {game.time}
                      </p>
                      <p className="text-sm">
                        Spots left: {game.spotsLeft}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => onViewGameDetails(game.id)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRSVP(game.id)}
                        >
                          RSVP
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="absolute top-4 right-4 z-[1000]">
              <Button
                size="icon"
                variant="secondary"
                className="bg-card shadow-lg border-2 border-border"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>

            <div className="absolute bottom-4 left-4 z-[1000]">
              <Badge className="bg-card text-foreground border-2 border-border shadow-lg px-4 py-2">
                {filteredGames.length} games found
              </Badge>
            </div>
          </Card>
        </div>

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
                        <Badge
                          variant="outline"
                          className="mt-2 bg-success/10 text-success border-success/20"
                        >
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