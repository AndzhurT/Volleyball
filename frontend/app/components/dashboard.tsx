import { Calendar, MapPin, Activity, Users } from 'lucide-react';
import { GameCard, type Game } from './game-card';
import { PlayerCard, type Player } from './player-card';
import { Button } from './ui/button';

interface DashboardProps {
    isLoggedIn: boolean;
    username?: string;
    onLogin: () => void;
    onFindGames: () => void;
    onFindPlayers: () => void;
    joinedGameIds?: string[];
    isGameLoading?: boolean;
    gamesPlayedThisMonth?: number;
    hoursPlayedThisMonth?: number;
    newFriendsThisMonth?: number;
    upcomingGames: Game[];
    nearbyGames: Game[];
    suggestedPlayers: Player[];
    onRSVP: (gameId: string) => void;
    onViewGameDetails: (gameId: string) => void;
    onConnect: (playerId: string) => void;
    onViewProfile: (playerId: string) => void;
}

export function Dashboard({
    isLoggedIn,
    username,
    onLogin,
    onFindGames,
    onFindPlayers,
    joinedGameIds = [],
    isGameLoading = false,
    gamesPlayedThisMonth = 0,
    hoursPlayedThisMonth = 0,
    newFriendsThisMonth = 0,
    upcomingGames,
    nearbyGames,
    suggestedPlayers,
    onRSVP,
    onViewGameDetails,
    onConnect,
    onViewProfile,
}: DashboardProps) {
    const stats = [
        {
            label: 'Games Played This Month',
            value: String(gamesPlayedThisMonth),
            icon: Calendar,
            color: 'text-primary-foreground',
        },
        {
            label: 'Hours Played This Month',
            value: Number(hoursPlayedThisMonth.toFixed(1)).toString(),
            icon: Activity,
            color: 'text-primary-foreground',
        },
        {
            label: 'New Friends',
            value: String(newFriendsThisMonth),
            icon: Users,
            color: 'text-primary-foreground',
        },
    ];

    return (
        <div className="space-y-8">
            {isLoggedIn ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 text-primary-foreground">
                    <div className="relative z-10">
                        <h1 className="text-3xl mb-2">Welcome back{username ? `, ${username}` : ''}!</h1>
                        <p className="text-primary-foreground/80 mb-6">
                            You have {upcomingGames.length} upcoming games and {nearbyGames.length} new games in your
                            area
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            {stats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={stat.label}
                                        className="bg-primary-foreground/10 backdrop-blur-sm border-2 border-primary-foreground/20 rounded-lg p-4 hover:bg-primary-foreground/15 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-primary-foreground/20 ${stat.color}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-2xl">{stat.value}</div>
                                                <div className="text-sm text-primary-foreground/70">{stat.label}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="secondary"
                                className="bg-card text-foreground hover:bg-card/90"
                                onClick={onFindGames}>
                                <MapPin className="w-4 h-4 mr-2" />
                                Find Games Nearby
                            </Button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-secondary/30 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-gradient-to-tr from-primary-foreground/10 to-transparent rounded-full blur-2xl" />
                </div>
            ) : (
                <section className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl mb-2">Find your next game</h1>
                        <p className="text-muted-foreground">
                            Sign up to create a volleyball game or join one nearby. Set your skill level, find a court,
                            and meet players in your area.
                        </p>
                    </div>
                    <Button onClick={onLogin} className="shrink-0">
                        <Users className="w-4 h-4 mr-2" />
                        Sign Up or Log In
                    </Button>
                </section>
            )}

            {/* Nearby Games */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl mb-1">Discover Nearby Games</h2>
                        <p className="text-muted-foreground">New games happening in your area</p>
                    </div>
                    <Button variant="outline" className="border-border hover:border-primary/50" onClick={onFindGames}>
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
                            isJoined={joinedGameIds.includes(game.id)}
                            showLocation={isLoggedIn}
                        />
                    ))}
                </div>
                {!nearbyGames.length && (
                    <p className="mt-4 text-sm text-muted-foreground">
                        {isGameLoading ? 'Loading games...' : 'No games are currently listed.'}
                    </p>
                )}
            </section>

            {/* Suggested Players */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl mb-1">Players You May Know</h2>
                        <p className="text-muted-foreground">Connect with players in your area</p>
                    </div>
                    <Button variant="outline" className="border-border hover:border-primary/50" onClick={onFindPlayers}>
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
        </div>
    );
}
