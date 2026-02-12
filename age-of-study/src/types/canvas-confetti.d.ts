declare module 'canvas-confetti' {
  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  export interface GlobalOptions {
    resize?: boolean;
    useWorker?: boolean;
  }

  export interface CreateTypes {
    (options?: GlobalOptions): (options?: Options) => Promise<null> | null;
    reset: () => void;
  }

  const confetti: {
    (options?: Options): Promise<null> | null;
    reset: () => void;
    create: CreateTypes;
  };

  export default confetti;
}
