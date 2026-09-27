import { useEffect, useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import type { UserProfile, UserProfileInput } from '../lib/auth-api';

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: UserProfile;
    onSave: (profile: UserProfileInput) => Promise<void>;
}

export function EditProfileDialog({ open, onOpenChange, profile, onSave }: EditProfileDialogProps) {
    const [displayName, setDisplayName] = useState(profile.displayName);
    const [avatar, setAvatar] = useState(profile.avatar);
    const [location, setLocation] = useState(profile.location);
    const [bio, setBio] = useState(profile.bio);
    const [skillLevel, setSkillLevel] = useState<UserProfile['skillLevel']>(profile.skillLevel);
    const [positions, setPositions] = useState(profile.positions.join(', '));
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!open) return;
        setDisplayName(profile.displayName);
        setAvatar(profile.avatar);
        setLocation(profile.location);
        setBio(profile.bio);
        setSkillLevel(profile.skillLevel);
        setPositions(profile.positions.join(', '));
        setErrorMessage('');
    }, [open, profile]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        setErrorMessage('');
        try {
            await onSave({
                displayName,
                avatar,
                location,
                bio,
                skillLevel,
                positions: positions
                    .split(',')
                    .map((position) => position.trim())
                    .filter(Boolean),
            });
            onOpenChange(false);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to save your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update the details other players see on your profile.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMessage && (
                        <div
                            role="alert"
                            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="profile-display-name">Display name</Label>
                        <Input
                            id="profile-display-name"
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                            minLength={2}
                            maxLength={80}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="profile-avatar">Profile picture URL</Label>
                        <Input
                            id="profile-avatar"
                            type="url"
                            value={avatar}
                            onChange={(event) => setAvatar(event.target.value)}
                            placeholder="https://example.com/photo.jpg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="profile-location">Location</Label>
                        <Input
                            id="profile-location"
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            maxLength={120}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="profile-skill">Skill level</Label>
                        <Select
                            value={skillLevel}
                            onValueChange={(value) => setSkillLevel(value as UserProfile['skillLevel'])}>
                            <SelectTrigger id="profile-skill">
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
                        <Label htmlFor="profile-positions">Positions</Label>
                        <Input
                            id="profile-positions"
                            value={positions}
                            onChange={(event) => setPositions(event.target.value)}
                            placeholder="Setter, Libero"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="profile-bio">About</Label>
                        <Textarea
                            id="profile-bio"
                            value={bio}
                            onChange={(event) => setBio(event.target.value)}
                            maxLength={500}
                            rows={4}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
