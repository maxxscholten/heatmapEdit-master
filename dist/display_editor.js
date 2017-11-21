///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register([], function(exports_1) {
    var HeatmapDisplayEditorCtrl;
    /** @ngInject */
    function heatmapDisplayEditor() {
        'use strict';
        return {
            restrict: 'E',
            scope: true,
            templateUrl: 'public/app/plugins/panel/heatmap/partials/display_editor.html',
            controller: HeatmapDisplayEditorCtrl,
        };
    }
    exports_1("heatmapDisplayEditor", heatmapDisplayEditor);
    return {
        setters:[],
        execute: function() {
            HeatmapDisplayEditorCtrl = (function () {
                /** @ngInject */
                function HeatmapDisplayEditorCtrl($scope) {
                    $scope.editor = this;
                    this.panelCtrl = $scope.ctrl;
                    this.panel = this.panelCtrl.panel;
                    this.panelCtrl.render();
                }
                return HeatmapDisplayEditorCtrl;
            })();
            exports_1("HeatmapDisplayEditorCtrl", HeatmapDisplayEditorCtrl);
        }
    }
});
//# sourceMappingURL=display_editor.js.map