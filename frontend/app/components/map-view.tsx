import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Filter, Search, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GameCard, type Game } from './game-card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';

const GAMES_PER_BATCH = 10;

interface GameWithCoords extends Game {
    latitude?: number;
    longitude?: number;
}

interface MapViewProps {
    games: GameWithCoords[];
    joinedGameIds?: string[];
    onRSVP: (gameId: string) => void;
    onViewGameDetails: (gameId: string) => void;
}

interface DateTimeFilters {
    dateFrom: string;
    dateTo: string;
    timeFrom: string;
    timeTo: string;
}

const EMPTY_DATE_TIME_FILTERS: DateTimeFilters = { dateFrom: '', dateTo: '', timeFrom: '', timeTo: '' };

function countActiveFilters(filters: DateTimeFilters) {
    return Object.values(filters).filter(Boolean).length;
}

const volleyballIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function FlyToGame({ selectedGame }: { selectedGame: GameWithCoords | null }) {
    const map = useMap();

    useEffect(() => {
        if (selectedGame && typeof selectedGame.latitude === 'number' && typeof selectedGame.longitude === 'number') {
            map.flyTo([selectedGame.latitude, selectedGame.longitude], 13, {
                duration: 1.2,
            });
        }
    }, [selectedGame, map]);

    return null;
}

export function MapView({ games, joinedGameIds = [], onRSVP, onViewGameDetails }: MapViewProps) {
    const [selectedGame, setSelectedGame] = useState<GameWithCoords | null>(null);
    const [skillFilter, setSkillFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleGameCount, setVisibleGameCount] = useState(GAMES_PER_BATCH);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<DateTimeFilters>(EMPTY_DATE_TIME_FILTERS);
    const [draftFilters, setDraftFilters] = useState<DateTimeFilters>(EMPTY_DATE_TIME_FILTERS);
    const gameListRef = useRef<HTMLDivElement>(null);
    const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

    const filteredGames = useMemo(() => {
        return games.filter((game) => {
            const matchesSkill = skillFilter === 'all' || game.skillLevel === skillFilter;
            const matchesType = typeFilter === 'all' || game.type === typeFilter;
            const matchesSearch =
                !searchQuery ||
                game.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                game.title.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesDate =
                (!appliedFilters.dateFrom || game.date >= appliedFilters.dateFrom) &&
                (!appliedFilters.dateTo || game.date <= appliedFilters.dateTo);
            const matchesTime =
                (!appliedFilters.timeFrom || game.time >= appliedFilters.timeFrom) &&
                (!appliedFilters.timeTo || game.time <= appliedFilters.timeTo);

            return matchesSkill && matchesType && matchesSearch && matchesDate && matchesTime;
        });
    }, [games, skillFilter, typeFilter, searchQuery, appliedFilters]);

    const validGames = filteredGames.filter(
        (game): game is GameWithCoords & { latitude: number; longitude: number } =>
            typeof game.latitude === 'number' && typeof game.longitude === 'number',
    );
    const visibleGames = filteredGames.slice(0, visibleGameCount);
    const visibleMapGames = validGames.slice(0, visibleGameCount);

    const appliedFilterCount = countActiveFilters(appliedFilters);
    const draftFilterCount = countActiveFilters(draftFilters);

    const clearDraftFilters = () => setDraftFilters(EMPTY_DATE_TIME_FILTERS);

    const handleApplyFilters = () => {
        setAppliedFilters(draftFilters);
        setIsFilterOpen(false);
    };

    const handleFilterOpenChange = (open: boolean) => {
        setIsFilterOpen(open);
        if (open) setDraftFilters(appliedFilters);
    };

    useEffect(() => {
        setVisibleGameCount(GAMES_PER_BATCH);
    }, [skillFilter, typeFilter, searchQuery, appliedFilters]);

    useEffect(() => {
        const sentinel = loadMoreSentinelRef.current;
        const scrollRoot = gameListRef.current;
        if (selectedGame || !sentinel || !scrollRoot || visibleGameCount >= filteredGames.length) return;
        if (typeof IntersectionObserver === 'undefined') return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisibleGameCount((current) => Math.min(current + GAMES_PER_BATCH, filteredGames.length));
                }
            },
            { root: scrollRoot, rootMargin: '160px' },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [filteredGames.length, selectedGame, visibleGameCount]);

    const defaultCenter: [number, number] =
        validGames.length > 0 ? [validGames[0].latitude, validGames[0].longitude] : [39.9526, -75.1652];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl mb-2">Find Games Near You</h1>
                <p className="text-muted-foreground">Discover volleyball games happening in your area</p>
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

                        <Popover open={isFilterOpen} onOpenChange={handleFilterOpenChange}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="border-border relative">
                                    <Filter className="w-4 h-4 mr-2" />
                                    More Filters
                                    {appliedFilterCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                                            {appliedFilterCount}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-[320px] p-0">
                                <div className="flex items-center justify-between px-3 py-2.5">
                                    <h3 className="text-sm font-semibold">More Filters</h3>
                                    {draftFilterCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearDraftFilters}
                                            className="text-muted-foreground h-7 px-2 text-xs">
                                            Clear all
                                        </Button>
                                    )}
                                </div>
                                <Separator />
                                <div className="p-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="filter-date-from" className="text-xs text-muted-foreground">
                                                Date from
                                            </Label>
                                            <Input
                                                id="filter-date-from"
                                                type="date"
                                                value={draftFilters.dateFrom}
                                                onChange={(e) => setDraftFilters({ ...draftFilters, dateFrom: e.target.value })}
                                                className="bg-input-background border-border focus:border-primary"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="filter-date-to" className="text-xs text-muted-foreground">
                                                Date to
                                            </Label>
                                            <Input
                                                id="filter-date-to"
                                                type="date"
                                                value={draftFilters.dateTo}
                                                onChange={(e) => setDraftFilters({ ...draftFilters, dateTo: e.target.value })}
                                                className="bg-input-background border-border focus:border-primary"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="filter-time-from" className="text-xs text-muted-foreground">
                                                Time from
                                            </Label>
                                            <Input
                                                id="filter-time-from"
                                                type="time"
                                                value={draftFilters.timeFrom}
                                                onChange={(e) => setDraftFilters({ ...draftFilters, timeFrom: e.target.value })}
                                                className="bg-input-background border-border focus:border-primary"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="filter-time-to" className="text-xs text-muted-foreground">
                                                Time to
                                            </Label>
                                            <Input
                                                id="filter-time-to"
                                                type="time"
                                                value={draftFilters.timeTo}
                                                onChange={(e) => setDraftFilters({ ...draftFilters, timeTo: e.target.value })}
                                                className="bg-input-background border-border focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex gap-2 p-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsFilterOpen(false)}
                                        className="flex-1 border-border">
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleApplyFilters} className="flex-1">
                                        Apply
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
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
                            className="h-full w-full z-0">
                            <TileLayer
                                attribution="&copy; OpenStreetMap contributors"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <FlyToGame selectedGame={selectedGame} />

                            {visibleMapGames.map((game) => (
                                <Marker
                                    key={game.id}
                                    position={[game.latitude, game.longitude]}
                                    icon={volleyballIcon}
                                    eventHandlers={{
                                        click: () => setSelectedGame(game),
                                    }}>
                                    <Popup>
                                        <div className="space-y-2 min-w-[180px]">
                                            <h4 className="font-semibold">{game.title}</h4>
                                            <p className="text-sm text-muted-foreground">{game.location}</p>
                                            <p className="text-sm">
                                                {game.date} • {game.time}
                                            </p>
                                            <p className="text-sm">Spots left: {game.spotsLeft}</p>
                                            <div className="flex gap-2 pt-1">
                                                <Button size="sm" onClick={() => onViewGameDetails(game.id)}>
                                                    View
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={
                                                        joinedGameIds.includes(game.id) ||
                                                        game.lifecycleStatus === 'ended'
                                                    }
                                                    onClick={() => onRSVP(game.id)}>
                                                    {joinedGameIds.includes(game.id) ? 'Joined' : 'RSVP'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        <div className="absolute top-4 right-4 z-[50]">
                            <Button size="icon" variant="outline" className="bg-card shadow-lg border-2 border-border">
                                <Navigation className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="absolute bottom-4 left-4 z-[1000]">
                            <Badge className="bg-card text-foreground border-2 border-border shadow-lg px-4 py-2">
                                Showing {visibleGames.length} of {filteredGames.length} games
                            </Badge>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    {selectedGame ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl">Selected Game</h3>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedGame(null)}>
                                    Clear
                                </Button>
                            </div>

                            <GameCard
                                game={selectedGame}
                                onRSVP={onRSVP}
                                onViewDetails={onViewGameDetails}
                                isJoined={joinedGameIds.includes(selectedGame.id)}
                            />
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-xl mb-4">Found {filteredGames.length} Games</h3>
                            <div ref={gameListRef} className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
                                {visibleGames.map((game) => (
                                    <Card
                                        key={game.id}
                                        onClick={() => setSelectedGame(game)}
                                        className="p-4 cursor-pointer hover:shadow-md transition-all border-2 border-border/30 hover:border-primary/40 bg-card">
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
                                                    className="mt-2 bg-success/10 text-success border-success/20">
                                                    {game.distance}
                                                </Badge>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                                {visibleGameCount < filteredGames.length && (
                                    <div
                                        ref={loadMoreSentinelRef}
                                        className="py-4 text-center text-sm text-muted-foreground">
                                        {typeof IntersectionObserver === 'undefined' ? (
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setVisibleGameCount((current) =>
                                                        Math.min(current + GAMES_PER_BATCH, filteredGames.length),
                                                    )
                                                }>
                                                Load 10 more
                                            </Button>
                                        ) : (
                                            'Scroll to load more games'
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
