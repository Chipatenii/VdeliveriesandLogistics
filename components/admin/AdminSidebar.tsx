"use client";

import React from 'react';
import {
    LayoutDashboard,
    Map as MapIcon,
    CircleDollarSign,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type AdminView = 'overview' | 'fleet' | 'payroll' | 'drivers' | 'settings';

interface SidebarProps {
    activeView: AdminView;
    onViewChange: (view: AdminView) => void;
}

export default function AdminSidebar({ activeView, onViewChange }: SidebarProps) {
    const { signOut, profile } = useAuth();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'fleet', label: 'Fleet Overview', icon: MapIcon },
        { id: 'payroll', label: 'Payroll & Finance', icon: CircleDollarSign },
        { id: 'drivers', label: 'Driver Management', icon: Users },
        { id: 'settings', label: 'System Settings', icon: Settings },
    ] as const;

    return (
        <aside className={cn(
            "fixed bottom-0 left-0 right-0 md:relative md:h-screen md:sticky md:top-0 bg-card border-t md:border-t-0 md:border-r border-border transition-all duration-300 flex flex-row md:flex-col z-[100]",
            isCollapsed ? "md:w-20" : "md:w-72"
        )}>
            {/* Logo area - Hidden on mobile */}
            <div className="hidden md:flex p-6 border-b border-border/50 items-center justify-between">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                            <TrendingUp className="text-white h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-black text-white tracking-tighter leading-none">V DELIVERIES</p>
                            <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">Admin Hub</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-secondary/50 rounded-xl transition-colors text-muted-foreground"
                >
                    {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </button>
            </div>

            {/* Navigation Items - Horizontal on mobile, Vertical on desktop */}
            <nav className="flex-1 flex flex-row md:flex-col md:p-4 md:space-y-2 justify-around md:justify-start">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={cn(
                                "flex flex-col md:flex-row items-center gap-1 md:gap-4 px-3 md:px-4 py-3 md:py-4 rounded-2xl transition-all group relative overflow-hidden",
                                isActive
                                    ? "text-accent md:bg-accent/10 md:font-black md:border md:border-accent/20"
                                    : "text-muted-foreground hover:bg-secondary/50 font-bold"
                            )}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-accent" : "group-hover:text-white transition-colors")} />
                            {!isCollapsed && (
                                <span className="text-[10px] md:text-sm tracking-tight uppercase whitespace-nowrap">{
                                    item.label.split(' ')[0]
                                }</span>
                            )}
                            {isActive && (
                                <div className="absolute top-0 md:top-auto md:left-0 w-8 md:w-1 h-1 md:h-6 bg-accent rounded-b-full md:rounded-r-full" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Profile & Logout - Icons only on mobile */}
            <div className="flex flex-row md:flex-col items-center md:p-4 border-l md:border-l-0 md:border-t border-border/50 md:space-y-4 px-2">
                {!isCollapsed && (
                    <div className="hidden md:block w-full px-4 py-3 bg-secondary/30 rounded-2xl border border-border/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logged in</p>
                        <p className="text-xs font-bold text-white mt-1 truncate">{profile?.full_name?.toUpperCase()}</p>
                    </div>
                )}
                <Button
                    variant="ghost"
                    onClick={signOut}
                    className={cn(
                        "justify-start gap-4 h-12 md:h-14 rounded-2xl text-destructive hover:text-white hover:bg-destructive transition-all active:scale-95",
                        isCollapsed ? "px-0 justify-center w-12" : "px-3 md:px-4 md:w-full"
                    )}
                >
                    <LogOut className="h-5 w-5" />
                    {!isCollapsed && <span className="hidden md:inline font-black tracking-tighter uppercase">LOGOUT</span>}
                </Button>
            </div>
        </aside>
    );
}
