"use client";

import { appStore } from "@/app/store";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ChatModel } from "app-types/chat";
import { cn } from "lib/utils";
import { CheckIcon, ChevronDown } from "lucide-react";
import { Fragment, memo, PropsWithChildren, useEffect, useState } from "react";
import { Button } from "ui/button";

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

  useEffect(() => {
    const modelToUse = props.currentModel ?? appStore.getState().chatModel;

    if (modelToUse) {
      setModel(modelToUse);
    }
  }, [props.currentModel]);

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
          <CommandInput
            placeholder="search model..."
            data-testid="model-search-input"
          />
          <CommandList className="p-2">
            <CommandEmpty>No results found.</CommandEmpty>
            {providers?.map((provider, i) => (
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
                      value={item.name}
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
                      <span className="pr-2">{item.name}</span>
                      <div className="ml-auto flex items-center gap-1">
                        {item.isUltra && (
                          <div className="bg-primary/20 px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-bold text-primary h-fit">
                            ULTRA
                          </div>
                        )}
                        {item.isPro && !item.isUltra && (
                          <div className="bg-muted px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-semibold text-muted-foreground h-fit">
                            PRO
                          </div>
                        )}
                        {item.isFree && (
                          <div className="bg-green-500/20 px-1.5 py-0.5 rounded-sm text-[10px] uppercase font-bold text-green-600 dark:text-green-400 h-fit">
                            FREE
                          </div>
                        )}
                        {item.isToolCallUnsupported && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium italic">
                            No tools
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {i < providers?.length - 1 && <CommandSeparator />}
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
