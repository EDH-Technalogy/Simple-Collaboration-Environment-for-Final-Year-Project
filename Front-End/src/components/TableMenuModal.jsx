import { AnimatePresence, motion } from "framer-motion";
import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useClickOutSide } from "../hook/useClickOutSide";
const ModalContext = createContext();
const variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      delay: 0.2,
      stiffness: 700,
    },
  },
  exit: {
    y: "-100vw",
    transition: {
      duration: 0.3,
      delay: 0.2,
      stiffness: 700,
    },
  },
};
export default function TableMenuModal({ children }) {
  const [openName, setOpenName] = useState("");
  const close = () => setOpenName("");
  const open = setOpenName;

  return (
    <ModalContext.Provider value={{ close, open, openName }}>
      {children}
    </ModalContext.Provider>
  );
}

function Open({ children, opens: openWindowName }) {
  const { open } = useContext(ModalContext);
  return React.cloneElement(children, {
    onClick: () => {
      open(openWindowName);
    },
  });
}

function Window({ children, name }) {
  const { openName, close } = useContext(ModalContext);
  const ref = useClickOutSide(close);

  // Handle body scroll when modal opens/closes
  React.useEffect(() => {
    if (openName === name) {
      // Don't prevent body scroll - allow page to scroll even when modal is open
      // The modal overlay won't block scrolling
    } else {
      // Ensure scroll is enabled when modal closes
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [openName, name]);

  return createPortal(
    <AnimatePresence>
      {openName === name && (
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className=" fixed inset-0  w-full flex justify-center items-center  min-h-screen bg-white/20  backdrop-blur-xs z-[99999] pointer-events-auto"
          style={{ zIndex: 99999 }}
          onClick={(e) => {
            // Close on overlay click, but not on content click
            if (e.target === e.currentTarget) {
              close();
            }
          }}
        >
          <div
            ref={ref}
            className="pointer-events-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {React.isValidElement(children)
              ? React.cloneElement(children, { close })
              : children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

TableMenuModal.Open = Open;
TableMenuModal.Window = Window;
