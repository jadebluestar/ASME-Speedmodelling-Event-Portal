import { motion, AnimatePresence } from "motion/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Trophy, Medal } from "lucide-react";
import { useEffect, useState } from "react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  weightSubmitted: number;
  score: number;
  time: string;
  isNew?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export function Leaderboard({ entries }: LeaderboardProps) {
  const [highlightedRows, setHighlightedRows] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    const newEntries = entries.filter(e => e.isNew).map(e => e.rank);
    if (newEntries.length > 0) {
      setHighlightedRows(new Set(newEntries));
      const timer = setTimeout(() => {
        setHighlightedRows(new Set());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [entries]);
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return null;
  };
  
  const getRankBackground = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400/10 to-yellow-600/10";
    if (rank === 2) return "bg-gradient-to-r from-gray-400/10 to-gray-600/10";
    if (rank === 3) return "bg-gradient-to-r from-amber-700/10 to-amber-900/10";
    return "";
  };

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/30 bg-primary/10 hover:bg-primary/10">
              <TableHead className="text-primary">Rank</TableHead>
              <TableHead className="text-primary">Name</TableHead>
              <TableHead className="text-primary">Weight Submitted (kg)</TableHead>
              <TableHead className="text-primary">Score</TableHead>
              <TableHead className="text-primary">Submission Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-muted-foreground"
                    >
                      Waiting for submissions...
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <motion.tr
                    key={entry.rank}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      backgroundColor: highlightedRows.has(entry.rank) 
                        ? "rgba(0, 196, 204, 0.2)" 
                        : "transparent"
                    }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      duration: 0.3,
                      backgroundColor: { duration: 0.5 }
                    }}
                    className={`border-border/50 hover:bg-muted/50 transition-colors ${getRankBackground(entry.rank)}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                        <motion.span
                          key={entry.rank}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          {entry.rank}
                        </motion.span>
                      </div>
                    </TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>
                      <motion.span
                        key={entry.weightSubmitted}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        {entry.weightSubmitted.toFixed(2)}
                      </motion.span>
                    </TableCell>
                    <TableCell>
                      <motion.span
                        key={entry.score}
                        initial={{ scale: 1.2, color: "#00C4CC" }}
                        animate={{ scale: 1, color: "#ffffff" }}
                        transition={{ duration: 0.5 }}
                        className="font-mono"
                      >
                        {entry.score}
                      </motion.span>
                    </TableCell>
                    <TableCell className="font-mono">{entry.time}</TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
