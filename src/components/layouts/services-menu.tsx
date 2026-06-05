"use client";

import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from "ui/dropdown-menu";
import {
  LifeBuoyIcon,
  TruckIcon,
  CreditCardIcon,
  Briefcase,
  FileText,
  Shield,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
// import { useTranslations } from "next-intl";

export function ServicesMenu() {
  //   const t = useTranslations("Layout"); // Using Layout namespace for consistency, or general

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className="flex items-center cursor-pointer"
        icon={<ChevronRight className="size-4 ml-2" />}
      >
        <Briefcase className="mr-2 size-4" />
        <span className="mr-auto">Learn more</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-56">
          <DropdownMenuLabel className="text-muted-foreground text-xs uppercase tracking-wider">
            Company
          </DropdownMenuLabel>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/contact" className="w-full flex items-center gap-2">
              <LifeBuoyIcon className="size-4 text-muted-foreground" />
              <span>Contact Us</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/shipping" className="w-full flex items-center gap-2">
              <TruckIcon className="size-4 text-muted-foreground" />
              <span>Shipping Policy</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/refund" className="w-full flex items-center gap-2">
              <CreditCardIcon className="size-4 text-muted-foreground" />
              <span>Refund Policy</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/privacy">
              <Shield className="mr-2 size-4 text-muted-foreground" />
              <span>Privacy Policy</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/terms">
              <FileText className="mr-2 size-4 text-muted-foreground" />
              <span>Terms of Service</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
