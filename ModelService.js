"use strict";
exports.__esModule = true;
var modelService = /** @class */ (function () {
    function modelService() {
        this.module = '';
        this.service = '';
        this.description = '';
        this.request = [];
        this.response = [];
    }
    return modelService;
}());
exports.modelService = modelService;
var modelRequest = /** @class */ (function () {
    function modelRequest() {
        this.name = '';
        this.paramType = '';
        this.type = '';
        this.lv = '';
        this.description = '';
        this.required = '';
        this.simpleValue = '';
        this.posibleValue = '';
    }
    return modelRequest;
}());
exports.modelRequest = modelRequest;
var modelResponse = /** @class */ (function () {
    function modelResponse() {
        this.name = '';
        this.paramType = '';
        this.type = '';
        this.lv = '';
        this.description = '';
        this.required = '';
        this.simpleValue = '';
        this.posibleValue = '';
    }
    return modelResponse;
}());
exports.modelResponse = modelResponse;
