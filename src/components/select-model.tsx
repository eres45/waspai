"use client";

import { appStore } from "@/app/store";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ChatModel } from "app-types/chat";
import { cn } from "lib/utils";
import { CheckIcon, ChevronDown, ListFilter } from "lucide-react";
import { Fragment, memo, PropsWithChildren, useEffect, useState } from "react";
import { Button } from "ui/button";
import { MODEL_DISPLAY_NAMES } from "lib/ai/model-display-names";

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

  useEffect(() => {
    const modelToUse = props.currentModel ?? appStore.getState().chatModel;

    if (modelToUse) {
      setModel(modelToUse);
    }
  }, [props.currentModel]);

  const filteredProviders = providers
    ?.map((provider) => ({
      ...provider,
      models: provider.models.filter(
        (m) => filter === "All" || (m as any).tier === filter,
      ),
    }))
    .filter((p) => p.models.length > 0);

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
              <p data-testid="selected-model-name">{model?.model || "model"}</p>
            </div>
            <ChevronDown className="size-3" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[280px]"
        align={props.align || "end"}
        data-testid="model-selector-popover"
      >
        <Command
          className="rounded-lg relative shadow-md h-80"
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
                      value={MODEL_DISPLAY_NAMES[item.name] || item.name}
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
                        {MODEL_DISPLAY_NAMES[item.name] || item.name}
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
