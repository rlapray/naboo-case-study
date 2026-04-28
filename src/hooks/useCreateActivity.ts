import { useRef, useState } from "react";
import { api } from "@/services/api";
import type { CreateActivityInput } from "@/types/activity";

export interface UseCreateActivityResult {
  isLoading: boolean;
  /** Returns true when the call was actually issued, false when guarded out. */
  submit: (values: CreateActivityInput) => Promise<boolean>;
}

interface Options {
  onSuccess: () => void;
  onError: (err: unknown) => void;
}

export function useCreateActivity({ onSuccess, onError }: Options): UseCreateActivityResult {
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);

  const submit = async (values: CreateActivityInput): Promise<boolean> => {
    if (submittingRef.current) return false;
    submittingRef.current = true;
    setIsLoading(true);
    try {
      await api.createActivity({ ...values, price: Number(values.price) });
      onSuccess();
      return true;
    } catch (err) {
      onError(err);
      return false;
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return { isLoading, submit };
}
