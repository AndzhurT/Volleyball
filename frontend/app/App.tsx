import { useEffect, useState } from 'react';
import { Home, MapPin, User, Plus, Users, Bell, LogIn, LogOut } from 'lucide-react';

import { Button } from './components/ui/button';
import { Dashboard } from './components/dashboard';
import { MapView } from './components/map-view';
import { ProfileView } from './components/profile-view';
import { CreateGameDialog } from './components/create-game-dialog';
import { EditProfileDialog } from './components/edit-profile-dialog';
import { GameDetailsDialog } from './components/game-details-dialog';
import { AuthDialog } from './components/auth-dialog';
import { PlayersViewOption1 } from './components/players-view-option1';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './components/ui/alert-dialog';
import { useAuth } from './context/AuthContext';
import {
    createGameActionRequest,
    deleteMyGameActionRequest,
    getGame,
    getGames,
    getProfile,
    getProfiles,
    getMyGames,
    getMyGameActionRequests,
    getStoredAuthToken,
    followProfile,
    joinGame,
    updateMyGameActionRequest,
    updateMyProfile,
    unfollowProfile,
    type GameActionRequest,
    type GameActionRequestInput,
    type UserProfile,
    type UserProfileInput,
    type GameRecord,
} from './lib/auth-api';

import type { Game } from './components/game-card';
import type { Player } from './components/player-card';

type View = 'dashboard' | 'map' | 'profile' | 'browse';

type GameWithCoords = Game & {
    latitude?: number;
    longitude?: number;
};

type DirectoryProfile = Pick<
    UserProfile,
    'id' | 'username' | 'displayName' | 'avatar' | 'location' | 'skillLevel' | 'positions' | 'gamesPlayed' | 'bio'
> & { isFollowing?: boolean };

type MyGameWithCoords = GameWithCoords & {
    durationMinutes: number;
    startsAt: string;
    endsAt: string;
};

function toUiGame(record: GameRecord): MyGameWithCoords {
    const coordinates = record.coordinates?.coordinates;
    return {
        ...record,
        location: record.location || '',
        latitude: coordinates?.[1],
        longitude: coordinates?.[0],
        durationMinutes: record.durationMinutes || 90,
        startsAt: record.startsAt,
        endsAt: record.endsAt,
    };
}

function compareGameStart(left: Game, right: Game) {
    return `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`);
}

function toDirectoryPlayer(profile: DirectoryProfile): Player {
    return {
        id: profile.id,
        name: profile.displayName || profile.username,
        avatar: profile.avatar || undefined,
        location: profile.location || 'Location not set',
        skillLevel: profile.skillLevel,
        positions: profile.positions,
        gamesPlayed: profile.gamesPlayed,
        bio: profile.bio,
        isFollowing: profile.isFollowing,
    };
}

function toProfilePlayer(profile: UserProfile) {
    return {
        ...toDirectoryPlayer(profile),
        gamesAttended: [],
        followers: profile.followers.map(toDirectoryPlayer),
        following: profile.following.map(toDirectoryPlayer),
        stats: profile.stats,
    };
}

function App() {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [viewedProfileId, setViewedProfileId] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [profiles, setProfiles] = useState<Player[]>([]);
    const [games, setGames] = useState<GameWithCoords[]>([]);
    const [myGames, setMyGames] = useState<MyGameWithCoords[]>([]);
    const [isGameLoading, setIsGameLoading] = useState(false);
    const [rsvpGame, setRsvpGame] = useState<GameWithCoords | null>(null);
    const [isRsvpConfirmOpen, setIsRsvpConfirmOpen] = useState(false);
    const [isJoiningGame, setIsJoiningGame] = useState(false);
    const [rsvpError, setRsvpError] = useState('');
    const [detailsGame, setDetailsGame] = useState<GameWithCoords | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [requestToEdit, setRequestToEdit] = useState<GameActionRequest | null>(null);
    const [gameActionRequests, setGameActionRequests] = useState<GameActionRequest[]>([]);
    const [areRequestsLoading, setAreRequestsLoading] = useState(false);
    const { user: authUser, isLoading: isAuthLoading, setAuthenticatedUser, logout } = useAuth();
    const isLoggedIn = authUser !== null;

    useEffect(() => {
        if (isAuthLoading) return;
        let cancelled = false;
        const token = getStoredAuthToken() || undefined;
        getProfiles(token)
            .then((response) => {
                if (!cancelled) setProfiles(response.data.map(toDirectoryPlayer));
            })
            .catch((error) => console.error('Unable to load player profiles:', error));
        return () => {
            cancelled = true;
        };
    }, [authUser?.id, isAuthLoading]);

    useEffect(() => {
        if (isAuthLoading) return;
        let cancelled = false;
        const token = getStoredAuthToken() || undefined;
        setIsGameLoading(true);
        Promise.all([getGames(token), token ? getMyGames(token) : Promise.resolve({ data: [] as GameRecord[] })])
            .then(([gameResponse, myGameResponse]) => {
                if (cancelled) return;
                setGames(gameResponse.data.map(toUiGame));
                setMyGames(myGameResponse.data.map(toUiGame));
            })
            .catch((error) => {
                if (!cancelled) console.error('Unable to load games:', error);
            })
            .finally(() => {
                if (!cancelled) setIsGameLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [authUser?.id, isAuthLoading]);

    useEffect(() => {
        const profileId = viewedProfileId || authUser?.id;
        if (currentView !== 'profile' || !profileId) return;

        let cancelled = false;
        setIsProfileLoading(true);
        setProfileError('');
        getProfile(profileId, getStoredAuthToken() || undefined)
            .then((response) => {
                if (!cancelled) setProfileData(response.profile);
            })
            .catch((error) => {
                if (!cancelled) {
                    setProfileError(error instanceof Error ? error.message : 'Unable to load this profile.');
                }
            })
            .finally(() => {
                if (!cancelled) setIsProfileLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [currentView, viewedProfileId, authUser?.id]);

    const refreshGameActionRequests = async () => {
        const token = getStoredAuthToken();
        if (!token) {
            setGameActionRequests([]);
            return;
        }

        setAreRequestsLoading(true);
        try {
            const response = await getMyGameActionRequests(token);
            setGameActionRequests(response.data);
        } finally {
            setAreRequestsLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const token = getStoredAuthToken();
        if (!authUser || !token) {
            setGameActionRequests([]);
            setAreRequestsLoading(false);
            return;
        }

        setAreRequestsLoading(true);
        getMyGameActionRequests(token)
            .then((response) => {
                if (!cancelled) setGameActionRequests(response.data);
            })
            .catch((error) => console.error('Unable to load game requests:', error))
            .finally(() => {
                if (!cancelled) setAreRequestsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [authUser, isAuthLoading]);

    const handleFindGames = () => {
        if (!isLoggedIn) {
            setIsAuthDialogOpen(true);
            return;
        }
        setCurrentView('map');
    };

    const handleFindPlayers = () => {
        setCurrentView('browse');
    };

    const handleCreateGame = async (gameData: GameActionRequestInput, requestId?: string) => {
        const token = getStoredAuthToken();
        if (!token) throw new Error('Please sign in again before submitting a game request.');

        if (requestId) {
            await updateMyGameActionRequest(token, requestId, gameData);
        } else {
            await createGameActionRequest(token, gameData);
        }
        try {
            await refreshGameActionRequests();
        } catch (error) {
            console.error('Request submitted but history could not be refreshed:', error);
        }
    };

    const handleDeleteGameRequest = async (requestId: string) => {
        const token = getStoredAuthToken();
        if (!token) throw new Error('Please sign in again before deleting this request.');
        await deleteMyGameActionRequest(token, requestId);
        setGameActionRequests((requests) => requests.filter((request) => request._id !== requestId));
        try {
            await refreshGameActionRequests();
        } catch (error) {
            console.error('Request deleted but request history could not be refreshed:', error);
        }
    };

    const handleRSVP = (gameId: string) => {
        if (!isLoggedIn) {
            setIsAuthDialogOpen(true);
            return;
        }
        const game = games.find((item) => item.id === gameId);
        if (!game || myGames.some((item) => item.id === gameId) || game.lifecycleStatus === 'ended') return;
        setRsvpError('');
        setRsvpGame(game);
        setIsRsvpConfirmOpen(true);
    };

    const confirmJoinGame = async () => {
        const token = getStoredAuthToken();
        if (!token || !rsvpGame) return;
        setIsJoiningGame(true);
        setRsvpError('');
        try {
            const joinedGame = toUiGame(await joinGame(token, rsvpGame.id));
            setGames((current) => current.map((game) => (game.id === joinedGame.id ? joinedGame : game)));
            setMyGames((current) => [joinedGame, ...current.filter((game) => game.id !== joinedGame.id)]);
            setIsRsvpConfirmOpen(false);
            setRsvpGame(null);
        } catch (error) {
            setRsvpError(error instanceof Error ? error.message : 'Unable to join this game.');
        } finally {
            setIsJoiningGame(false);
        }
    };

    const handleViewGameDetails = async (gameId: string) => {
        if (!isLoggedIn) {
            setIsAuthDialogOpen(true);
            return;
        }
        const token = getStoredAuthToken();
        if (!token) {
            setIsAuthDialogOpen(true);
            return;
        }
        setDetailsError('');
        setIsDetailsLoading(true);
        setDetailsGame(games.find((game) => game.id === gameId) || null);
        try {
            const record = await getGame(token, gameId);
            setDetailsGame(toUiGame(record));
        } catch (error) {
            setDetailsError(error instanceof Error ? error.message : 'Unable to load game details.');
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const handleConnect = async (playerId: string) => {
        if (!authUser) {
            setIsAuthDialogOpen(true);
            return;
        }
        const token = getStoredAuthToken();
        if (!token) {
            setIsAuthDialogOpen(true);
            return;
        }
        const knownPlayer =
            profiles.find((profile) => profile.id === playerId) ||
            profileData?.followers.find((profile) => profile.id === playerId) ||
            profileData?.following.find((profile) => profile.id === playerId);

        try {
            if (knownPlayer?.isFollowing) {
                await unfollowProfile(token, playerId);
            } else {
                await followProfile(token, playerId);
            }

            const [profileList, viewedProfile] = await Promise.all([
                getProfiles(token),
                profileData ? getProfile(profileData.id, token) : Promise.resolve(null),
            ]);
            setProfiles(profileList.data.map(toDirectoryPlayer));
            if (viewedProfile) setProfileData(viewedProfile.profile);
        } catch (error) {
            console.error('Unable to update follow status:', error);
        }
    };

    const handleViewProfile = (playerId: string) => {
        console.log('View profile:', playerId);
        setViewedProfileId(playerId);
        setCurrentView('profile');
    };

    const handleOpenOwnProfile = () => {
        if (!authUser) {
            setIsAuthDialogOpen(true);
            return;
        }
        setViewedProfileId(authUser.id);
        setCurrentView('profile');
    };

    const handleSaveProfile = async (profile: UserProfileInput) => {
        const token = getStoredAuthToken();
        if (!token) throw new Error('Please sign in again before editing your profile.');
        const response = await updateMyProfile(token, profile);
        setProfileData(response.profile);
        setProfiles((currentProfiles) =>
            currentProfiles.map((player) =>
                player.id === response.profile.id ? toDirectoryPlayer(response.profile) : player,
            ),
        );
    };

    const handleLogout = async () => {
        await logout();
        setViewedProfileId(null);
        setProfileData(null);
        setCurrentView('dashboard');
    };

    const gamesSortedByStart = [...games].sort(compareGameStart);
    const myGamesSortedByStart = [...myGames].sort(compareGameStart);
    const now = Date.now();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoTime = oneMonthAgo.getTime();
    const recentlyEndedGames = myGames.filter((game) => {
        const endedAt = new Date(game.endsAt).getTime();
        return endedAt >= oneMonthAgoTime && endedAt <= now;
    });
    const gamesPlayedThisMonth = recentlyEndedGames.length;
    const hoursPlayedThisMonth = recentlyEndedGames.reduce((total, game) => total + game.durationMinutes / 60, 0);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-xl">🏐</span>
                            </div>
                            <h1 className="text-xl font-medium">VolleyConnect</h1>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-2">
                            <Button
                                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                                onClick={() => setCurrentView('dashboard')}
                                className={currentView === 'dashboard' ? 'bg-primary text-primary-foreground' : ''}>
                                <Home className="w-4 h-4 mr-2" />
                                Home
                            </Button>
                            <Button
                                variant={currentView === 'map' ? 'default' : 'ghost'}
                                onClick={handleFindGames}
                                className={currentView === 'map' ? 'bg-primary text-primary-foreground' : ''}>
                                <MapPin className="w-4 h-4 mr-2" />
                                Find Games
                            </Button>
                            <Button
                                variant={currentView === 'browse' ? 'default' : 'ghost'}
                                onClick={handleFindPlayers}
                                className={currentView === 'browse' ? 'bg-primary text-primary-foreground' : ''}>
                                <Users className="w-4 h-4 mr-2" />
                                Players
                            </Button>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {isAuthLoading ? null : isLoggedIn ? (
                                <>
                                    <Button
                                        onClick={() => setIsCreateDialogOpen(true)}
                                        className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                                        <Plus className="w-4 h-4 mr-2" />
                                        <span className="hidden sm:inline">Create Game</span>
                                    </Button>

                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="w-5 h-5" />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                    </Button>

                                    <Button
                                        variant={currentView === 'profile' ? 'default' : 'ghost'}
                                        size="icon"
                                        onClick={handleOpenOwnProfile}>
                                        <User className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => void handleLogout()}
                                        aria-label="Log out">
                                        <LogOut className="w-5 h-5" />
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsAuthDialogOpen(true)}>
                                    <LogIn className="w-4 h-4 mr-2" />
                                    Login / Sign Up
                                </Button>
                            )}

                            <AuthDialog
                                open={isAuthDialogOpen}
                                onOpenChange={setIsAuthDialogOpen}
                                onAuthSuccess={setAuthenticatedUser}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {currentView === 'dashboard' && (
                    <Dashboard
                        isLoggedIn={isLoggedIn}
                        username={authUser?.username}
                        onLogin={() => setIsAuthDialogOpen(true)}
                        onFindGames={handleFindGames}
                        onFindPlayers={handleFindPlayers}
                        upcomingGames={myGamesSortedByStart.filter((game) => game.lifecycleStatus === 'upcoming')}
                        nearbyGames={gamesSortedByStart}
                        joinedGameIds={myGames.map((game) => game.id)}
                        isGameLoading={isGameLoading}
                        gamesPlayedThisMonth={gamesPlayedThisMonth}
                        hoursPlayedThisMonth={hoursPlayedThisMonth}
                        suggestedPlayers={profiles.slice(0, 4)}
                        onRSVP={handleRSVP}
                        onViewGameDetails={handleViewGameDetails}
                        onConnect={handleConnect}
                        onViewProfile={handleViewProfile}
                    />
                )}

                {currentView === 'map' &&
                    (isLoggedIn ? (
                        <MapView
                            games={gamesSortedByStart.filter(
                                (game): game is GameWithCoords & { latitude: number; longitude: number } =>
                                    typeof game.latitude === 'number' && typeof game.longitude === 'number',
                            )}
                            joinedGameIds={myGames.map((game) => game.id)}
                            onRSVP={handleRSVP}
                            onViewGameDetails={handleViewGameDetails}
                        />
                    ) : (
                        <Dashboard
                            isLoggedIn={false}
                            onLogin={() => setIsAuthDialogOpen(true)}
                            onFindGames={handleFindGames}
                            onFindPlayers={handleFindPlayers}
                            upcomingGames={[]}
                            nearbyGames={gamesSortedByStart}
                            joinedGameIds={[]}
                            isGameLoading={isGameLoading}
                            gamesPlayedThisMonth={0}
                            hoursPlayedThisMonth={0}
                            suggestedPlayers={[]}
                            onRSVP={handleRSVP}
                            onViewGameDetails={handleViewGameDetails}
                            onConnect={handleConnect}
                            onViewProfile={handleViewProfile}
                        />
                    ))}

                {currentView === 'profile' &&
                    (isProfileLoading ? (
                        <p className="text-muted-foreground">Loading profile...</p>
                    ) : profileError ? (
                        <p role="alert" className="text-destructive">
                            {profileError}
                        </p>
                    ) : profileData ? (
                        <ProfileView
                            isOwnProfile={!!authUser && profileData.id === authUser.id}
                            player={toProfilePlayer(profileData)}
                            upcomingGames={
                                profileData.id === authUser?.id
                                    ? myGamesSortedByStart.filter((game) => game.lifecycleStatus === 'upcoming')
                                    : []
                            }
                            ongoingGames={
                                profileData.id === authUser?.id
                                    ? myGamesSortedByStart.filter((game) => game.lifecycleStatus === 'ongoing')
                                    : []
                            }
                            pastGames={
                                profileData.id === authUser?.id
                                    ? myGamesSortedByStart.filter((game) => game.lifecycleStatus === 'ended')
                                    : []
                            }
                            gameActionRequests={profileData.id === authUser?.id ? gameActionRequests : []}
                            areRequestsLoading={profileData.id === authUser?.id && areRequestsLoading}
                            showGameLocations={isLoggedIn}
                            onEditGameRequest={(request) => {
                                setRequestToEdit(request);
                                setIsCreateDialogOpen(true);
                            }}
                            onDeleteGameRequest={handleDeleteGameRequest}
                            onEditProfile={() => setIsEditProfileOpen(true)}
                            onConnect={handleConnect}
                            onViewProfile={handleViewProfile}
                            onRSVP={handleRSVP}
                            onViewGameDetails={handleViewGameDetails}
                        />
                    ) : (
                        <p className="text-muted-foreground">Profile not found.</p>
                    ))}

                {currentView === 'browse' && (
                    <PlayersViewOption1
                        players={profiles}
                        onConnect={handleConnect}
                        onViewProfile={handleViewProfile}
                    />
                )}
            </main>

            {/* Create Game Dialog */}
            <CreateGameDialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) setRequestToEdit(null);
                }}
                requestToEdit={requestToEdit}
                onCreateGame={handleCreateGame}
            />

            {profileData && profileData.id === authUser?.id && (
                <EditProfileDialog
                    open={isEditProfileOpen}
                    onOpenChange={setIsEditProfileOpen}
                    profile={profileData}
                    onSave={handleSaveProfile}
                />
            )}

            <GameDetailsDialog
                game={detailsGame}
                open={detailsGame !== null || isDetailsLoading || !!detailsError}
                isLoading={isDetailsLoading}
                error={detailsError}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailsGame(null);
                        setDetailsError('');
                    }
                }}
            />

            <AlertDialog open={isRsvpConfirmOpen} onOpenChange={setIsRsvpConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Join this game?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {rsvpGame
                                ? `Join ${rsvpGame.title} on ${rsvpGame.date} at ${rsvpGame.time}?`
                                : 'Confirm that you want to join this game.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {rsvpError && (
                        <p role="alert" className="text-sm text-destructive">
                            {rsvpError}
                        </p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isJoiningGame}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // keep dialog open until join finishes
                                void confirmJoinGame();
                            }}
                            disabled={isJoiningGame}>
                            {isJoiningGame ? 'Joining...' : 'Join Game'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t-2 border-border/30 bg-card/95 backdrop-blur-sm">
                <div className="grid grid-cols-4 gap-1 p-2">
                    <Button
                        variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                        onClick={() => setCurrentView('dashboard')}
                        className={`flex-col h-auto py-2 ${currentView === 'dashboard' ? 'bg-primary text-primary-foreground' : ''}`}>
                        <Home className="w-5 h-5 mb-1" />
                        <span className="text-xs">Home</span>
                    </Button>
                    <Button
                        variant={currentView === 'map' ? 'default' : 'ghost'}
                        onClick={handleFindGames}
                        className={`flex-col h-auto py-2 ${currentView === 'map' ? 'bg-primary text-primary-foreground' : ''}`}>
                        <MapPin className="w-5 h-5 mb-1" />
                        <span className="text-xs">Map</span>
                    </Button>
                    <Button
                        variant={currentView === 'browse' ? 'default' : 'ghost'}
                        onClick={handleFindPlayers}
                        className={`flex-col h-auto py-2 ${currentView === 'browse' ? 'bg-primary text-primary-foreground' : ''}`}>
                        <Users className="w-5 h-5 mb-1" />
                        <span className="text-xs">Players</span>
                    </Button>
                    <Button
                        variant={currentView === 'profile' ? 'default' : 'ghost'}
                        onClick={handleOpenOwnProfile}
                        className={`flex-col h-auto py-2 ${currentView === 'profile' ? 'bg-primary text-primary-foreground' : ''}`}>
                        <User className="w-5 h-5 mb-1" />
                        <span className="text-xs">Profile</span>
                    </Button>
                </div>
            </nav>

            {/* Add padding for mobile nav */}
            <div className="h-20 md:hidden" />
        </div>
    );
}

export default App;
