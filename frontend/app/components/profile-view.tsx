import { MapPin, Calendar, Settings, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GameCard, type Game } from './game-card';
import { PlayerCard, type Player } from './player-card';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { GameActionRequest, SupportTicket } from '../lib/auth-api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import {
    createSupportTicket,
    getNotificationPreferences,
    getStoredAuthToken,
    updateNotificationPreferences,
    NOTIFICATION_TYPES,
    type NotificationPreferences,
    type NotificationType,
} from '../lib/auth-api';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';

interface ProfileViewProps {
    isOwnProfile?: boolean;
    player: Player & {
        gamesAttended: Game[];
        followers: Player[];
        following: Player[];

        stats: {
            winRate: number;
            hoursPlayed: number;
            favoritePosition: string;
            memberSince: string;
        };
    };
    upcomingGames?: Game[];
    ongoingGames?: Game[];
    pastGames?: Game[];
    gameActionRequests?: GameActionRequest[];
    areRequestsLoading?: boolean;
    showGameLocations?: boolean;
    onEditGameRequest?: (request: GameActionRequest) => void;
    onDeleteGameRequest?: (requestId: string) => Promise<void>;
    onEditProfile?: () => void;
    onConnect?: (playerId: string) => void;
    onViewProfile: (playerId: string) => void;
    onRSVP?: (gameId: string) => void;
    onViewGameDetails?: (gameId: string) => void;
    onSignOut?: () => void;
}

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    follow: 'New followers',
    'followed-user-joined-game': 'People you follow joining games',
    'game-player-joined': 'Player joined your game',
    'game-deleted': 'Game cancelled',
    'game-ended': 'Game ended',
    'game-request-approved': 'Game request approved',
    'game-request-declined': 'Game request declined',
};

export function ProfileView({
    isOwnProfile = false,
    player,
    upcomingGames = [],
    ongoingGames = [],
    pastGames = [],
    gameActionRequests = [],
    areRequestsLoading = false,
    showGameLocations = true,
    onEditGameRequest,
    onDeleteGameRequest,
    onEditProfile,
    onConnect,
    onViewProfile,
    onRSVP,
    onViewGameDetails,
    onSignOut,
}: ProfileViewProps) {
    const [requestToDelete, setRequestToDelete] = useState<GameActionRequest | null>(null);
    const [requestActionError, setRequestActionError] = useState('');
    const [openGameList, setOpenGameList] = useState<'upcoming' | 'past' | null>(null);
    const [visibleGameCount, setVisibleGameCount] = useState(10);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsView, setSettingsView] = useState<'menu' | 'notifications' | 'support'>('menu');
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
    const [preferencesError, setPreferencesError] = useState('');
    const [preferencesMessage, setPreferencesMessage] = useState('');
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);
    const [supportSubject, setSupportSubject] = useState('');
    const [supportDescription, setSupportDescription] = useState('');
    const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
    const [supportTicketError, setSupportTicketError] = useState('');
    const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
    const gameListScrollRef = useRef<HTMLDivElement>(null);
    const gameListSentinelRef = useRef<HTMLDivElement>(null);
    const openSettings = (view: 'menu' | 'notifications' | 'support' = 'menu') => {
        setSettingsView(view);
        setPreferencesError('');
        setPreferencesMessage('');
        setSupportTicketError('');
        setSubmittedTicket(null);
        setIsSettingsOpen(true);
        if (view === 'notifications') loadNotificationPreferences();
    };

    const handleSubmitSupportTicket = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const token = getStoredAuthToken();
        if (!token) {
            setSupportTicketError('Please sign in again to contact support.');
            return;
        }
        setIsSubmittingTicket(true);
        setSupportTicketError('');
        try {
            const ticket = await createSupportTicket(token, {
                subject: supportSubject,
                description: supportDescription,
            });
            setSubmittedTicket(ticket);
            setSupportSubject('');
            setSupportDescription('');
        } catch (error: unknown) {
            setSupportTicketError(error instanceof Error ? error.message : 'Unable to submit your ticket.');
        } finally {
            setIsSubmittingTicket(false);
        }
    };

    const loadNotificationPreferences = () => {
        const token = getStoredAuthToken();
        if (!token) {
            setPreferencesError('Please sign in again to manage notification settings.');
            return;
        }
        setPreferencesError('');
        getNotificationPreferences(token)
            .then((response) => setNotificationPreferences(response.preferences))
            .catch((error: unknown) =>
                setPreferencesError(error instanceof Error ? error.message : 'Unable to load settings.'),
            );
    };

    const handleSaveNotificationPreferences = async () => {
        const token = getStoredAuthToken();
        if (!token || !notificationPreferences) return;
        setIsSavingPreferences(true);
        setPreferencesError('');
        setPreferencesMessage('');
        try {
            const response = await updateNotificationPreferences(token, notificationPreferences);
            setNotificationPreferences(response.preferences);
            setPreferencesMessage('Notification settings saved.');
        } catch (error: unknown) {
            setPreferencesError(error instanceof Error ? error.message : 'Unable to save settings.');
        } finally {
            setIsSavingPreferences(false);
        }
    };

    const sortedUpcomingGames = [...upcomingGames].sort((left, right) =>
        `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`),
    );
    const sortedOngoingGames = [...ongoingGames].sort((left, right) =>
        `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`),
    );
    const sortedPastGames = [...pastGames].sort((left, right) =>
        `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`),
    );
    const allGamesInPanel = openGameList === 'upcoming' ? sortedUpcomingGames : sortedPastGames;
    useEffect(() => {
        if (!openGameList) return;
        if (typeof IntersectionObserver === 'undefined') return;
        if (visibleGameCount >= allGamesInPanel.length) return;

        let cancelled = false;
        let observer: IntersectionObserver | null = null;

        const tryObserve = () => {
            if (cancelled) return;

            const sentinel = gameListSentinelRef.current;
            const scrollRoot = gameListScrollRef.current;

            if (!sentinel || !scrollRoot) {
                requestAnimationFrame(tryObserve);
                return;
            }

            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry?.isIntersecting) {
                        setVisibleGameCount((current) => Math.min(current + 10, allGamesInPanel.length));
                    }
                },
                {
                    root: scrollRoot,
                    rootMargin: '0px 0px 160px 0px',
                    threshold: 0,
                },
            );

            observer.observe(sentinel);
        };

        tryObserve();

        return () => {
            cancelled = true;
            observer?.disconnect();
        };
    }, [openGameList, visibleGameCount, allGamesInPanel.length]);

    const showGameList = (list: 'upcoming' | 'past') => {
        setVisibleGameCount(10);
        setOpenGameList(list);
    };

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card className="relative overflow-hidden border border-border bg-card">
                {/* Cover Banner */}
                <div className="h-48 bg-primary relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1750790626700-0b2d3d4472a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2xsZXliYWxsJTIwcGxheWVycyUyMGJlYWNofGVufDF8fHx8MTc2NzY2MjU2N3ww&ixlib=rb-4.1.0&q=80&w=1080')] opacity-10 bg-cover bg-center" />
                </div>

                <div className="px-8 pb-8 relative">
                    {/* Avatar positioned over banner */}
                    <div className="flex justify-between items-start -mt-16 mb-4">
                        <Avatar className="h-32 w-32 border-4 border-card shadow-xl bg-card">
                            <AvatarImage src={player.avatar} alt={player.name} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                                {player.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                            </AvatarFallback>
                        </Avatar>

                        {/* Action Buttons - Desktop */}
                        <div className="hidden md:flex gap-2 mt-4">
                            {isOwnProfile ? (
                                <>
                                    <Button
                                        onClick={onEditProfile}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                        Edit Profile
                                    </Button>
                                    <Button variant="outline" size="icon" className="border-border" onClick={() => openSettings()} aria-label="Settings">
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => onConnect?.(player.id)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {player.isFollowing ? 'Following' : 'Follow'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-3xl mb-2 text-foreground">{player.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{player.location}</span>
                                </div>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Joined {player.stats.memberSince}</span>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={
                                    player.skillLevel === 'Advanced'
                                        ? 'bg-danger/10 text-danger border-danger/20'
                                        : player.skillLevel === 'Intermediate'
                                          ? 'bg-warning/10 text-warning border-warning/20'
                                          : 'bg-success/10 text-success border-success/20'
                                }>
                                {player.skillLevel}
                            </Badge>
                        </div>

                        {player.bio && <p className="text-muted-foreground max-w-2xl">{player.bio}</p>}

                        {/* Action Buttons - Mobile */}
                        <div className="flex md:hidden gap-2">
                            {isOwnProfile ? (
                                <>
                                    <Button
                                        onClick={onEditProfile}
                                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                                        Edit Profile
                                    </Button>
                                    <Button variant="outline" size="icon" className="border-border" onClick={() => openSettings()} aria-label="Settings">
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => onConnect?.(player.id)}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                                    {player.isFollowing ? 'Following' : 'Follow'}
                                </Button>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <div className="text-2xl font-medium mb-1">{player.gamesPlayed}</div>
                                <div className="text-sm text-muted-foreground">Games Played</div>
                            </div>
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <div className="text-2xl font-medium mb-1">{player.stats.hoursPlayed}</div>
                                <div className="text-sm text-muted-foreground">Hours</div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="games" className="w-full">
                <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-4' : 'grid-cols-3'} bg-muted/50`}>
                    <TabsTrigger value="games">Games</TabsTrigger>
                    {isOwnProfile && <TabsTrigger value="requests">Requests</TabsTrigger>}
                    <TabsTrigger value="followers">Followers</TabsTrigger>
                    <TabsTrigger value="following">Following</TabsTrigger>
                </TabsList>

                {/* Games Tab */}
                <TabsContent value="games" className="space-y-6 mt-6">
                    {isOwnProfile && (
                        <section>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl">Your Upcoming Games</h2>
                                </div>
                                {sortedUpcomingGames.length > 3 && (
                                    <Button variant="outline" onClick={() => showGameList('upcoming')}>
                                        View all {sortedUpcomingGames.length}
                                    </Button>
                                )}
                            </div>
                            {sortedUpcomingGames.length ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sortedUpcomingGames.slice(0, 3).map((game) => (
                                        <GameCard
                                            key={game.id}
                                            game={game}
                                            onRSVP={onRSVP}
                                            onViewDetails={onViewGameDetails}
                                            isJoined
                                            showLocation={showGameLocations}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">You haven't joined any upcoming games yet.</p>
                            )}
                        </section>
                    )}
                    {isOwnProfile && sortedOngoingGames.length > 0 && (
                        <section>
                            <h2 className="text-2xl mb-4">Ongoing Games</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortedOngoingGames.map((game) => (
                                    <GameCard
                                        key={game.id}
                                        game={game}
                                        isJoined
                                        showLocation={showGameLocations}
                                        onViewDetails={onViewGameDetails}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                    {isOwnProfile && (
                        <div>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl">Past Games</h2>
                                </div>
                                {sortedPastGames.length > 3 && (
                                    <Button variant="outline" onClick={() => showGameList('past')}>
                                        View all {sortedPastGames.length}
                                    </Button>
                                )}
                            </div>
                            {sortedPastGames.length ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sortedPastGames.slice(0, 3).map((game) => (
                                        <GameCard
                                            key={game.id}
                                            game={game}
                                            isJoined
                                            showLocation={showGameLocations}
                                            onViewDetails={onViewGameDetails}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No past games yet.</p>
                            )}
                        </div>
                    )}
                </TabsContent>

                {isOwnProfile && (
                    <TabsContent value="requests" className="space-y-4 mt-6">
                        <div>
                            <h2 className="text-2xl mb-1">Game Requests</h2>
                            <p className="text-muted-foreground">
                                Track your submitted game creation and update requests.
                            </p>
                        </div>
                        {areRequestsLoading ? (
                            <p className="text-muted-foreground">Loading requests...</p>
                        ) : gameActionRequests.length ? (
                            <div className="space-y-3">
                                {requestActionError && (
                                    <p role="alert" className="text-sm text-destructive">
                                        {requestActionError}
                                    </p>
                                )}
                                {gameActionRequests.map((request) => (
                                    <Card key={request._id} className="p-4 border border-border bg-card">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-medium">{request.proposedGame.title}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {request.action === 'create' ? 'Game creation' : 'Game update'} ·
                                                    Submitted {new Date(request.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    request.status === 'approved'
                                                        ? 'border-success/30 bg-success/10 text-success'
                                                        : request.status === 'declined'
                                                          ? 'border-danger/30 bg-danger/10 text-danger'
                                                          : 'border-warning/30 bg-warning/10 text-warning'
                                                }>
                                                {request.status}
                                            </Badge>
                                        </div>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {request.proposedGame.date} at {request.proposedGame.time} ·{' '}
                                            {request.proposedGame.location}
                                        </p>
                                        {request.reviewNote && (
                                            <p className="mt-2 border-t border-border pt-2 text-sm">
                                                Admin note: {request.reviewNote}
                                            </p>
                                        )}
                                        {request.status === 'pending' && (
                                            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onEditGameRequest?.(request)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setRequestActionError('');
                                                        setRequestToDelete(request);
                                                    }}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">You haven't submitted any game requests yet.</p>
                        )}
                    </TabsContent>
                )}

                <Dialog
                    open={isSettingsOpen}
                    onOpenChange={(open) => {
                        if (!open) setIsSettingsOpen(false);
                    }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {settingsView === 'notifications'
                                    ? 'Notification Settings'
                                    : settingsView === 'support'
                                      ? 'Contact Support'
                                      : 'Settings'}
                            </DialogTitle>
                            <DialogDescription>
                                {settingsView === 'notifications'
                                    ? 'Choose which notifications you want to receive.'
                                    : settingsView === 'support'
                                      ? 'Describe the issue you are running into and our team will follow up.'
                                      : 'Manage your account options.'}
                            </DialogDescription>
                        </DialogHeader>

                        {settingsView === 'menu' && (
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => {
                                        setSettingsView('notifications');
                                        loadNotificationPreferences();
                                    }}>
                                    Notification Settings
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => setSettingsView('support')}>
                                    Contact Support
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="justify-start"
                                    onClick={() => {
                                        setIsSettingsOpen(false);
                                        onSignOut?.();
                                    }}>
                                    Sign Out
                                </Button>
                            </div>
                        )}

                        {settingsView === 'support' && (
                            <div className="space-y-4">
                                {submittedTicket ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-success">
                                            Your support ticket has been submitted. Our team will review it shortly.
                                        </p>
                                        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-medium">{submittedTicket.subject}</span>
                                                <Badge
                                                    variant="outline"
                                                    className="border-success/30 bg-success/10 text-success">
                                                    {submittedTicket.status}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-muted-foreground">{submittedTicket.description}</p>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Submitted{' '}
                                                {new Date(submittedTicket.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex justify-between gap-2 pt-2">
                                            <Button variant="outline" onClick={() => setSettingsView('menu')}>
                                                Back
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setSubmittedTicket(null);
                                                    setSupportSubject('');
                                                    setSupportDescription('');
                                                }}>
                                                Submit Another
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitSupportTicket} className="space-y-4">
                                        {supportTicketError && (
                                            <div
                                                role="alert"
                                                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                                {supportTicketError}
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="support-subject">Subject</Label>
                                            <Input
                                                id="support-subject"
                                                value={supportSubject}
                                                onChange={(event) => setSupportSubject(event.target.value)}
                                                minLength={3}
                                                maxLength={200}
                                                placeholder="e.g. Unable to join a game"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="support-description">Describe the issue</Label>
                                            <Textarea
                                                id="support-description"
                                                value={supportDescription}
                                                onChange={(event) => setSupportDescription(event.target.value)}
                                                minLength={10}
                                                maxLength={5000}
                                                rows={5}
                                                placeholder="What happened? Include any details that will help us investigate."
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-between gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setSettingsView('menu')}
                                                disabled={isSubmittingTicket}>
                                                Back
                                            </Button>
                                            <Button type="submit" disabled={isSubmittingTicket}>
                                                {isSubmittingTicket ? 'Submitting...' : 'Submit Ticket'}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {settingsView === 'notifications' && (
                            <div className="space-y-4">
                                {preferencesError && (
                                    <p role="alert" className="text-sm text-destructive">
                                        {preferencesError}
                                    </p>
                                )}
                                {preferencesMessage && <p className="text-sm text-success">{preferencesMessage}</p>}
                                {notificationPreferences === null ? (
                                    <p className="text-sm text-muted-foreground">Loading settings...</p>
                                ) : (
                                    NOTIFICATION_TYPES.map((type) => (
                                        <div key={type} className="flex items-center justify-between gap-4">
                                            <Label htmlFor={`notif-${type}`}>{NOTIFICATION_TYPE_LABELS[type]}</Label>
                                            <Switch
                                                id={`notif-${type}`}
                                                checked={notificationPreferences[type]}
                                                onCheckedChange={(checked) =>
                                                    setNotificationPreferences((current) =>
                                                        current ? { ...current, [type]: checked } : current,
                                                    )
                                                }
                                            />
                                        </div>
                                    ))
                                )}
                                <div className="flex justify-between gap-2 pt-2">
                                    <Button variant="outline" onClick={() => setSettingsView('menu')}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSaveNotificationPreferences}
                                        disabled={isSavingPreferences || notificationPreferences === null}>
                                        {isSavingPreferences ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={openGameList !== null}
                    onOpenChange={(open) => {
                        if (!open) setOpenGameList(null);
                    }}>
                    <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>{openGameList === 'past' ? 'Past Games' : 'Upcoming Games'}</DialogTitle>
                            <DialogDescription>
                                {allGamesInPanel.length} joined games, ordered by start time.
                            </DialogDescription>
                        </DialogHeader>
                        <div ref={gameListScrollRef} className="min-h-0 flex-1 overflow-y-auto pr-2">
                            <div className="grid gap-4 md:grid-cols-2">
                                {allGamesInPanel.slice(0, visibleGameCount).map((game) => (
                                    <GameCard
                                        key={game.id}
                                        game={game}
                                        isJoined
                                        showLocation={showGameLocations}
                                        onViewDetails={onViewGameDetails}
                                    />
                                ))}
                            </div>
                            {visibleGameCount < allGamesInPanel.length && (
                                <div
                                    ref={gameListSentinelRef}
                                    className="py-5 text-center text-sm text-muted-foreground">
                                    {typeof IntersectionObserver === 'undefined' ? (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setVisibleGameCount((current) =>
                                                    Math.min(current + 10, allGamesInPanel.length),
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
                    </DialogContent>
                </Dialog>

                <AlertDialog
                    open={requestToDelete !== null}
                    onOpenChange={(open) => {
                        if (!open) setRequestToDelete(null);
                    }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this pending request?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This removes the request from your profile and the admin review queue. This cannot be
                                undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Request</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                    if (!requestToDelete || !onDeleteGameRequest) return;
                                    void onDeleteGameRequest(requestToDelete._id)
                                        .then(() => setRequestToDelete(null))
                                        .catch((error: unknown) => {
                                            setRequestActionError(
                                                error instanceof Error
                                                    ? error.message
                                                    : 'Unable to delete the request.',
                                            );
                                        });
                                }}>
                                Delete Request
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Followers Tab */}
                <TabsContent value="followers" className="space-y-6 mt-6">
                    <div>
                        <h2 className="text-2xl mb-4">Followers ({player.followers.length})</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {player.followers.map((follower) => (
                                <PlayerCard
                                    key={follower.id}
                                    player={follower}
                                    onViewProfile={onViewProfile}
                                    onConnect={onConnect}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* Following Tab */}
                <TabsContent value="following" className="space-y-6 mt-6">
                    <div>
                        <h2 className="text-2xl mb-4">Following ({player.following.length})</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {player.following.map((following) => (
                                <PlayerCard
                                    key={following.id}
                                    player={isOwnProfile ? { ...following, isFollowing: true } : following}
                                    onViewProfile={onViewProfile}
                                    onConnect={onConnect}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
