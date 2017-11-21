/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/es6-shim/es6-shim.d.ts" />

declare var System: any;

declare module 'd3' {
  var d3: any;
  export default d3;
}

declare module 'app/core/utils/ticks' {
  var tickStep: any;
  var getScaledDecimals: any;
  var getFlotTickSize: any;
  export {tickStep, getScaledDecimals, getFlotTickSize};
}

declare module 'app/core/core' {
  var contextSrv: any;
  var appEvents: any;
  export {contextSrv, appEvents};
}
