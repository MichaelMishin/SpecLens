declare module 'openapi-sampler' {
  interface SampleOptions {
    skipReadOnly?: boolean;
    skipWriteOnly?: boolean;
    skipNonRequired?: boolean;
    quiet?: boolean;
  }

  export function sample(schema: Record<string, unknown>, options?: SampleOptions, spec?: object): unknown;
}
