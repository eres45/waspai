"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Circle, Loader2 } from "lucide-react";
import { memo, useMemo } from "react";
import { TextShimmer } from "ui/text-shimmer";

export interface TodoItem {
  id?: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

interface TodoCardProps {
  todos: TodoItem[];
  isExecuting?: boolean;
}

const StatusIcon = memo(function StatusIcon({
  status,
}: {
  status: TodoItem["status"];
}) {
  if (status === "completed") {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="flex items-center justify-center size-5 rounded-full bg-primary/15 border border-primary/40 shrink-0"
      >
        <Check className="size-3 text-primary" strokeWidth={2.5} />
      </motion.div>
    );
  }

  if (status === "in_progress") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center size-5 shrink-0"
      >
        <Loader2 className="size-4 text-primary animate-spin" />
      </motion.div>
    );
  }

  // pending
  return (
    <div className="flex items-center justify-center size-5 shrink-0">
      <Circle className="size-4 text-muted-foreground/40" />
    </div>
  );
});

const TodoRow = memo(function TodoRow({
  todo,
  index,
}: {
  todo: TodoItem;
  index: number;
}) {
  const isPending = todo.status === "pending";
  const isInProgress = todo.status === "in_progress";
  const isCompleted = todo.status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={cn(
        "flex items-start gap-2.5 py-1.5 px-1 rounded-lg transition-colors duration-200",
        isInProgress && "bg-primary/5",
      )}
    >
      <div className="flex items-center gap-1.5 mt-0.5">
        <span
          className={cn(
            "text-[10px] font-mono w-4 text-right shrink-0 select-none",
            isCompleted && "text-muted-foreground/30",
            isInProgress && "text-primary/60",
            isPending && "text-muted-foreground/30",
          )}
        >
          {index + 1}
        </span>
        <StatusIcon status={todo.status} />
      </div>

      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        {isInProgress ? (
          <TextShimmer
            className="text-sm font-medium leading-snug"
            duration={1.5}
          >
            {todo.content}
          </TextShimmer>
        ) : (
          <span
            className={cn(
              "text-sm leading-snug transition-all duration-300",
              isCompleted &&
                "line-through text-muted-foreground/50 decoration-muted-foreground/30",
              isPending && "text-muted-foreground/60",
            )}
          >
            {todo.content}
          </span>
        )}

        <AnimatePresence>
          {isInProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TextShimmer
                className="text-[11px] text-muted-foreground"
                duration={2}
              >
                Working...
              </TextShimmer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export const TodoCard = memo(function TodoCard({
  todos,
  isExecuting,
}: TodoCardProps) {
  const completedCount = useMemo(
    () => todos.filter((t) => t.status === "completed").length,
    [todos],
  );

  const hasInProgress = useMemo(
    () => todos.some((t) => t.status === "in_progress"),
    [todos],
  );

  const total = todos.length;
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0;

  const isActive = isExecuting || hasInProgress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative w-full max-w-2xl rounded-xl border border-border/70",
        "bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden",
        "my-1 fade-in animate-in duration-200",
      )}
    >
      {/* Progress bar at top */}
      <div className="h-0.5 w-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full bg-primary/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 className="size-3.5 text-primary animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="size-3.5 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>

        <span className="text-xs font-semibold text-foreground tracking-wide">
          Plan
        </span>

        <span className="text-xs text-muted-foreground font-mono">
          ({completedCount}/{total})
        </span>

        <div className="flex-1" />

        {completedCount === total && total > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-primary/70 font-medium"
          >
            All done
          </motion.span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/40 mx-3.5" />

      {/* Todo rows */}
      <div className="flex flex-col gap-0 px-2.5 py-2">
        <AnimatePresence initial={false}>
          {todos.map((todo, idx) => (
            <TodoRow key={todo.id ?? todo.content} todo={todo} index={idx} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
