"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Mail, Shield, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        setLoading(false);
        if (error) {
            toast("Failed to update profile", "error");
        } else {
            toast("Profile updated successfully", "success");
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[425px] rounded-[2rem] shadow-2xl backdrop-blur-2xl p-0 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-accent opacity-50" />

                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                        MY <span className="text-accent italic">PROFILE</span>
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-2">
                        Account Information & Settings
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 pt-0 space-y-6">
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
                                    <Input
                                        value={user?.email || ''}
                                        disabled
                                        className="h-14 pl-12 bg-secondary/10 border-border text-muted-foreground rounded-2xl cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
                                    <Input
                                        value={profile?.role?.toUpperCase() || ''}
                                        disabled
                                        className="h-14 pl-12 bg-secondary/10 border-border text-accent font-black rounded-2xl cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 h-14 font-black rounded-2xl text-muted-foreground"
                                onClick={onClose}
                            >
                                CANCEL
                            </Button>
                            <Button
                                type="submit"
                                className="flex-[2] h-14 bg-accent hover:bg-accent/90 text-white font-black rounded-2xl shadow-xl shadow-accent/20 border-b-6 border-accent/50 text-lg transition-all active:scale-95"
                                disabled={loading || fullName === profile?.full_name}
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                    <>
                                        <Save className="mr-2 h-5 w-5" />
                                        SAVE CHANGES
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
