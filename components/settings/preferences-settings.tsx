"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

export function PreferencesSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how RevuIntel looks on your device.
        </p>
      </div>

      <div className="space-y-4">
        <Label>Theme</Label>
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as any)}
        >
          <div className="flex items-center space-x-3 rounded-md border p-4 hover:bg-accent">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light" className="flex-1 cursor-pointer">
              <div className="flex items-center space-x-3">
                <Sun className="h-5 w-5" />
                <div>
                  <p className="font-medium">Light Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Traditional light background with dark text
                  </p>
                </div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-md border p-4 hover:bg-accent">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark" className="flex-1 cursor-pointer">
              <div className="flex items-center space-x-3">
                <Moon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Easy on the eyes with a dark background
                  </p>
                </div>
              </div>
            </Label>
          </div>

          <div className="flex items-center space-x-3 rounded-md border p-4 hover:bg-accent">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system" className="flex-1 cursor-pointer">
              <div className="flex items-center space-x-3">
                <Monitor className="h-5 w-5" />
                <div>
                  <p className="font-medium">System Default</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically match your device's theme
                  </p>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
