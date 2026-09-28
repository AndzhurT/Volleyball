import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Calendar, Clock, MapPin, Trophy, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface GameDetails {
    id: string;
    title: string;
    date: string;
    time: string;
    location?: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
    spotsLeft: number;
    totalSpots: number;
    durationMinutes?: number;
    lifecycleStatus?: 'upcoming' | 'ongoing' | 'ended';
    coordinates?: { type: 'Point'; coordinates: [number, number] };
    type: 'casual' | 'competitive';
    courtType: 'indoor' | 'outdoor' | 'beach';
    playersJoined: Array<{ id: string; name: string; avatar: string }>;
}

const gameMarker = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface GameDetailsDialogProps {
    game: GameDetails | null;
    open: boolean;
    isLoading?: boolean;
    error?: string;
    onOpenChange: (open: boolean) => void;
}

export function GameDetailsDialog({ game, open, isLoading = false, error = '', onOpenChange }: GameDetailsDialogProps) {
    const [marker, setMarker] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (!open || !game) return;
        const savedCoordinates = game.coordinates?.coordinates;
        if (savedCoordinates?.length === 2) {
            setMarker([savedCoordinates[1], savedCoordinates[0]]);
            return;
        }

        const address = game.location?.trim();
        if (!address) {
            setMarker(null);
            return;
        }

        const controller = new AbortController();
        setMarker(null);
        setIsLocating(true);
        fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`, {
            signal: controller.signal,
            headers: { 'Accept-Language': 'en' },
        })
            .then((response) => (response.ok ? response.json() : []))
            .then((results: Array<{ lat: string; lon: string }>) => {
                if (!controller.signal.aborted && results[0]) {
                    setMarker([Number(results[0].lat), Number(results[0].lon)]);
                }
            })
            .catch(() => {})
            .finally(() => {
                if (!controller.signal.aborted) setIsLocating(false);
            });

        return () => controller.abort();
    }, [game, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                {!game ? (
                    <div
                        role={error ? 'alert' : 'status'}
                        className={error ? 'text-destructive' : 'text-muted-foreground'}>
                        {error || (isLoading ? 'Loading game details...' : 'Game details unavailable.')}
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="flex flex-wrap items-center gap-2 pr-8">
                                <DialogTitle>{game.title}</DialogTitle>
                                {game.lifecycleStatus && (
                                    <Badge
                                        variant="outline"
                                        className={
                                            game.lifecycleStatus === 'ongoing'
                                                ? 'border-success/30 bg-success/10 text-success'
                                                : game.lifecycleStatus === 'ended'
                                                  ? 'border-muted-foreground/30 bg-muted text-muted-foreground'
                                                  : 'border-info/30 bg-info/10 text-info'
                                        }>
                                        {game.lifecycleStatus}
                                    </Badge>
                                )}
                            </div>
                            <DialogDescription>Game information and participants.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-3 text-sm">
                                <p className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {game.date}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {game.time} · about {game.durationMinutes || 90} min
                                </p>
                                <p className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {game.location || 'Address available to players'}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    {game.spotsLeft} spots left of {game.totalSpots}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-muted-foreground" />
                                    {game.type} · {game.courtType} · {game.skillLevel}
                                </p>
                            </div>
                            <section>
                                <h3 className="mb-2 font-medium">Players ({game.playersJoined.length})</h3>
                                {game.playersJoined.length ? (
                                    <ul className="space-y-2">
                                        {game.playersJoined.map((player) => (
                                            <li key={player.id} className="flex items-center gap-2 text-sm">
                                                {player.avatar ? (
                                                    <img
                                                        src={player.avatar}
                                                        alt=""
                                                        className="h-8 w-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">
                                                        {player.name.slice(0, 1).toUpperCase()}
                                                    </span>
                                                )}
                                                {player.name}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No players have joined yet.</p>
                                )}
                            </section>
                        </div>

                        <section>
                            <h3 className="mb-2 font-medium">Game location</h3>
                            {marker ? (
                                <div className="h-56 overflow-hidden rounded-md border border-border">
                                    <MapContainer
                                        center={marker}
                                        zoom={14}
                                        scrollWheelZoom={false}
                                        className="h-full w-full">
                                        <TileLayer
                                            attribution="&copy; OpenStreetMap contributors"
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Marker position={marker} icon={gameMarker} />
                                    </MapContainer>
                                </div>
                            ) : (
                                <div className="flex h-32 items-center justify-center rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                                    {isLocating
                                        ? 'Locating address...'
                                        : 'Map location is unavailable for this address.'}
                                </div>
                            )}
                        </section>
                        {error && (
                            <p role="alert" className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
