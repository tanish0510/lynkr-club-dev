import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  User, Lock, Bell, Shield, Trash2, Mail, Loader2, ChevronRight,
  Share2, Palette, HelpCircle, Bug, ArrowLeft, LogOut, Sparkles,
  Eye, EyeOff, Camera, X, ImageIcon, Sun, Moon,
  History, Gift, ShoppingBag, Ticket, Heart, Store,
} from 'lucide-react';
import api, { resolveImageUrl } from '@/utils/api';
import AppAvatar from '@/components/Avatar';
import AvatarPicker from '@/components/AvatarPicker';
import UsernameInput from '@/components/UsernameInput';
import { DEFAULT_AVATAR } from '@/constants/avatars';
import BrandLoader from '@/components/BrandLoader';
import { applyAvatarTheme, applyPaletteTheme, buildThemeFromColor, generateExtendedTheme, applyPresetTheme, PRESET_THEMES } from '@/utils/avatarTheme';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

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

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profileUsernameValid, setProfileUsernameValid] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: '', username: '', avatar: DEFAULT_AVATAR,
    phone: '', dob: '', gender: '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [extractedPalette, setExtractedPalette] = useState([]);
  const [selectedColorIdx, setSelectedColorIdx] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const { mode: colorMode, isDark } = useTheme();
  const [passwordForm, setPasswordForm] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false,
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_purchases: true, email_rewards: true,
    sms_purchases: false, sms_rewards: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    share_anonymous_data: true, marketing_emails: false,
  });

  const [favStores, setFavStores] = useState([]);

  useEffect(() => { fetchUserData(); fetchFavorites(); }, []);

  const fetchFavorites = async () => {
    try {
      const [idsRes, partnersRes] = await Promise.all([
        api.get('/user/favorite-stores'),
        api.get('/partners/active'),
      ]);
      const ids = new Set(idsRes.data || []);
      setFavStores((partnersRes.data || []).filter(p => ids.has(p.id)));
    } catch { /* */ }
  };

  const removeFavorite = async (partnerId) => {
    setFavStores(prev => prev.filter(p => p.id !== partnerId));
    try {
      await api.delete(`/user/favorite-stores/${partnerId}`);
      toast('Removed from favorites', { icon: '💔' });
    } catch {
      fetchFavorites();
      toast.error('Could not update favorites');
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get('/user/me');
      const d = response.data;
      setUser(d);
      setProfileForm({
        full_name: d.full_name || '', username: d.username || '',
        avatar: d.avatar || DEFAULT_AVATAR,
        phone: d.phone || '', dob: d.dob || '', gender: d.gender || '',
      });
      setProfilePhoto(d.profile_photo || null);
      setExtractedPalette(d.extracted_palette || []);
      setNotificationPrefs(d.notification_preferences || notificationPrefs);
      setPrivacySettings(d.privacy_settings || privacySettings);
    } catch { toast.error('Failed to load profile'); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WebP, or GIF image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/user/profile-photo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfilePhoto(res.data.url);
      const palette = res.data.palette || [];
      setExtractedPalette(palette);
      setSelectedColorIdx(null);

      if (palette.length > 0) {
        const theme = applyPaletteTheme(palette);
        try { await api.put('/user/theme-colors', theme); } catch {}
      }

      toast.success(palette.length > 0 ? 'Photo uploaded — pick a color below!' : 'Profile photo updated');
      setAppearanceOpen(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await api.delete('/user/profile-photo');
      setProfilePhoto(null);
      applyAvatarTheme(profileForm.avatar);
      toast.success('Photo removed');
      await fetchUserData();
    } catch { toast.error('Failed to remove photo'); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/user/profile', profileForm);
      toast.success('Profile updated');
      await fetchUserData();
      setProfileOpen(false);
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to update profile'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/user/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordOpen(false);
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  const handleUpdateNotifications = async (key, val) => {
    const updated = { ...notificationPrefs, [key]: val };
    setNotificationPrefs(updated);
    try { await api.put('/user/notification-preferences', updated); }
    catch { toast.error('Failed to update'); }
  };

  const handleUpdatePrivacy = async (key, val) => {
    const updated = { ...privacySettings, [key]: val };
    setPrivacySettings(updated);
    try { await api.put('/user/privacy-settings', updated); }
    catch { toast.error('Failed to update'); }
  };

  const handleResendVerification = async () => {
    try { await api.post('/auth/resend-verification'); toast.success('Verification email sent'); }
    catch { toast.error('Failed to send'); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
    try { await api.delete('/user/account'); toast.success('Account deleted'); logout(); navigate('/'); }
    catch { toast.error('Failed to delete account'); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleShare = async () => {
    const shareData = { title: 'Lynkr', text: 'Check out Lynkr - earn rewards on every purchase!', url: window.location.origin };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success('Link copied to clipboard');
    }
  };

  if (!user) return <BrandLoader label="Loading your profile..." />;

  const resolvedPhoto = profilePhoto ? resolveImageUrl(profilePhoto) : null;

  return (
    <div className="max-w-xl mx-auto pb-12">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={() => navigate('/app/home')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-txt-muted hover:text-muted-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <h1 className="flex-1 text-lg font-heading font-bold text-center">Settings</h1>
        <div className="w-9" />
      </header>

      {/* Avatar / Photo section */}
      <section className="flex flex-col items-center px-4 pt-3 pb-6">
        <div className="relative group">
          {/* Profile photo or avatar */}
          {resolvedPhoto ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
              <img src={resolvedPhoto} alt="Profile" className="w-full h-full object-cover" />
              {/* Remove button */}
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-surface-page"
                title="Remove photo"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <AppAvatar
              avatar={profileForm.avatar}
              username={profileForm.username}
              className="h-20 w-20 ring-2 ring-border group-hover:ring-primary/30 transition-all"
              imageClassName="h-full w-full object-cover"
            />
          )}
          {/* Upload button overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-surface-page hover:scale-110 transition-transform active:scale-95"
          >
            {uploadingPhoto ? (
              <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
        <h2 className="mt-3 text-lg font-heading font-bold">{user.full_name || user.username}</h2>
        <p className="text-xs text-txt-muted font-medium">{user.email}</p>
        {user.points != null && (
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-bold text-primary tabular-nums">{user.points} points</span>
          </div>
        )}
        {/* Upload hint */}
        {!resolvedPhoto && (
          <p className="mt-2 text-[11px] text-txt-muted font-medium">
            Upload a photo to personalize your theme
          </p>
        )}
      </section>

      {/* Email verification banner */}
      {!user.email_verified && (
        <div className="mx-4 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/15 px-4 py-3 flex items-center gap-3">
          <Mail className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-400">Email not verified</p>
          </div>
          <button onClick={handleResendVerification} className="text-[11px] font-bold text-amber-400 hover:underline shrink-0">Resend</button>
        </div>
      )}

      {/* Invite & Earn */}
      <section className="mx-4 mb-5">
        <button
          onClick={() => navigate('/app/invite')}
          className="w-full rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-purple-500/10 border border-primary/10 p-4 flex items-center gap-3.5 text-left transition-all hover:from-primary/20 active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-foreground">Invite & Earn</p>
            <p className="text-[11px] text-txt-muted mt-0.5">Invite friends, earn +100 pts each</p>
          </div>
          <ChevronRight className="w-4 h-4 text-txt-muted ml-auto shrink-0" />
        </button>
      </section>

      {/* Settings rows */}
      <section className="mx-4 mb-3 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <SettingRow icon={User} label="Manage profile" description="Name, avatar, phone, and more" onClick={() => setProfileOpen(true)} />
        <SettingRow icon={ImageIcon} label="Profile photo" description={resolvedPhoto ? 'Change or remove your photo' : 'Upload to personalize your theme'} onClick={() => fileInputRef.current?.click()} />
        <SettingRow icon={Palette} label="Customize appearance" description="Avatar theme and display" onClick={() => setAppearanceOpen(true)} />
      </section>

      <section className="mx-4 mb-3 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <SettingRow icon={History} label="Activity timeline" description="Points earned, redeemed, and purchases" onClick={() => navigate('/app/activity-timeline')} />
        <SettingRow icon={Gift} label="Gift cards" description="View your redeemed gift cards" onClick={() => navigate('/app/gift-cards')} />
        <SettingRow icon={Ticket} label="Rewards redeemed" description="Coupons and rewards history" onClick={() => navigate('/app/my-activity')} />
        <SettingRow icon={ShoppingBag} label="Purchase history" description="All verified and pending purchases" onClick={() => navigate('/app/purchases')} />
      </section>

      {/* Favorite stores */}
      {favStores.length > 0 && (
        <section className="mx-4 mb-3">
          <p className="text-[10px] text-txt-secondary uppercase tracking-[0.2em] font-bold mb-2 px-1 flex items-center gap-1.5">
            <Heart className="h-3 w-3 fill-red-500 text-red-500" /> Favorite Stores
          </p>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {favStores.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/catalog/${p.catalog_slug || p.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left touch-manipulation"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border/50 shrink-0">
                    {p.logo ? (
                      <img src={resolveImageUrl(p.logo)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-4 w-4 text-txt-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{p.business_name}</p>
                    {p.category && <p className="text-[11px] text-txt-muted mt-0.5 truncate">{p.category}</p>}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => removeFavorite(p.id)}
                  className="p-2 rounded-xl text-txt-muted hover:text-red-400 hover:bg-red-500/10 transition-colors active:scale-90 touch-manipulation shrink-0"
                  aria-label="Remove from favorites"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-4 mb-3 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <SettingRow icon={Bell} label="Manage notifications" description="Email and SMS alerts" onClick={() => setNotifOpen(true)} />
        <SettingRow icon={Shield} label="Privacy & data" description="Data sharing and marketing" onClick={() => setPrivacyOpen(true)} />
        <SettingRow icon={Lock} label="Change password" description="Update your password" onClick={() => setPasswordOpen(true)} />
      </section>

      <section className="mx-4 mb-3 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <SettingRow icon={HelpCircle} label="FAQ & Help" description="Common questions answered" onClick={() => toast.info('Help center coming soon')} />
        <SettingRow icon={Bug} label="Report a bug" description="Something not working?" onClick={() => toast.info('Bug reporting coming soon')} />
      </section>

      <section className="mx-4 mb-3 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <SettingRow icon={LogOut} label="Log out" onClick={handleLogout} />
        <SettingRow icon={Trash2} label="Delete account" description="Permanently remove your data" onClick={handleDeleteAccount} destructive />
      </section>

      <p className="text-center text-[11px] text-txt-muted font-medium mt-6 mb-4">Lynkr v1.0</p>

      {/* ── PROFILE DIALOG ── */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-popover">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <AppAvatar
                  avatar={profileForm.avatar}
                  profilePhoto={profilePhoto}
                  username={profileForm.username}
                  className="h-16 w-16"
                />
              </div>
            </div>
            {!profilePhoto && (
              <div>
                <Label className="text-xs font-bold text-txt-secondary mb-2 block">Avatar</Label>
                <AvatarPicker value={profileForm.avatar} onChange={(avatar) => setProfileForm({ ...profileForm, avatar })} />
              </div>
            )}
            <UsernameInput
              value={profileForm.username}
              onChange={(username) => setProfileForm({ ...profileForm, username })}
              onValidityChange={setProfileUsernameValid}
              currentUsername={user.username}
            />
            <div>
              <Label htmlFor="full-name" className="text-xs font-bold text-txt-secondary mb-1.5 block">Full Name</Label>
              <Input id="full-name" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} className="bg-muted border-border rounded-xl h-11" />
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs font-bold text-txt-secondary mb-1.5 block">Phone</Label>
              <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="bg-muted border-border rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dob" className="text-xs font-bold text-txt-secondary mb-1.5 block">Date of Birth</Label>
                <Input id="dob" type="date" value={profileForm.dob} onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })} className="bg-muted border-border rounded-xl h-11" />
              </div>
              <div>
                <Label htmlFor="gender" className="text-xs font-bold text-txt-secondary mb-1.5 block">Gender</Label>
                <select id="gender" value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} className="w-full bg-muted border border-border rounded-xl h-11 px-3 text-foreground text-sm">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProfileOpen(false)} className="rounded-xl border-border">Cancel</Button>
              <Button type="submit" disabled={loading || !profileUsernameValid} className="rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── PASSWORD DIALOG ── */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-popover">
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { id: 'current', label: 'Current Password', key: 'current_password' },
              { id: 'new', label: 'New Password', key: 'new_password' },
              { id: 'confirm', label: 'Confirm New Password', key: 'confirm_password' },
            ].map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.id} className="text-xs font-bold text-txt-secondary mb-1.5 block">{field.label}</Label>
                <div className="relative">
                  <Input id={field.id} type={showPasswords[field.id] ? 'text' : 'password'} value={passwordForm[field.key]} onChange={(e) => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })} className="bg-muted border-border rounded-xl h-11 pr-10" />
                  <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, [field.id]: !p[field.id] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary">
                    {showPasswords[field.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)} className="rounded-xl border-border">Cancel</Button>
              <Button type="submit" disabled={loading} className="rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── NOTIFICATIONS DIALOG ── */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-popover">
          <DialogHeader><DialogTitle>Notifications</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { key: 'email_purchases', title: 'Purchase emails', desc: 'When purchases are detected' },
              { key: 'email_rewards', title: 'Reward emails', desc: 'Points and rewards updates' },
              { key: 'sms_purchases', title: 'Purchase SMS', desc: 'SMS for purchase alerts' },
              { key: 'sms_rewards', title: 'Reward SMS', desc: 'SMS for reward alerts' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-[11px] text-txt-muted mt-0.5">{item.desc}</p>
                </div>
                <Switch checked={notificationPrefs[item.key]} onCheckedChange={(checked) => handleUpdateNotifications(item.key, checked)} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PRIVACY DIALOG ── */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-popover">
          <DialogHeader><DialogTitle>Privacy & Data</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { key: 'share_anonymous_data', title: 'Anonymous usage data', desc: 'Help improve Lynkr' },
              { key: 'marketing_emails', title: 'Marketing emails', desc: 'Tips and offers from Lynkr' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-[11px] text-txt-muted mt-0.5">{item.desc}</p>
                </div>
                <Switch checked={privacySettings[item.key]} onCheckedChange={(checked) => handleUpdatePrivacy(item.key, checked)} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── APPEARANCE DIALOG ── */}
      <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-popover">
          <DialogHeader><DialogTitle>Appearance</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">

            {/* Dark / Light toggle */}
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-2 block">Mode</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isDark ? <Moon className="w-4 h-4 text-txt-secondary" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span className="text-sm font-medium text-foreground">{isDark ? 'Dark mode' : 'Light mode'}</span>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Photo upload section */}
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-2 block">Profile Photo</Label>
              <div className="flex items-center gap-3">
                {resolvedPhoto ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border">
                    <img src={resolvedPhoto} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Camera className="w-5 h-5 text-txt-muted" />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="rounded-xl border-border text-xs h-9">
                    {uploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Camera className="w-3 h-3 mr-1.5" />}
                    {resolvedPhoto ? 'Change photo' : 'Upload photo'}
                  </Button>
                  {resolvedPhoto && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto} className="rounded-xl text-xs h-8 text-red-400 hover:text-red-300 hover:bg-red-500/5">
                      <X className="w-3 h-3 mr-1.5" /> Remove photo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted colors from photo */}
            {extractedPalette.length > 0 && (
              <>
                <div className="border-t border-border" />
                <div>
                  <Label className="text-xs font-bold text-txt-secondary mb-1 block">Your photo colors</Label>
                  <p className="text-[11px] text-txt-muted mb-3">Tap a color to make it your theme.</p>
                  <div className="flex gap-2.5 flex-wrap">
                    {extractedPalette.map((color, i) => (
                      <button
                        key={`photo-${i}`}
                        type="button"
                        onClick={async () => {
                          setSelectedColorIdx(i);
                          setSelectedPreset(null);
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
                          try { await api.put('/user/theme-colors', extended); } catch {}
                          toast.success('Theme applied!');
                        }}
                        className={`w-10 h-10 rounded-xl border-2 transition-all active:scale-95 ${
                          selectedColorIdx === i && !selectedPreset ? 'border-white scale-110 shadow-lg' : 'border-border hover:border-primary/30'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.hex}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-border" />

            {/* Preset gradient themes */}
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-1 block">Theme presets</Label>
              <p className="text-[11px] text-txt-muted mb-3">Unique color palettes with gradients.</p>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_THEMES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={async () => {
                      setSelectedPreset(preset.id);
                      setSelectedColorIdx(null);
                      const extended = applyPresetTheme(preset.id);
                      if (extended) {
                        try { await api.put('/user/theme-colors', extended); } catch {}
                      }
                      toast.success(`${preset.name} theme!`);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95 ${
                      selectedPreset === preset.id
                        ? 'bg-muted border-2 border-border'
                        : 'border border-border hover:border-border hover:bg-muted'
                    }`}
                  >
                    <div
                      className="w-full h-7 rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, ${preset.preview[0]}, ${preset.preview[1]}, ${preset.preview[2]})`,
                      }}
                    />
                    <span className="text-[10px] font-medium text-txt-secondary">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Avatar picker */}
            <div>
              <Label className="text-xs font-bold text-txt-secondary mb-1 block">Avatar Theme</Label>
              <p className="text-[11px] text-txt-muted mb-3">Classic avatars with matching colors.</p>
              <AvatarPicker
                value={profileForm.avatar}
                onChange={async (avatar) => {
                  setProfileForm((f) => ({ ...f, avatar }));
                  setSelectedColorIdx(null);
                  setSelectedPreset(null);
                  applyAvatarTheme(avatar);
                  try {
                    await api.put('/user/profile', { ...profileForm, avatar });
                    await api.put('/user/theme-colors', {});
                    toast.success('Avatar theme applied');
                  } catch { toast.error('Failed to save'); }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
