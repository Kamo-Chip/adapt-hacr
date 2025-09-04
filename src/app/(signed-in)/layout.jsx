import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="w-full h-[100vh] overflow-y-auto">
        <main className="flex-1">{children}</main>
        <Toaster position="top-right" />
      </div>


    </SidebarProvider>
  );
}
