import { useSidebar } from "../context/SideBarContext";

const Backdrop = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50  dark:bg-gray-950/80 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
