import { AbstractRTIndicator } from "@qtsurfer/indicators";

/**
 * One output of a pro indicator that has several (the Kijun-sen of an Ichimoku, the plus DI of an
 * ADX), registered by name beside the indicator itself. It keeps no state: it reads the output from
 * its owner, which the group updates, so an update fed to this view changes nothing.
 */
export class ProOutput extends AbstractRTIndicator {
  constructor(
    private readonly output: () => number,
    private readonly ready: () => boolean,
  ) {
    super();
  }

  override getValue(): number {
    return this.output();
  }

  override update(_newValue: number): number {
    return this.getValue();
  }

  override isReady(): boolean {
    return this.ready();
  }

  /** Nothing to reset: the owner resets, and the view reads it. */
  override reset(): void {}
}
