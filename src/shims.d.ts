declare module 'p-limit' {
  type LimitFunction = <T>(fn: () => Promise<T>) => Promise<T>;
  export default function pLimit(concurrency: number): LimitFunction;
}


