import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";

// Initialize zxcvbn with common password dictionary
const options = {
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
};
zxcvbnOptions.setOptions(options);

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  feedback: string;
  isWeak: boolean;
  isCompromised: boolean;
}

/**
 * Check if password is in known breached passwords list using k-Anonymity API
 * This only sends the first 5 chars of the SHA-1 hash, so the full password is never exposed
 */
export async function checkPasswordBreach(password: string): Promise<boolean> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    
    // Use k-Anonymity: only send first 5 chars
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "Add-Padding": "true", // Adds padding to prevent response-length attacks
      },
    });
    
    if (!response.ok) {
      console.warn("Password breach check failed, continuing anyway");
      return false;
    }
    
    const text = await response.text();
    const lines = text.split("\n");
    
    for (const line of lines) {
      const [hashSuffix] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        return true; // Password found in breach database
      }
    }
    
    return false;
  } catch (error) {
    console.warn("Error checking password breach:", error);
    return false; // Fail open - allow password if API fails
  }
}

/**
 * Analyze password strength using zxcvbn
 */
export function analyzePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      feedback: "",
      isWeak: true,
      isCompromised: false,
    };
  }

  const result = zxcvbn(password);
  
  const feedbackMessages: Record<number, string> = {
    0: "รหัสผ่านอ่อนแอมาก ควรเพิ่มความซับซ้อน",
    1: "รหัสผ่านอ่อนแอ ควรเพิ่มอักขระพิเศษหรือตัวเลข",
    2: "รหัสผ่านพอใช้ได้ แต่ยังควรปรับปรุง",
    3: "รหัสผ่านดี มีความปลอดภัยเพียงพอ",
    4: "รหัสผ่านแข็งแกร่งมาก!",
  };

  return {
    score: result.score as 0 | 1 | 2 | 3 | 4,
    feedback: feedbackMessages[result.score],
    isWeak: result.score < 2,
    isCompromised: false,
  };
}

/**
 * Get color class based on password strength score
 */
export function getStrengthColor(score: number): string {
  switch (score) {
    case 0:
      return "bg-destructive";
    case 1:
      return "bg-orange-500";
    case 2:
      return "bg-yellow-500";
    case 3:
      return "bg-green-500";
    case 4:
      return "bg-emerald-500";
    default:
      return "bg-muted";
  }
}
