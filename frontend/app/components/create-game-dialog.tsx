import { useEffect, useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
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
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import type { GameActionRequest, GameActionRequestInput } from '../lib/auth-api';

interface CreateGameDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requestToEdit?: GameActionRequest | null;
    onCreateGame: (gameData: GameActionRequestInput, requestId?: string) => Promise<void>;
}

type GameFormData = Omit<GameActionRequestInput, 'totalSpots'> & { totalSpots: string };

export function CreateGameDialog({ open, onOpenChange, requestToEdit, onCreateGame }: CreateGameDialogProps) {
    const [formData, setFormData] = useState<GameFormData>({
        title: '',
        date: '',
        time: '',
        location: '',
        skillLevel: 'All Levels',
        totalSpots: '12',
        type: 'casual',
        courtType: 'indoor',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!open || !requestToEdit) return;
        setFormData({
            ...requestToEdit.proposedGame,
            totalSpots: String(requestToEdit.proposedGame.totalSpots),
            description: requestToEdit.proposedGame.description || '',
        });
        setRequestSent(false);
        setErrorMessage('');
    }, [open, requestToEdit]);

    const resetForm = () => {
        setFormData({
            title: '',
            date: '',
            time: '',
            location: '',
            skillLevel: 'All Levels',
            totalSpots: '12',
            type: 'casual',
            courtType: 'indoor',
            description: '',
        });
        setRequestSent(false);
        setIsConfirmOpen(false);
        setErrorMessage('');
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');
        setIsConfirmOpen(true);
    };

    const submitRequest = async () => {
        setIsSubmitting(true);
        try {
            await onCreateGame(
                {
                    ...formData,
                    totalSpots: Number(formData.totalSpots),
                },
                requestToEdit?._id,
            );
            setRequestSent(true);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to send the game request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={`${requestSent ? 'sm:max-w-md' : 'max-w-2xl max-h-[90vh] overflow-y-auto'} bg-card border-2 border-border`}>
                {requestSent ? (
                    <div className="space-y-5 py-2">
                        <DialogHeader>
                            <DialogTitle>{requestToEdit ? 'Request updated' : 'Game request sent'}</DialogTitle>
                            <DialogDescription>
                                {requestToEdit
                                    ? 'Your pending request was updated. You can track its status in your profile.'
                                    : 'Your game creation request was sent and will be processed shortly. You can track its status in your profile.'}
                            </DialogDescription>
                        </DialogHeader>
                        <Button className="w-full" onClick={() => handleOpenChange(false)}>
                            Done
                        </Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>{requestToEdit ? 'Update Pending Request' : 'Create New Game'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {errorMessage && (
                                <div
                                    role="alert"
                                    className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {errorMessage}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="title">Game Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Saturday Morning Volleyball"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="bg-input-background border-border focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        className="bg-input-background border-border focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time">Time</Label>
                                    <Input
                                        id="time"
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        required
                                        className="bg-input-background border-border focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Downtown Sports Center"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                    className="bg-input-background border-border focus:border-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="skillLevel">Skill Level</Label>
                                    <Select
                                        value={formData.skillLevel}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                skillLevel: value as GameFormData['skillLevel'],
                                            })
                                        }>
                                        <SelectTrigger className="bg-input-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All Levels">All Levels</SelectItem>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="totalSpots">Total Players</Label>
                                    <Select
                                        value={formData.totalSpots}
                                        onValueChange={(value) => setFormData({ ...formData, totalSpots: value })}>
                                        <SelectTrigger className="bg-input-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="6">6 players</SelectItem>
                                            <SelectItem value="8">8 players</SelectItem>
                                            <SelectItem value="10">10 players</SelectItem>
                                            <SelectItem value="12">12 players</SelectItem>
                                            <SelectItem value="16">16 players</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Game Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, type: value as GameFormData['type'] })
                                        }>
                                        <SelectTrigger className="bg-input-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="casual">Casual</SelectItem>
                                            <SelectItem value="competitive">Competitive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="courtType">Court Type</Label>
                                    <Select
                                        value={formData.courtType}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, courtType: value as GameFormData['courtType'] })
                                        }>
                                        <SelectTrigger className="bg-input-background border-border">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="indoor">Indoor</SelectItem>
                                            <SelectItem value="outdoor">Outdoor</SelectItem>
                                            <SelectItem value="beach">Beach</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Add any additional details about the game..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-input-background border-border focus:border-primary min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    className="flex-1 border-border">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    disabled={isSubmitting}>
                                    {isSubmitting
                                        ? 'Sending Request...'
                                        : requestToEdit
                                          ? 'Update Request'
                                          : 'Create Game'}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </DialogContent>
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {requestToEdit ? 'Update this pending request?' : 'Send this game creation request?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {requestToEdit
                                ? 'The request details will be replaced with these values. Admin review is still required.'
                                : 'This sends your proposed game to the admin review queue. It will not be published until approved.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction disabled={isSubmitting} onClick={() => void submitRequest()}>
                            {requestToEdit ? 'Confirm Update' : 'Send Request'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
