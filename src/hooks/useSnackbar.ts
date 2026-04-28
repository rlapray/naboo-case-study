import { useContext } from "react";
import { SnackbarContext } from "@/contexts/snackbarContext";

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  return context;
}
