import { Search, Filter, SlidersHorizontal, X } from "lucide-react";
import { PlayerCard, type Player } from "./player-card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { useState } from "react";

interface PlayersViewOption1Props {
  players: Player[];
  onConnect?: (playerId: string) => void;
  onViewProfile?: (playerId: string) => void;
}

export function PlayersViewOption1({ players, onConnect, onViewProfile }: PlayersViewOption1Props) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const skillLevels = ["All Levels", "Beginner", "Intermediate", "Advanced"];
  const positions = ["All Positions", "Outside Hitter", "Middle Blocker", "Setter", "Libero", "Defensive Specialist"];

  const filteredPlayers = players.filter(player => {
    if (selectedSkill && selectedSkill !== "All Levels" && player.skillLevel !== selectedSkill) return false;
    if (selectedPosition && selectedPosition !== "All Positions" && !player.positions.includes(selectedPosition)) return false;
    return true;
  });

  const activeFilterCount = [selectedSkill, selectedPosition].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedSkill(null);
    setSelectedPosition(null);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3>Filters</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-3 block">Skill Level</label>
            <div className="space-y-2">
              {skillLevels.map((level) => (
                <Button
                  key={level}
                  variant={selectedSkill === level || (!selectedSkill && level === "All Levels") ? "default" : "ghost"}
                  onClick={() => setSelectedSkill(level === "All Levels" ? null : level)}
                  className={`w-full justify-start ${selectedSkill === level || (!selectedSkill && level === "All Levels") ? "bg-primary text-primary-foreground" : ""}`}
                  size="sm"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-3 block">Position</label>
            <div className="space-y-2">
              {positions.map((position) => (
                <Button
                  key={position}
                  variant={selectedPosition === position || (!selectedPosition && position === "All Positions") ? "default" : "ghost"}
                  onClick={() => setSelectedPosition(position === "All Positions" ? null : position)}
                  className={`w-full justify-start ${selectedPosition === position || (!selectedPosition && position === "All Positions") ? "bg-primary text-primary-foreground" : ""}`}
                  size="sm"
                >
                  {position}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/30">
        <div className="text-sm text-muted-foreground mb-3">Quick Stats</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Players</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {players.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Active Today</span>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              {Math.floor(players.length * 0.6)}
            </Badge>
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full border-2 border-border/30"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-8">
      {/* Desktop Sidebar Filters */}
      <aside className="hidden lg:block space-y-6">
        <Card className="p-6 border-2 border-border/30 sticky top-24">
          <FilterContent />
        </Card>
      </aside>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl mb-2">Discover Players</h1>
            <p className="text-muted-foreground">
              Connect with {filteredPlayers.length} volleyball players in your community
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                className="pl-10 border-2 border-border/30 focus:border-primary/50 bg-input-background"
              />
            </div>

            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden border-2 border-border/30 relative"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <SheetHeader className="mb-6">
                  <SheetTitle>Filter Players</SheetTitle>
                </SheetHeader>
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedSkill && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 gap-1 pl-3 pr-2 py-1"
              >
                {selectedSkill}
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedPosition && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 gap-1 pl-3 pr-2 py-1"
              >
                {selectedPosition}
                <button
                  onClick={() => setSelectedPosition(null)}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onConnect={onConnect}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <Card className="p-12 text-center border-2 border-dashed border-border/30">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2">No players found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms to find more players.
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
