"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = (message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-8 duration-300",
                            t.type === 'success' && "bg-green-500/10 border-green-500/20 text-green-500",
                            t.type === 'error' && "bg-destructive/10 border-destructive/20 text-destructive",
                            t.type === 'warning' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
                            t.type === 'info' && "bg-accent/10 border-accent/20 text-accent"
                        )}
                    >
                        {t.type === 'success' && <CheckCircle className="h-5 w-5" />}
                        {t.type === 'error' && <AlertCircle className="h-5 w-5" />}
                        {t.type === 'warning' && <AlertCircle className="h-5 w-5" />}
                        {t.type === 'info' && <Info className="h-5 w-5" />}

                        <p className="text-sm font-black uppercase tracking-widest">{t.message}</p>

                        <button
                            onClick={() => removeToast(t.id)}
                            className="ml-2 hover:opacity-70 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
