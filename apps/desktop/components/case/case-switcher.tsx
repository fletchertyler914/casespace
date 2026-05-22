"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import type { CaseSummary } from "@repo/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { commandClient } from "@/lib/command-client";
import { cn } from "@/lib/utils";

interface CaseSwitcherProps {
  currentCaseId: string;
  currentCaseName: string;
  className?: string;
}

export function CaseSwitcher({
  currentCaseId,
  currentCaseName,
  className,
}: CaseSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCases = useCallback(async () => {
    setLoading(true);
    const res = await commandClient.listCases();
    if (res.ok && res.data) {
      setCases(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) void loadCases();
  }, [open, loadCases]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 max-w-[220px] justify-between gap-1 px-2", className)}
          aria-label="Switch case"
        >
          <span className="truncate text-sm font-medium">{currentCaseName}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search cases…" className="h-9" />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading cases…" : "No cases found."}
            </CommandEmpty>
            <CommandGroup>
              {cases.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.id}`}
                  onSelect={() => {
                    setOpen(false);
                    if (c.id !== currentCaseId) {
                      router.push(`/case?id=${encodeURIComponent(c.id)}`);
                    }
                  }}
                >
                  <span
                    className={cn(
                      "truncate",
                      c.id === currentCaseId && "font-semibold text-primary",
                    )}
                  >
                    {c.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
