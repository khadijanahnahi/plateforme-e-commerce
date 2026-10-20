import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function useMegaMenu() {
  const location = useLocation();
  const rootRef = useRef(null);
  const triggerRefs = useRef(new Map());
  const [openMenu, setOpenMenu] = useState(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    const previousMenu = openMenu;
    setOpenMenu(null);
    if (restoreFocus && previousMenu) {
      window.requestAnimationFrame(() => triggerRefs.current.get(previousMenu)?.focus());
    }
  }, [openMenu]);

  const toggleMenu = useCallback((menuId, trigger) => {
    if (trigger) triggerRefs.current.set(menuId, trigger);
    setOpenMenu((current) => (current === menuId ? null : menuId));
  }, []);

  const openMenuFromKeyboard = useCallback((menuId, trigger) => {
    if (trigger) triggerRefs.current.set(menuId, trigger);
    setOpenMenu(menuId);
    window.requestAnimationFrame(() => {
      rootRef.current?.querySelector(`#client-mega-${menuId} a`)?.focus();
    });
  }, []);

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (openMenu && !rootRef.current?.contains(event.target)) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && openMenu) {
        event.preventDefault();
        closeMenu(true);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, openMenu]);

  return {
    closeMenu,
    openMenu,
    openMenuFromKeyboard,
    rootRef,
    toggleMenu,
  };
}

