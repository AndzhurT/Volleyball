import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
    getNotifications,
    getStoredAuthToken,
    getUnreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
    type NotificationItem,
} from '../lib/auth-api';

function formatTimestamp(value: string) {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export function NotificationsBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = useCallback(async () => {
        const token = getStoredAuthToken();
        if (!token) {
            setUnreadCount(0);
            setNotifications([]);
            return;
        }
        try {
            const { count } = await getUnreadNotificationCount(token);
            setUnreadCount(count);
        } catch {
            // ignore
        }
    }, []);

    const loadNotifications = useCallback(async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
            const { data, unreadCount } = await getNotifications(token);
            setNotifications(data);
            setUnreadCount(unreadCount);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        refreshUnreadCount();
        const interval = setInterval(refreshUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [refreshUnreadCount]);

    useEffect(() => {
        if (open) loadNotifications();
    }, [open, loadNotifications]);

    const handleMarkAllRead = async () => {
        const token = getStoredAuthToken();
        if (!token) return;
        try {
            await markAllNotificationsRead(token);
            setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
            setUnreadCount(0);
        } catch {
            // ignore
        }
    };

    const handleMarkRead = async (notification: NotificationItem) => {
        if (notification.readAt) return;
        const token = getStoredAuthToken();
        if (!token) return;
        try {
            await markNotificationRead(token, notification.id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // ignore
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3">
                    <h3 className="font-medium">Notifications</h3>
                    <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                        <CheckCheck className="w-4 h-4 mr-1" />
                        Mark all read
                    </Button>
                </div>
                <Separator />
                <ScrollArea className="max-h-96">
                    {notifications.length === 0 ? (
                        <p className="px-4 py-8 text-sm text-muted-foreground text-center">No notifications yet.</p>
                    ) : (
                        <ul>
                            {notifications.map((notification) => (
                                <li key={notification.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleMarkRead(notification)}
                                        className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors ${
                                            notification.readAt ? '' : 'bg-accent/30'
                                        }`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium">{notification.title}</p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatTimestamp(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
