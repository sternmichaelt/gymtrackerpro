"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useColorTheme } from "@/components/color-theme-provider";
import { createClient } from "@/lib/supabase/client";
import { COLOR_THEMES } from "@/lib/constants/color-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, ready: colorThemeReady } = useColorTheme();

  useEffect(() => {
    setThemeReady(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setFullName(user.user_metadata?.full_name ?? "");
      }
    });
    supabase
      .from("profiles")
      .select("full_name")
      .single()
      .then(({ data }) => {
        if (data?.full_name) setFullName(data.full_name);
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated");
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Weight Unit</Label>
            <Input value="Pounds (lbs)" disabled />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                disabled={!themeReady}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                disabled={!themeReady}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Button Color</Label>
            <p className="text-xs text-muted-foreground">
              Pick an accent color for buttons and highlights.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLOR_THEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={!colorThemeReady}
                  onClick={() => setColorTheme(item.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    colorTheme === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: item.swatch }}
                  />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Install GymTrack Pro to your home screen for the best gym experience.
          </p>
          <Button asChild variant="outline">
            <a href="/exercises">Browse Exercises</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/history">View History</a>
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
