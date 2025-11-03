/**
 * Utility functions for the competition platform
 */

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  } else {
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}

/**
 * Calculate score based on submitted weight vs reference
 * @param submitted - Submitted weight value
 * @param reference - Reference (correct) weight value
 * @param tolerance - Tolerance percentage (default 5%)
 * @returns Score from 0-100
 */
export function calculateScore(submitted: number, reference: number, tolerance: number = 5): number {
  if (!submitted || !reference) return 0;
  
  const deviation = Math.abs(submitted - reference);
  const percentDeviation = (deviation / reference) * 100;
  
  // Score calculation: 100 points minus deviation percentage scaled by tolerance
  const score = Math.max(0, 100 - (percentDeviation / tolerance) * 100);
  
  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * File picker for CAD model uploads
 * @returns Promise<File|null> Selected file or null if cancelled
 */
export async function pickFile(accept: string = ".zip,.rar,.step,.iges,.sldprt,.stl,.obj,.ipt,.iam,.dwg,.dxf"): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Check file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > maxSize) {
          alert("File is too large. Maximum size is 50MB.");
          resolve(null);
          return;
        }
        resolve(file);
      } else {
        resolve(null);
      }
    };
    
    input.oncancel = () => resolve(null);
    
    input.click();
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

