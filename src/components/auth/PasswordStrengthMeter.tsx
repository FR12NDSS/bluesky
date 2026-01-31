import { useEffect, useState } from "react";
import { analyzePasswordStrength, getStrengthColor, type PasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  isBreached?: boolean;
  checkingBreach?: boolean;
  showFeedback?: boolean;
}

export function PasswordStrengthMeter({
  password,
  isBreached = false,
  checkingBreach = false,
  showFeedback = true,
}: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (password) {
      const result = analyzePasswordStrength(password);
      setStrength(result);
    } else {
      setStrength(null);
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              strength && i <= strength.score
                ? isBreached
                  ? "bg-destructive"
                  : getStrengthColor(strength.score)
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className="space-y-1">
          {checkingBreach && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="animate-pulse">กำลังตรวจสอบความปลอดภัย...</span>
            </p>
          )}

          {isBreached && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              รหัสผ่านนี้เคยรั่วไหลจากการโจมตีข้อมูล กรุณาใช้รหัสผ่านอื่น
            </p>
          )}

          {!isBreached && strength && (
            <p
              className={cn(
                "text-xs flex items-center gap-1",
                strength.score >= 3 ? "text-green-600" : strength.score >= 2 ? "text-yellow-600" : "text-destructive"
              )}
            >
              {strength.score >= 3 ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {strength.feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
