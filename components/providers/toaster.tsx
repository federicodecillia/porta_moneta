"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      duration={3000}
      visibleToasts={3}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center justify-center w-full max-w-[90vw] mx-auto px-6 py-3 rounded-full font-medium text-sm text-white bg-brand-near-black shadow-[0_4px_16px_rgba(45,43,41,0.2)]",
          success: "bg-brand-near-black",
          warning: "bg-[#b45309]",
          error: "bg-brand-red",
          info: "bg-brand-near-black",
        },
      }}
    />
  );
}
