import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Element keys that demo steps can spotlight. */
export type HighlightKey =
  | "kpi-breaches"
  | "pipeline-chips"
  | "proposal-header"
  | "document-repository"
  | "calculator-breakdown";

interface DemoContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  activeStep: number | null;
  setActiveStep: (i: number | null) => void;
  highlight: HighlightKey | null;
  spotlight: (key: HighlightKey) => void;
  /** Increments to ask the document repository to expand + re-verify. */
  verifySignal: number;
  requestVerify: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<HighlightKey | null>(null);
  const [verifySignal, setVerifySignal] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spotlight = useCallback((key: HighlightKey) => {
    setHighlight(key);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHighlight(null), 2600);
  }, []);

  const requestVerify = useCallback(() => setVerifySignal((n) => n + 1), []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      activeStep,
      setActiveStep,
      highlight,
      spotlight,
      verifySignal,
      requestVerify,
    }),
    [open, activeStep, highlight, spotlight, verifySignal, requestVerify],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}

/** Returns the spotlight class when the given key is active. */
export function useSpotlight(key: HighlightKey) {
  const { highlight } = useDemo();
  return highlight === key ? "demo-spotlight" : "";
}
