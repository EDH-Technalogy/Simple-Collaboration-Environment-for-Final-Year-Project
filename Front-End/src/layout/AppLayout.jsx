import { SidebarProvider } from "../context/SidebarContext";
import LayoutContent from "./LayoutContent";
import AppSidebar from "./AppSideBar";

/** @param {{ children?: import("react").ReactNode }} props */
export default function Applayout({ children }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
