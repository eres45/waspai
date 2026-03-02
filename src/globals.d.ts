declare module "lenis" {
  export default class Lenis {
    constructor(options?: any);
    raf(time: number): void;
    destroy(): void;
  }
}
