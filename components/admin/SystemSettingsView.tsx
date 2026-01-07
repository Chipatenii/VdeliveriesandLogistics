"use client";

import React from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Settings,
    Save,
    Globe,
    Bell,
    Lock,
    Zap,
    CreditCard,
    Info,
    Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';

export default function SystemSettingsView() {
    const [settings, setSettings] = React.useState<Record<string, string>>({
        base_delivery_fee: '25.00',
        km_rate: '5.50',
        service_tax: '16',
        min_payout: '100.00'
    });
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*');

            if (data) {
                const settingsMap: Record<string, string> = {};
                data.forEach(s => settingsMap[s.key] = s.value);
                setSettings(prev => ({ ...prev, ...settingsMap }));
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const updates = Object.entries(settings).map(([key, value]) => ({
            key,
            value,
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('system_settings')
            .upsert(updates);

        if (error) {
            toast('Failed to save settings: ' + error.message, 'error');
        } else {
            toast('Settings saved successfully', 'success');
        }
        setSaving(false);
    };

    const handleForceUpdate = async () => {
        const confirm = window.confirm('This will prompt all mobile users to update. Proceed?');
        if (!confirm) return;

        setSaving(true);
        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key: 'min_app_version',
                value: '2.5.0', // Incrementing version
                updated_at: new Date().toISOString()
            });

        if (!error) toast('App update flag sent to all devices.', 'success');
        setSaving(false);
    };

    const handleMaintenanceMode = async (enabled: boolean) => {
        setSaving(true);
        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key: 'maintenance_mode',
                value: enabled ? 'true' : 'false',
                updated_at: new Date().toISOString()
            });

        if (!error) toast(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`, enabled ? 'warning' : 'success');
        setSaving(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Settings className="h-8 w-8 animate-spin text-accent" />
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase">SYSTEM CONFIGURATION</h2>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                    <Settings className="h-3 w-3 text-accent" />
                    Global Parameters & Operational Rules
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* General Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-card/40 border-border backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-border/50 bg-secondary/20">
                            <div className="flex items-center gap-3">
                                <Globe className="h-5 w-5 text-accent" />
                                <CardTitle className="text-xl font-black tracking-tighter uppercase">Operational Parameters</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Base Delivery Fee (ZMW)</Label>
                                    <Input
                                        value={settings.base_delivery_fee}
                                        onChange={(e) => setSettings(prev => ({ ...prev, base_delivery_fee: e.target.value }))}
                                        className="h-12 bg-secondary/30 border-border rounded-xl font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price per Kilometer (ZMW)</Label>
                                    <Input
                                        value={settings.km_rate}
                                        onChange={(e) => setSettings(prev => ({ ...prev, km_rate: e.target.value }))}
                                        className="h-12 bg-secondary/30 border-border rounded-xl font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Tax (%)</Label>
                                    <Input
                                        value={settings.service_tax}
                                        onChange={(e) => setSettings(prev => ({ ...prev, service_tax: e.target.value }))}
                                        className="h-12 bg-secondary/30 border-border rounded-xl font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min. Driver Payout (ZMW)</Label>
                                    <Input
                                        value={settings.min_payout}
                                        onChange={(e) => setSettings(prev => ({ ...prev, min_payout: e.target.value }))}
                                        className="h-12 bg-secondary/30 border-border rounded-xl font-mono font-bold"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-border backdrop-blur-md rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-border/50 bg-secondary/20">
                            <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-accent" />
                                <CardTitle className="text-xl font-black tracking-tighter uppercase">Notifications & Realtime</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black uppercase tracking-widest text-white">Push Notifications</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Alert drivers of new incoming orders</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black uppercase tracking-widest text-white">Auto-Assignment</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Automatically assign nearby drivers</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-border/50">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black uppercase tracking-widest text-white">Real-time Telemetry</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Stream high-frequency GPS updates</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info / Quick Actions */}
                <div className="space-y-8">
                    <Card className="bg-accent/10 border-accent/20 backdrop-blur-md rounded-[2rem] overflow-hidden">
                        <CardContent className="p-8">
                            <Zap className="h-10 w-10 text-accent mb-4" />
                            <h3 className="text-xl font-black tracking-tighter uppercase text-white">Quick Actions</h3>
                            <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-2 mb-6">Service Continuity Tools</p>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleForceUpdate}
                                    className="w-full justify-start gap-3 bg-card/60 hover:bg-card border border-border text-white font-bold h-12 rounded-xl text-xs uppercase tracking-widest"
                                >
                                    <Smartphone className="h-4 w-4" />
                                    Force App Update
                                </Button>
                                <Button className="w-full justify-start gap-3 bg-card/60 hover:bg-card border border-border text-white font-bold h-12 rounded-xl text-xs uppercase tracking-widest">
                                    <CreditCard className="h-4 w-4" />
                                    Clear Payout Queue
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleMaintenanceMode(true)}
                                    className="w-full justify-start gap-3 font-black h-12 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-destructive/20"
                                >
                                    <Lock className="h-4 w-4" />
                                    Enable Maintenance
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-secondary/20 rounded-[2rem] border border-border/50">
                        <div className="flex items-center gap-2 mb-4">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Info</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-muted-foreground uppercase">Version</span>
                                <span className="text-white">v2.4.0-OB-PRO</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-muted-foreground uppercase">Environment</span>
                                <span className="text-accent uppercase">Production</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-muted-foreground uppercase">Uptime</span>
                                <span className="text-green-500 uppercase">99.98%</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        disabled={saving}
                        onClick={handleSave}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-black h-16 rounded-[1.5rem] shadow-2xl shadow-accent/40 text-sm uppercase tracking-[0.2em] transition-all active:scale-95"
                    >
                        {saving ? <Settings className="h-5 w-5 animate-spin mr-3" /> : <Save className="h-5 w-5 mr-3" />}
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
