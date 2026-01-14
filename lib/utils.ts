import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getOrderStatusStyles(status: string) {
    switch (status.toLowerCase()) {
        case 'delivered':
        case 'completed':
            return "bg-green-500/10 text-green-500 border border-green-500/20";
        case 'assigned':
        case 'picked_up':
        case 'in_progress':
            return "bg-accent/10 text-accent border border-accent/20";
        case 'pending':
            return "bg-secondary/50 text-muted-foreground border border-border";
        case 'cancelled':
            return "bg-destructive/10 text-destructive border border-destructive/20";
        default:
            return "bg-secondary/30 text-muted-foreground border border-border/50";
    }
}

export function formatZMW(price: number | string) {
    const val = typeof price === 'string' ? parseFloat(price) : price;
    return `K ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        relative: new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
            Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            'day'
        )
    };
}
