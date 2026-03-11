import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, Lock, Bell, Shield, Trash2, Mail, Loader2 } from 'lucide-react';
import api from '@/utils/api';
import AppAvatar from '@/components/Avatar';
import AvatarPicker from '@/components/AvatarPicker';
import UsernameInput from '@/components/UsernameInput';
import { DEFAULT_AVATAR } from '@/constants/avatars';
import BrandLoader from '@/components/BrandLoader';
import { applyAvatarTheme } from '@/utils/avatarTheme';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profileUsernameValid, setProfileUsernameValid] = useState(true);
  
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    avatar: DEFAULT_AVATAR,
    phone: '',
    dob: '',
    gender: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_purchases: true,
    email_rewards: true,
    sms_purchases: false,
    sms_rewards: false
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    share_anonymous_data: true,
    marketing_emails: false
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/user/me');
      setUser(response.data);
      setProfileForm({
        full_name: response.data.full_name,
        username: response.data.username || '',
        avatar: response.data.avatar || DEFAULT_AVATAR,
        phone: response.data.phone,
        dob: response.data.dob,
        gender: response.data.gender
      });
      applyAvatarTheme(response.data.avatar || DEFAULT_AVATAR);
      setNotificationPrefs(response.data.notification_preferences || notificationPrefs);
      setPrivacySettings(response.data.privacy_settings || privacySettings);
    } catch (error) {
      toast.error('Failed to load user data');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/user/profile', profileForm);
      toast.success('Profile updated successfully');
      await fetchUserData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/user/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      await api.put('/user/notification-preferences', notificationPrefs);
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  const handleUpdatePrivacy = async () => {
    try {
      await api.put('/user/privacy-settings', privacySettings);
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleResendVerification = async () => {
    try {
      await api.post('/auth/resend-verification');
      toast.success('Verification email sent');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete('/user/account');
      toast.success('Account deleted');
      logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  if (!user) {
    return <BrandLoader label="Loading your profile..." />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold font-heading mb-8">Settings</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList
            data-testid="settings-tabs"
            className="mb-8 grid h-auto w-full grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-[#131722] p-1.5 md:grid-cols-4"
          >
            <TabsTrigger
              data-testid="profile-tab"
              value="profile"
              className="w-full rounded-xl min-h-11 text-sm font-medium text-[#97A0AF] data-[state=active]:bg-[#0C1018] data-[state=active]:text-[#E7ECF5] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              data-testid="security-tab"
              value="security"
              className="w-full rounded-xl min-h-11 text-sm font-medium text-[#97A0AF] data-[state=active]:bg-[#0C1018] data-[state=active]:text-[#E7ECF5] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]"
            >
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              data-testid="notifications-tab"
              value="notifications"
              className="w-full rounded-xl min-h-11 text-sm font-medium text-[#97A0AF] data-[state=active]:bg-[#0C1018] data-[state=active]:text-[#E7ECF5] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              data-testid="privacy-tab"
              value="privacy"
              className="w-full rounded-xl min-h-11 text-sm font-medium text-[#97A0AF] data-[state=active]:bg-[#0C1018] data-[state=active]:text-[#E7ECF5] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]"
            >
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div data-testid="profile-settings" className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
              <h2 className="text-2xl font-bold font-heading mb-6">Profile Information</h2>

              <div className="mb-6 rounded-2xl border border-white/10 bg-secondary/20 p-4">
                <div className="flex items-center gap-4">
                  <AppAvatar avatar={profileForm.avatar} username={profileForm.username} className="h-16 w-16" />
                  <div>
                    <p className="font-semibold text-lg">{profileForm.username || user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-primary mt-1">{user.points} points</p>
                  </div>
                </div>
              </div>
              
              {!user.email_verified && (
                <div data-testid="email-verification-banner" className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="font-semibold text-yellow-500">Email not verified</p>
                        <p className="text-sm text-muted-foreground">Please verify your email address</p>
                      </div>
                    </div>
                    <Button
                      data-testid="resend-verification-button"
                      onClick={handleResendVerification}
                      variant="outline"
                      className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 rounded-full"
                    >
                      Resend Email
                    </Button>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <UsernameInput
                  value={profileForm.username}
                  onChange={(username) => setProfileForm({ ...profileForm, username })}
                  onValidityChange={setProfileUsernameValid}
                  currentUsername={user.username}
                />
                <div>
                  <Label className="text-sm font-medium mb-2 block">Avatar</Label>
                  <AvatarPicker
                    value={profileForm.avatar}
                    onChange={(avatar) => setProfileForm({ ...profileForm, avatar })}
                  />
                </div>
                <div>
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    data-testid="profile-name-input"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="bg-secondary/50 border-white/10 rounded-xl h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    data-testid="profile-phone-input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="bg-secondary/50 border-white/10 rounded-xl h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={profileForm.dob}
                      onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                      className="bg-secondary/50 border-white/10 rounded-xl h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full bg-secondary/50 border border-white/10 rounded-xl h-12 px-4 text-foreground"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <Button
                  data-testid="save-profile-button"
                  type="submit"
                  disabled={loading || !profileUsernameValid}
                  className="w-full sm:w-auto min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
              <h2 className="text-2xl font-bold font-heading mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    data-testid="current-password-input"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="bg-secondary/50 border-white/10 rounded-xl h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    data-testid="new-password-input"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="bg-secondary/50 border-white/10 rounded-xl h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    data-testid="confirm-password-input"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="bg-secondary/50 border-white/10 rounded-xl h-12"
                  />
                </div>
                <Button
                  data-testid="change-password-button"
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto min-h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Change Password'}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
              <h2 className="text-2xl font-bold font-heading mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email - Purchase Updates</p>
                    <p className="text-sm text-muted-foreground">Get notified when purchases are detected</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_purchases}
                    onCheckedChange={(checked) => {
                      setNotificationPrefs({ ...notificationPrefs, email_purchases: checked });
                      handleUpdateNotifications();
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email - Reward Updates</p>
                    <p className="text-sm text-muted-foreground">Get notified about points and rewards</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_rewards}
                    onCheckedChange={(checked) => {
                      setNotificationPrefs({ ...notificationPrefs, email_rewards: checked });
                      handleUpdateNotifications();
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS - Purchase Updates</p>
                    <p className="text-sm text-muted-foreground">Receive SMS for purchase alerts</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.sms_purchases}
                    onCheckedChange={(checked) => {
                      setNotificationPrefs({ ...notificationPrefs, sms_purchases: checked });
                      handleUpdateNotifications();
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS - Reward Updates</p>
                    <p className="text-sm text-muted-foreground">Receive SMS for reward alerts</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.sms_rewards}
                    onCheckedChange={(checked) => {
                      setNotificationPrefs({ ...notificationPrefs, sms_rewards: checked });
                      handleUpdateNotifications();
                    }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="bg-card text-card-foreground rounded-3xl border border-white/5 shadow-2xl p-8">
              <h2 className="text-2xl font-bold font-heading mb-6">Privacy Settings</h2>
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Share Anonymous Data</p>
                    <p className="text-sm text-muted-foreground">Help improve Lynkr with anonymous usage data</p>
                  </div>
                  <Switch
                    checked={privacySettings.share_anonymous_data}
                    onCheckedChange={(checked) => {
                      setPrivacySettings({ ...privacySettings, share_anonymous_data: checked });
                      handleUpdatePrivacy();
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">Receive tips and offers from Lynkr</p>
                  </div>
                  <Switch
                    checked={privacySettings.marketing_emails}
                    onCheckedChange={(checked) => {
                      setPrivacySettings({ ...privacySettings, marketing_emails: checked });
                      handleUpdatePrivacy();
                    }}
                  />
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold mb-4 text-red-500">Danger Zone</h3>
                <Button
                  data-testid="delete-account-button"
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  className="w-full sm:w-auto min-h-11 rounded-full px-6 py-3"
                >
                  <Trash2 className="mr-2 w-4 h-4" />
                  Delete Account
                </Button>
                <p className="text-sm text-muted-foreground mt-2">This will permanently delete your account and all data.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;