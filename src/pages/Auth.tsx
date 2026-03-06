import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Package, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, signIn } = useAuth();

  useEffect(() => {
    setIsSignUp(searchParams.get("mode") === "signup");
  }, [searchParams]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(
        "Password reset email sent! Please check your SPAM FOLDER if you don't see it in your inbox."
      );
      setIsForgotPassword(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, username);
        toast.success(
          "Account created! Please check your SPAM FOLDER for a verification email."
        );
      } else {
        await signIn(email, password);
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        if (!user?.email_confirmed_at) {
          await supabase.auth.signOut();
          toast.error("Please verify your email before signing in. Check your inbox for the verification link.");
          return;
        }

        toast.success("Logged in successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-center bg-cover p-4"
      style={{ backgroundImage: "url(/bg-gradient.png)" }}
    >
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="liquidGlassFilter">
            <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2" result="turbulence" />
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="15" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="w-full max-w-md space-y-8">
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </div>
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Management System</h1>
          <p className="text-sm text-muted-foreground mt-1">Track, manage, and report</p>
        </div>

        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="glass rounded-2xl p-8 space-y-5">
            <h2 className="text-xl font-semibold text-center">Reset Password</h2>
            <p className="text-sm text-muted-foreground text-center">Enter your email to receive a reset link</p>
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <Input id="resetEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@school.edu" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Sending..." : "Send Reset Link"}</Button>
            <p className="text-center text-sm text-muted-foreground">
              <button type="button" className="text-primary font-medium hover:underline" onClick={() => setIsForgotPassword(false)}>Back to Sign In</button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
            <h2 className="text-xl font-semibold text-center">
              {isSignUp ? "Create Account" : "Sign In"}
            </h2>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required={isSignUp} placeholder="Your username" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@school.edu" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="text-right">
                <button type="button" className="text-sm text-primary hover:underline" onClick={() => setIsForgotPassword(true)}>
                  Forgot Password?
                </button>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button type="button" className="text-primary font-medium hover:underline" onClick={() => { setIsSignUp(!isSignUp); setConfirmPassword(""); }}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          © All rights reserved. 2026. Golden Key Integrated School of St. Joseph
        </p>
      </div>
    </div>
  );
}
