import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Upload, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, fetchProfile, updateProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  const [schoolName, setSchoolName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) fetchProfile(user.id);
  }, [user]);

  useEffect(() => {
    if (profile) {
      setSchoolName(profile.school_name || "");
      setProfileImage(profile.profile_image || "");
      setUsername(profile.username || "");
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setProfileImage(urlData.publicUrl);
    toast.success("Image uploaded!");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        school_name: schoolName,
        profile_image: profileImage,
      });

      const { error: usernameErr } = await supabase.from("profiles").update({ username }).eq("user_id", user.id);
      if (usernameErr) throw usernameErr;

      if (newPassword.trim()) {
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
        if (pwErr) throw pwErr;
        setNewPassword("");
      }

      toast.success("Settings saved!");
      fetchProfile(user.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_user" as any);
      if (error) throw error;
      await signOut();
      toast.success("Account deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  const themes: { value: "default" | "light" | "dark"; label: string; colors: string[] }[] = [
    { value: "default", label: "Default", colors: ["#fcea21", "#005600"] },
    { value: "light", label: "Light Mode", colors: ["#ffffff", "#d4d4d4", "#000000"] },
    { value: "dark", label: "Dark Mode", colors: ["#111827", "#404040", "#ffffff"] },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Customize branding and account</p>
      </div>

      {/* Profile Image */}
      <div className="glass rounded-2xl p-8 space-y-5">
        <h3 className="font-semibold">Profile Image</h3>
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profileImage || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {username?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Upload from your device</p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="glass rounded-2xl p-8 space-y-5">
        <h3 className="font-semibold">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Input id="schoolName" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School Name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input id="newPassword" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" className="pr-10" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Theme */}
      <div className="glass rounded-2xl p-8 space-y-5">
        <h3 className="font-semibold">Theme Color</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                theme === t.value ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex gap-2 mb-3">
                {t.colors.map((c, i) => (
                  <div key={i} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-sm font-medium">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl p-8 space-y-4">
        <div>
          <h3 className="font-semibold text-destructive">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Delete your account and all associated data.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and all related data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
