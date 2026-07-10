import { useEffect, useRef } from "react";
import { useToast } from "./useToast";

export default function useFeedbackToast(message, error) {
  const toast = useToast();
  const previousMessage = useRef("");
  const previousError = useRef("");

  useEffect(() => {
    if (!message) {
      previousMessage.current = "";
      return;
    }
    if (message !== previousMessage.current) {
      toast.success(message);
      previousMessage.current = message;
    }
  }, [message, toast]);

  useEffect(() => {
    if (!error) {
      previousError.current = "";
      return;
    }
    if (error !== previousError.current) {
      toast.error(error);
      previousError.current = error;
    }
  }, [error, toast]);
}
