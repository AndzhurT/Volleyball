import { useEffect, useState } from 'react';
import { Home, MapPin, User, Plus, Users, Bell, LogIn, LogOut } from 'lucide-react';

import { Button } from './components/ui/button';
import { Dashboard } from './components/dashboard';
import { MapView } from './components/map-view';
import { ProfileView } from './components/profile-view';
import { CreateGameDialog } from './components/create-game-dialog';
import { EditProfileDialog } from './components/edit-profile-dialog';
import { AuthDialog } from './components/auth-dialog';
import { PlayersViewOption1 } from './components/players-view-option1';
import { useAuth } from './context/AuthContext';
import {
    createGameActionRequest,
    deleteMyGameActionRequest,
    getProfile,
    getProfiles,
    getMyGameActionRequests,
    getStoredAuthToken,
    updateMyGameActionRequest,
    updateMyProfile,
    type GameActionRequest,
    type GameActionRequestInput,
    type UserProfile,
    type UserProfileInput,
} from './lib/auth-api';

import type { Game } from './components/game-card';
import type { Player } from './components/player-card';

type View = 'dashboard' | 'map' | 'profile' | 'browse';

type GameWithCoords = Game & {
    latitude: number;
    longitude: number;
};

function toDirectoryPlayer(profile: UserProfile): Player {
    return {
        id: profile.id,
        name: profile.displayName || profile.username,
        avatar: profile.avatar || undefined,
        location: profile.location || 'Location not set',
        skillLevel: profile.skillLevel,
        positions: profile.positions,
        gamesPlayed: profile.gamesPlayed,
        rating: profile.rating,
        bio: profile.bio,
    };
}

function toProfilePlayer(profile: UserProfile) {
    return {
        ...toDirectoryPlayer(profile),
        gamesAttended: [],
        followers: [],
        following: [],
        achievements: [],
        reviews: [],
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
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [requestToEdit, setRequestToEdit] = useState<GameActionRequest | null>(null);
    const [gameActionRequests, setGameActionRequests] = useState<GameActionRequest[]>([]);
    const [areRequestsLoading, setAreRequestsLoading] = useState(false);
    const { user: authUser, isLoading: isAuthLoading, setAuthenticatedUser, logout } = useAuth();
    const isLoggedIn = authUser !== null;

    useEffect(() => {
        let cancelled = false;
        getProfiles()
            .then((response) => {
                if (!cancelled) setProfiles(response.data.map(toDirectoryPlayer));
            })
            .catch((error) => console.error('Unable to load player profiles:', error));
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const profileId = viewedProfileId || authUser?.id;
        if (currentView !== 'profile' || !profileId) return;

        let cancelled = false;
        setIsProfileLoading(true);
        setProfileError('');
        getProfile(profileId)
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
    }, [authUser?.id]);

    const handleFindGames = () => {
        if (!isLoggedIn) {
            setIsAuthDialogOpen(true);
            return;
        }
        setCurrentView('map');
    };

    // Mock Data
    const mockGames: GameWithCoords[] = [
        {
            id: '1',
            title: 'Saturday Morning Volleyball',
            date: 'Jan 11, 2026',
            time: '9:00 AM',
            location: 'Downtown Sports Center',
            latitude: 39.9526,
            longitude: -75.1652,
            distance: '1.2 mi',
            skillLevel: 'Intermediate',
            spotsLeft: 3,
            totalSpots: 12,
            type: 'casual',
            courtType: 'indoor',
            playersJoined: [
                {
                    id: 'p1',
                    name: 'Sarah J',
                    avatar: 'https://images.unsplash.com/photo-1695918428487-7934244c19ac?w=100&h=100&fit=crop',
                },
                { id: 'p2', name: 'Mike C', avatar: '' },
                { id: 'p3', name: 'Emma D', avatar: '' },
            ],
        },
        {
            id: '2',
            title: 'Competitive Beach Tournament',
            date: 'Jan 12, 2026',
            time: '2:00 PM',
            location: 'Sunset Beach Courts',
            latitude: 39.9259,
            longitude: -75.1196,
            distance: '3.8 mi',
            skillLevel: 'Advanced',
            spotsLeft: 1,
            totalSpots: 8,
            type: 'competitive',
            courtType: 'beach',
            playersJoined: [
                { id: 'p4', name: 'John D', avatar: '' },
                { id: 'p5', name: 'Lisa M', avatar: '' },
            ],
        },
        {
            id: '3',
            title: 'Beginner Friendly Game',
            date: 'Jan 13, 2026',
            time: '6:30 PM',
            location: 'Community Recreation Center',
            latitude: 40.0379,
            longitude: -75.2223,
            distance: '0.8 mi',
            skillLevel: 'Beginner',
            spotsLeft: 6,
            totalSpots: 12,
            type: 'casual',
            courtType: 'indoor',
            playersJoined: [{ id: 'p6', name: 'Alex K', avatar: '' }],
        },
        {
            id: '4',
            title: 'Sunday Afternoon Social',
            date: 'Jan 14, 2026',
            time: '3:00 PM',
            location: 'Riverside Park',
            latitude: 39.9784,
            longitude: -75.1579,
            distance: '2.1 mi',
            skillLevel: 'All Levels',
            spotsLeft: 8,
            totalSpots: 16,
            type: 'casual',
            courtType: 'outdoor',
            playersJoined: [
                { id: 'p7', name: 'Chris P', avatar: '' },
                { id: 'p8', name: 'Taylor R', avatar: '' },
            ],
        },
        {
            id: '5',
            title: 'Competitive Indoor League',
            date: 'Jan 15, 2026',
            time: '7:00 PM',
            location: 'Elite Volleyball Arena',
            latitude: 39.961,
            longitude: -75.199,
            distance: '4.5 mi',
            skillLevel: 'Advanced',
            spotsLeft: 0,
            totalSpots: 10,
            type: 'competitive',
            courtType: 'indoor',
            playersJoined: [
                { id: 'p9', name: 'Jordan B', avatar: '' },
                { id: 'p10', name: 'Morgan S', avatar: '' },
            ],
        },
        {
            id: '6',
            title: 'Wednesday Night Pick-up',
            date: 'Jan 17, 2026',
            time: '8:00 PM',
            location: 'City Sports Complex',
            latitude: 39.947,
            longitude: -75.143,
            distance: '1.5 mi',
            skillLevel: 'Intermediate',
            spotsLeft: 4,
            totalSpots: 12,
            type: 'casual',
            courtType: 'indoor',
            playersJoined: [{ id: 'p11', name: 'Sam W', avatar: '' }],
        },
    ];

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
        console.log('RSVP to game:', gameId);
        // In a real app, this would send to backend
    };

    const handleViewGameDetails = (gameId: string) => {
        console.log('View game details:', gameId);
        // Could open a modal or navigate to details page
    };

    const handleConnect = (playerId: string) => {
        console.log('Connect with player:', playerId);
        // In a real app, this would send to backend
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
                                onClick={() => setCurrentView('browse')}
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
                        upcomingGames={mockGames.slice(0, 3)}
                        nearbyGames={mockGames}
                        suggestedPlayers={profiles.slice(0, 4)}
                        onRSVP={handleRSVP}
                        onViewGameDetails={handleViewGameDetails}
                        onConnect={handleConnect}
                        onViewProfile={handleViewProfile}
                    />
                )}

                {currentView === 'map' &&
                    (isLoggedIn ? (
                        <MapView games={mockGames} onRSVP={handleRSVP} onViewGameDetails={handleViewGameDetails} />
                    ) : (
                        <Dashboard
                            isLoggedIn={false}
                            onLogin={() => setIsAuthDialogOpen(true)}
                            onFindGames={handleFindGames}
                            upcomingGames={[]}
                            nearbyGames={[]}
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
                            upcomingGames={[]}
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
                        onClick={() => setCurrentView('browse')}
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
