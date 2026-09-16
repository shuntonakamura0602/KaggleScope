import Link from "next/link";
import { BarChart3, Home, Scale, Shapes } from "lucide-react";
import { Brand } from "@/components/layout/brand";

const navigation = [
  { label: "Home", href: "/", icon: Home },
  { label: "Rankings", href: "/rankings/overall", icon: BarChart3 },
  {
    label: "Specialties",
    href: "/specialties/computer-vision",
    icon: Shapes,
  },
  { label: "Compare", href: "/compare", icon: Scale },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/75 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10">
        <Brand />
        <nav aria-label="Primary navigation">
          <ul className="flex items-center gap-1">
            {navigation.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
