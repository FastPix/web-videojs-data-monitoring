// The published @fastpix/videojs-monitor build ships JS only (no .d.ts yet),
// so this minimal ambient declaration types the bits the example uses.
declare module "@fastpix/videojs-monitor" {
  const initVideoJsTracking: ((player: any, config: any) => any) & {
    utilityMethods: { now: () => number; [key: string]: any };
  };
  export default initVideoJsTracking;
}
