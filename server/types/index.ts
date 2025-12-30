declare module 'h3' {
  interface H3EventContext {
    user?: {
      userId: string;
      email: string | null;
    };
  }
}

export {};
