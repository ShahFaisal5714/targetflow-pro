import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { MobileNavProvider, useMobileNav } from './MobileNavContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface MainLayoutProps {
  children: ReactNode;
}

function MobileSidebar() {
  const { open, setOpen } = useMobileNav();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        <Sidebar variant="mobile" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <MobileSidebar />
        <main className="lg:pl-64 transition-all duration-300 min-w-0">
          {children}
        </main>
      </div>
    </MobileNavProvider>
  );
}
