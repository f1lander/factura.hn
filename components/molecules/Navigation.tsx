"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, CircleUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import supabaseClient from "@/lib/supabase/client";
import { User } from "@supabase/auth-js";
import { logout } from "@/lib/supabase/auth";
import { useIsLoadedStore } from "@/store/isLoadedStore";
import { useCompanyStore } from "@/store/companyStore";
import { useCustomersStore } from "@/store/customersStore";
import { useInvoicesStore } from "@/store/invoicesStore";
import { useProductsStore } from "@/store/productsStore";
import { FacturaLogo } from "../atoms/FacturaLogo";

const navItems = [
  { href: "/home/", label: "Dashboard" },
  { href: "/home/invoices", label: "Facturas" },
  { href: "/home/products-v2", label: "Productos" },
  { href: "/home/customers", label: "Clientes" },
  { href: "/home/settings", label: "Configuracion" },
];

export function Navigation() {
  const { resetCompany } = useCompanyStore();
  const { resetCustomers } = useCustomersStore();
  const { resetInvoices } = useInvoicesStore();
  const { resetIsLoaded } = useIsLoadedStore();
  const { resetProducts } = useProductsStore();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = supabaseClient();
  let nameToBeDisplayed: string = "";
  if (user !== null) {
    if (user.user_metadata.full_name !== undefined) {
      nameToBeDisplayed = user.user_metadata.full_name;
    } else {
      nameToBeDisplayed = user.email!;
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setUser(session?.user ?? null);
        setIsLoading(false);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    resetProducts();
    resetIsLoaded();
    resetInvoices();
    resetCustomers();
    resetCompany();
    setIsLoading(true);
    await logout();
    setUser(null);
    setIsLoading(false);
  };

  return (
    <header className="sticky flex flex-col top-0 z-50">
      <div className="flex top-0 h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg items-end font-medium lg:flex lg:flex-row md:gap-5 lg:text-sm lg:gap-6 z-50">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <FacturaLogo />
          </Link>

          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground",
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 lg:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <FacturaLogo />
              </Link>
              {navItems.map((item, index) => (
                <SheetClose asChild key={index}>
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "hover:text-foreground",
                      pathname === item.href
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </a>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="profile-menu flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
          {isLoading ? (
            <p>Cargando...</p>
          ) : user ? (
            <>
              <p className="font-medium">Bienvenido, {nameToBeDisplayed}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                  >
                    {user.user_metadata.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <CircleUser className="h-5 w-5" />
                    )}
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/home/settings">Mi cuenta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth/login" className="btn btn-ghost sign-in-btn">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
