import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Building2, Lock, Bell, ChevronRight, LogOut, Loader2,
  Globe, Phone, MapPin, HelpCircle, Bug, Eye, EyeOff, Mail,
  Camera, ImagePlus, Trash2, Palette,
} from 'lucide-react';
import api, { resolveImageUrl } from '@/utils/api';
import { applyPaletteTheme, applyAvatarTheme, buildThemeFromColor, generateExtendedTheme } from '@/utils/avatarTheme';
import PageHeader from '@/components/partner/PageHeader';
import StatusBadge from '@/components/partner/StatusBadge';
import { PageSkeleton } from '@/components/partner/SkeletonPulse';

const SettingRow = ({ icon: Icon, label, description, onClick, right, destructive }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-all active:scale-[0.99] touch-manipulation ${
      destructive ? 'hover:bg-red-500/5' : 'hover:bg-muted'
    }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
      destructive ? 'bg-red-500/10' : 'bg-muted'
    }`}>
      <Icon className={`w-[18px] h-[18px] ${destructive ? 'text-red-400' : 'text-txt-secondary'}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-[14px] font-semibold ${destructive ? 'text-red-400' : 'text-foreground'}`}>{label}</p>
      {description && <p className="text-[11px] text-txt-muted mt-0.5">{description}</p>}
    </div>
    {right || <ChevronRight className="w-4 h-4 text-txt-muted shrink-0" />}
  </button>
);

const PartnerSettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  const [partnerLogo, setPartnerLogo] = useState(null);
  const [logoPalette, setLogoPalette] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({
    business_name: '', category: '', website: '', description: '',
    address: '', contact_phone: '', full_name: '', phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [notifPrefs, setNotifPrefs] = useState({
    email_orders: true, email_rewards: true, sms_orders: false,
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get('/partner/settings');
      setData(res.data);
      const p = res.data.partner || {};
      const u = res.data.user || {};
      setPartnerLogo(p.logo || null);
      setLogoPalette(p.extracted_palette || []);
      setProfileForm({
        business_name: p.business_name || '', category: p.category || '',
        website: p.website || '', description: p.description || '',
        address: p.address || '', contact_phone: p.contact_phone || '',
        full_name: u.full_name || '', phone: u.phone || '',
      });
      setNotifPrefs(res.data.notification_preferences || notifPrefs);
    } catch { toast.error('Failed to load settings'); }
    finally { setLoading(false); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5MB');
      return;
    }
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/partner/logo/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const logoUrl = res.data.url;
      setPartnerLogo(logoUrl);
      const palette = res.data.palette || [];
      setLogoPalette(palette);
      if (palette.length > 0) applyPaletteTheme(palette);
      toast.success(palette.length > 0 ? 'Logo uploaded — pick a brand color!' : 'Logo updated');
      setBrandOpen(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await api.delete('/partner/logo');
      setPartnerLogo(null);
      applyAvatarTheme();
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/partner/settings/profile', profileForm);
      toast.success('Profile updated');
      setProfileOpen(false);
      fetchSettings();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match'); return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setSaving(true);
    try {
      await api.post('/partner/settings/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordOpen(false);
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  const handleUpdateNotif = async (key, val) => {
    const updated = { ...notifPrefs, [key]: val };
    setNotifPrefs(updated);
    try { await api.put('/partner/settings/notifications', updated); }
    catch { toast.error('Failed to update'); }
  };

  const handleLogout = () => { logout(); navigate('/partners'); };

  if (loading) return <PageSkeleton />;

  const partner = data?.partner || {};
  const userInfo = data?.user || {};

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title="Settings" description="Manage your partner account." />

      {/* Business card with logo */}
      <section className="flex flex-col items-center pb-6">
        <div className="relative group mb-3">
          <div className="w-20 h-20 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden">
            {partnerLogo ? (
              <img src={resolveImageUrl(partnerLogo)} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-txt-muted" />
            )}
          </div>
          <button
            type="button"
            onClick={() => setBrandOpen(true)}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-surface-page"
          >
            <Camera className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
        <h2 className="text-lg font-heading font-bold">{partner.business_name || 'Your Business'}</h2>
        <p className="text-xs text-txt-muted font-medium">{userInfo.email}</p>
        <div className="mt-2">
          <StatusBadge status={partner.status || 'ACTIVE'} />
        </div>
      </section>

      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      {/* Settings rows */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border mb-3">
        <SettingRow icon={Palette} label="Brand & logo" description="Upload logo to personalize your theme" onClick={() => setBrandOpen(true)} />
        <SettingRow icon={Building2} label="Business profile" description="Name, category, website, address" onClick={() => setProfileOpen(true)} />
        <SettingRow icon={Globe} label="Store details" description={partner.website || 'Add your website'} onClick={() => setProfileOpen(true)} />
      </section>

      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border mb-3">
        <SettingRow icon={Lock} label="Change password" description="Update your login credentials" onClick={() => setPasswordOpen(true)} />
        <SettingRow icon={Bell} label="Notifications" description="Order and reward alerts" onClick={() => setNotifOpen(true)} />
      </section>

      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border mb-3">
        <SettingRow icon={HelpCircle} label="Help & Support" description="Contact the Lynkr team" onClick={() => toast.info('Support coming soon')} />
        <SettingRow icon={Bug} label="Report an issue" description="Something not working?" onClick={() => toast.info('Bug reporting coming soon')} />
      </section>

      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border mb-3">
        <SettingRow icon={LogOut} label="Log out" onClick={handleLogout} />
      </section>

      <p className="text-center text-[11px] text-txt-muted font-medium mt-6">Lynkr Partner v1.0</p>

      {/* ── PROFILE DIALOG ── */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-surface-raised">
          <DialogHeader><DialogTitle>Business Profile</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-1.5 block">Business Name</Label>
              <Input value={profileForm.business_name} onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })} className="bg-muted border-border rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-1.5 block">Category</Label>
              <Input value={profileForm.category} onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })} placeholder="e.g. Fashion, Cafes" className="bg-muted border-border rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-1.5 block">Website</Label>
              <Input value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} placeholder="https://..." className="bg-muted border-border rounded-xl h-11" />
            </div>
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-1.5 block">Description</Label>
              <Textarea value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} placeholder="Tell customers about your business" rows={3} className="bg-muted border-border rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-1.5 block">Address</Label>
              <Input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="bg-muted border-border rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-txt-secondary mb-1.5 block">Contact Name</Label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="bg-muted border-border rounded-xl h-11" />
              </div>
              <div>
                <Label className="text-xs font-bold text-txt-secondary mb-1.5 block">Phone</Label>
                <Input value={profileForm.phone || profileForm.contact_phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value, contact_phone: e.target.value })} className="bg-muted border-border rounded-xl h-11" />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProfileOpen(false)} className="rounded-xl border-border">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── PASSWORD DIALOG ── */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-surface-raised">
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { id: 'current', label: 'Current Password', key: 'current_password' },
              { id: 'new', label: 'New Password', key: 'new_password' },
              { id: 'confirm', label: 'Confirm Password', key: 'confirm_password' },
            ].map((field) => (
              <div key={field.id}>
                <Label className="text-xs font-bold text-txt-secondary mb-1.5 block">{field.label}</Label>
                <div className="relative">
                  <Input
                    type={showPasswords[field.id] ? 'text' : 'password'}
                    value={passwordForm[field.key]}
                    onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                    className="bg-muted border-border rounded-xl h-11 pr-10"
                  />
                  <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, [field.id]: !p[field.id] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary">
                    {showPasswords[field.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)} className="rounded-xl border-border">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── NOTIFICATIONS DIALOG ── */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-surface-raised">
          <DialogHeader><DialogTitle>Notifications</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { key: 'email_orders', title: 'Order emails', desc: 'When a new order comes in' },
              { key: 'email_rewards', title: 'Reward alerts', desc: 'Coupon approvals and updates' },
              { key: 'sms_orders', title: 'Order SMS', desc: 'SMS for new orders' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-[11px] text-txt-muted mt-0.5">{item.desc}</p>
                </div>
                <Switch
                  checked={notifPrefs[item.key]}
                  onCheckedChange={(checked) => handleUpdateNotif(item.key, checked)}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── BRAND & LOGO DIALOG ── */}
      <Dialog open={brandOpen} onOpenChange={setBrandOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-surface-raised">
          <DialogHeader><DialogTitle>Brand & Logo</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <p className="text-xs text-txt-secondary leading-relaxed">
              Upload your brand logo. Colors from the logo will be extracted to personalize your dashboard theme.
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                {partnerLogo ? (
                  <img src={resolveImageUrl(partnerLogo)} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-8 h-8 text-txt-muted" />
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-xl text-xs gap-1.5"
                >
                  {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {partnerLogo ? 'Change logo' : 'Upload logo'}
                </Button>
                {partnerLogo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveLogo}
                    className="rounded-xl text-xs gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </Button>
                )}
              </div>
            </div>

            {logoPalette.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-txt-secondary mb-2">Pick a brand color</p>
                <div className="flex gap-2.5 flex-wrap">
                  {logoPalette.map((color, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const base = buildThemeFromColor(color);
                        const extended = generateExtendedTheme(base);
                        const root = document.documentElement.style;
                        Object.entries({
                          "--theme-primary": extended.primary, "--theme-ring": extended.primary,
                          "--theme-accent": extended.accent, "--theme-secondary": extended.secondary,
                          "--theme-gradient-from": extended.gradientFrom, "--theme-gradient-to": extended.gradientTo,
                          "--theme-glow": extended.glowColor, "--theme-card-border": extended.cardBorder,
                          "--theme-soft-tint": extended.softTint, "--theme-accent-muted": extended.accentMuted,
                          "--theme-complementary": extended.complementary,
                        }).forEach(([k, v]) => root.setProperty(k, v));
                        toast.success('Brand theme applied!');
                      }}
                      className="w-10 h-10 rounded-xl border-2 border-border hover:border-primary/30 transition-all active:scale-95"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerSettingsPage;
