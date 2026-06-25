"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Definimos el media query para el breakpoint móvil
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Función manejadora para actualizar el estado
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // Inicializamos el estado actual
    setIsMobile(mql.matches);

    // Escuchamos los cambios
    mql.addEventListener("change", onChange);

    // Limpieza al desmontar
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}