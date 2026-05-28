"use client";

import { appStore } from "@/app/store";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ChatModel } from "app-types/chat";
import { cn } from "lib/utils";
import {
  CheckIcon,
  ChevronDown,
  ListFilter,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
} from "lucide-react";
import { Fragment, memo, PropsWithChildren, useEffect, useState } from "react";
import { Button } from "ui/button";
import { cleanModelDisplayName } from "lib/ai/model-display-names";
import { getModelMetadata } from "lib/ai/model-metadata";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";
import { ModelProviderIcon } from "ui/model-provider-icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";

interface SelectModelProps {
  onSelect: (model: ChatModel) => void;
  align?: "start" | "end";
  currentModel?: ChatModel;
  showProvider?: boolean;
}

export const SelectModel = (props: PropsWithChildren<SelectModelProps>) => {
  const [open, setOpen] = useState(false);
  const { data: providers } = useChatModels();
  const [model, setModel] = useState(props.currentModel);
  const [filter, setFilter] = useState<"All" | "Free" | "Pro" | "Ultra">("All");
  const [hoveredModel, setHoveredModel] = useState<ChatModel | null>(null);

  useEffect(() => {
    const modelToUse = props.currentModel ?? appStore.getState().chatModel;

    if (modelToUse) {
      setModel(modelToUse);
    }
  }, [props.currentModel]);

  // Sync hovered model with the active selection when the popover opens
  useEffect(() => {
    if (open) {
      const activeModel = props.currentModel ?? appStore.getState().chatModel;
      if (activeModel) {
        setHoveredModel(activeModel);
      }
    }
  }, [open, props.currentModel]);

  const filteredProviders = providers
    ?.map((provider) => ({
      ...provider,
      models: provider.models.filter(
        (m) => filter === "All" || (m as any).tier === filter,
      ),
    }))
    .filter((p) => p.models.length > 0);

  // Find hovered model metadata
  const hoveredModelItem = providers
    ?.find((p) => p.provider === hoveredModel?.provider)
    ?.models.find((m) => m.name === hoveredModel?.model);

  const hoveredMetadata = hoveredModel
    ? getModelMetadata(
        hoveredModel.model,
        hoveredModel.provider,
        hoveredModelItem?.isToolCallUnsupported,
      )
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {props.children || (
          <Button
            variant={"secondary"}
            size={"sm"}
            className="data-[state=open]:bg-input! hover:bg-input! "
            data-testid="model-selector-button"
          >
            <div className="mr-auto flex items-center gap-1">
              {(props.showProvider ?? true) && (
                <ModelProviderIcon
                  provider={model?.provider || ""}
                  className="size-2.5 mr-1"
                />
              )}
              <p data-testid="selected-model-name">
                {model?.model ? cleanModelDisplayName(model.model) : "model"}
              </p>
            </div>
            <ChevronDown className="size-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[280px] md:w-[600px] max-w-[95vw] overflow-hidden transition-all duration-300 border border-border shadow-lg"
        align={props.align || "end"}
        data-testid="model-selector-popover"
      >
        <div className="flex h-80 divide-x divide-border">
          {/* Left Column: Model Search & Navigation List */}
          <div className="w-[280px] flex-shrink-0 flex flex-col h-full bg-popover">
            <Command
              className="rounded-none relative h-full border-none shadow-none"
              value={JSON.stringify(model)}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <CommandInput
                  placeholder="search model..."
                  data-testid="model-search-input"
                  className="pr-10"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ListFilter
                          className={cn(
                            "h-4 w-4",
                            filter !== "All" && "text-primary",
                          )}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setFilter("All")}>
                        Default (All)
                        {filter === "All" && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilter("Free")}>
                        Free Models
                        {filter === "Free" && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilter("Pro")}>
                        Pro Models
                        {filter === "Pro" && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilter("Ultra")}>
                        Ultra Models
                        {filter === "Ultra" && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CommandList className="p-2">
                <CommandEmpty>No results found.</CommandEmpty>
                {filteredProviders?.map((provider, i) => (
                  <Fragment key={provider.provider}>
                    <CommandGroup
                      heading={
                        <ProviderHeader
                          provider={provider.provider}
                          hasAPIKey={provider.hasAPIKey}
                        />
                      }
                      className={cn(
                        "pb-4 group",
                        !provider.hasAPIKey && "opacity-50",
                      )}
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                      data-testid={`model-provider-${provider.provider}`}
                    >
                      {provider.models.map((item) => (
                        <CommandItem
                          key={item.name}
                          disabled={!provider.hasAPIKey}
                          className="cursor-pointer"
                          onMouseEnter={() => {
                            setHoveredModel({
                              provider: provider.provider,
                              model: item.name,
                            });
                          }}
                          onSelect={() => {
                            setModel({
                              provider: provider.provider,
                              model: item.name,
                            });
                            props.onSelect({
                              provider: provider.provider,
                              model: item.name,
                            });
                            setOpen(false);
                          }}
                          value={cleanModelDisplayName(item.name)}
                          data-testid={`model-option-${provider.provider}-${item.name}`}
                        >
                          {model?.provider === provider.provider &&
                          model?.model === item.name ? (
                            <CheckIcon
                              className="size-3"
                              data-testid="selected-model-check"
                            />
                          ) : (
                            <div className="ml-3" />
                          )}
                          <span className="pr-2">
                            {cleanModelDisplayName(item.name)}
                          </span>
                          {(item as any).tier !== "Free" ||
                          (item as any).tier === "Free" ? (
                            <div className="relative mr-1 h-fit">
                              {(item as any).tier === "Ultra" && (
                                <div className="absolute inset-0 rounded-sm overflow-hidden p-[1px]">
                                  <div className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#00000000_50%,#ffffff_100%)] opacity-100 blur-[2px]" />
                                </div>
                              )}
                              <div
                                className={cn(
                                  "relative px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-semibold flex items-center justify-center backface-visible",
                                  (item as any).tier === "Ultra"
                                    ? "bg-background/90 backdrop-blur-xl text-foreground border border-transparent"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {(item as any).tier}
                              </div>
                            </div>
                          ) : null}
                          {item.isToolCallUnsupported && (
                            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                              No tools
                            </div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {i < filteredProviders?.length - 1 && <CommandSeparator />}
                  </Fragment>
                ))}
              </CommandList>
            </Command>
          </div>

          {/* Right Column: Premium Model Specification & Pricing details */}
          <div className="hidden md:flex flex-col w-[320px] h-full bg-muted/15 p-5 overflow-y-auto select-none">
            {hoveredModel && hoveredMetadata ? (
              <div className="flex flex-col h-full animate-[fadeIn_0.15s_ease-out]">
                {/* Header: Provider & Model ID */}
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-tight text-muted-foreground uppercase">
                  <ModelProviderIcon
                    provider={hoveredModel.provider}
                    className="size-3.5 opacity-80"
                  />
                  <span>
                    {hoveredModel.provider} /{" "}
                    {hoveredModel.model.replace(/^frenix-/, "")}
                  </span>
                </div>

                {/* Model Title */}
                <h3 className="font-semibold text-base text-foreground mt-2 tracking-tight">
                  {cleanModelDisplayName(hoveredModel.model)}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed h-[64px] overflow-y-auto custom-scrollbar">
                  {hoveredMetadata.description}
                </p>

                {/* Grid details: Context & Tools */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Context
                    </span>
                    <div className="text-base font-extrabold mt-0.5 text-foreground tracking-tight">
                      {hoveredMetadata.contextLength}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Tools
                    </span>
                    <div className="mt-1">
                      {hoveredMetadata.toolsSupported ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Supported
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          No Tools
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Costs Savings Card */}
                <div className="space-y-2 mt-auto pt-4">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 transition-colors hover:bg-muted/60">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine className="size-3.5 text-muted-foreground/80" />
                      <span className="text-xs text-muted-foreground">
                        Saving on Input
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {hoveredMetadata.inputCost}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 transition-colors hover:bg-muted/60">
                    <div className="flex items-center gap-2">
                      <ArrowUpFromLine className="size-3.5 text-muted-foreground/80" />
                      <span className="text-xs text-muted-foreground">
                        Saving on Output
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {hoveredMetadata.outputCost}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/60 p-4">
                <Info className="size-8 mb-2 opacity-40 animate-pulse" />
                <p className="text-xs">
                  Hover over a model to see its specifications and savings.
                </p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ProviderHeader = memo(function ProviderHeader({
  provider,
  hasAPIKey,
}: { provider: string; hasAPIKey: boolean }) {
  return (
    <div className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors duration-300">
      {provider === "openai" ? (
        <ModelProviderIcon
          provider="openai"
          className="size-3 text-foreground"
        />
      ) : (
        <ModelProviderIcon provider={provider} className="size-3" />
      )}
      {provider}
      {!hasAPIKey && (
        <>
          <span className="text-xs ml-auto text-muted-foreground">
            No API Key
          </span>
        </>
      )}
    </div>
  );
});
