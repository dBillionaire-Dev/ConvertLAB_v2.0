"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calculator, ArrowLeftRight, Star, History, Settings } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { globalSearch } from "@/lib/search"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"
      const isSlash = e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA"
      if (isCmdK || isSlash) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const results = globalSearch(query)
  const go = (href: string) => {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search ConvertLAB..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {results.length > 0 ? (
          <CommandGroup heading="Results">
            {results.map((r) => (
              <CommandItem key={`${r.type}-${r.id}`} value={`${r.title} ${r.id}`} onSelect={() => go(r.href)}>
                {r.type === "calculator" ? (
                  <Calculator className="mr-2 h-4 w-4" />
                ) : (
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                )}
                <span>{r.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">{r.subtitle}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem value="favorites" onSelect={() => go("/favorites")}>
            <Star className="mr-2 h-4 w-4" /> Favorites
          </CommandItem>
          <CommandItem value="history" onSelect={() => go("/history")}>
            <History className="mr-2 h-4 w-4" /> History
          </CommandItem>
          <CommandItem value="settings" onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
