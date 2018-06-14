var rp = require('request-promise');
var excel = require('excel4node');

var modelService = require('../swagger-json-to-excel/ModelService');

// defind global variable
var serviceList = [];
var listDefineResponse = [];
var listDefineRequest = [];
var skipModuleForGenerate = ['????????'];
var skipServiceForGenerate = ['???????','????????'];
var excelFileName = '../swagger-json-to-excel/output/SwaggerJsonToExcel.xlsx';

/*****************************
 * Get JSON Swgger from URL
 *****************************/
// var swaggerJsonUrl = 'http://xxxxxxxxxxxxx:3000/explorer/swagger.json';
// var json;
// var options = {
//     uri: swaggerJsonUrl,    
//     json: true // Automatically stringifies the body to JSON
// };
//  console.log('Swagger URL : ' + swaggerJsonUrl);
// rp(options)
// .then(function (parsedBody) {
//     console.log('Get Url Response');
//     json = parsedBody;
//     console.log('Call generateExcel');
//     generateExcel();
// })
// .catch(function (err) {
//     console.log('Error : ' + err);
// });

/****************************************
 * Use datasource file
 ****************************************/
var json = require('../swagger-json-to-excel/datasource/swagger-json-example.json');
generateExcel();

/********************************
 * Prepare data & Create Excel
 ********************************/
function generateExcel() {
    // preparing data before generate excel
    for (var path in json.paths) {
        
        var pathItem = json.paths[path];

        for (var method in pathItem) {

            var itemMethod = pathItem[method];         
            // validate
            if (!itemMethod) continue;
            if (!itemMethod.summary) continue;
            if (!itemMethod.operationId) continue;
    
            var moduleName = '';
            if (itemMethod.tags) {
                moduleName = itemMethod.tags[0]; 
            }
            
            var serviceName = '';
            if (itemMethod.operationId) {
                serviceName = itemMethod.operationId.replace('/','');
            } else {
                if (itemMethod.summary) {
                    serviceName = itemMethod.summary.replace('/','');
                }
            }            

            var serviceDesc = '';
            if (itemMethod.description) {
                serviceDesc = itemMethod.description;
            }
                
            // validate for some module or service you want to not generate
            if (skipModuleForGenerate.indexOf(moduleName) > -1) continue;
            if (skipServiceForGenerate.indexOf(serviceName) > -1) continue;
    
            var serviceModel = new modelService.modelService();
            console.log('module : ' + moduleName);
            serviceModel.module = moduleName;
            console.log('service : ' + serviceName);
            serviceModel.service = serviceName;
            serviceModel.description = serviceDesc;
            serviceModel.methodType = method;
            var param;
            var name;
            var paramType;
            var type;
            var desc;
            var required;
            /* Prepare Request */
            listDefineRequest = [];
            for (var paramName in itemMethod.parameters) {
                param = itemMethod.parameters[paramName];            
                name = param.name;            
                paramType = param.in;            
                type = param.type;            
                desc = param.description;            
                required = false;
                if (param.required) {
                    required = true;
                }
                if (param.schema) {
                          
                    if (param.schema.$ref) {                    
                        var define = getDefineName(param.schema.$ref);
                        var definition = getDefinitionItemRequest(json,1,define,paramType);
                        for (var i in definition) {
                            serviceModel.request.push(definition[i]);
                        }
                        listDefineRequest = [];

                    } else if (param.schema.items.$ref) {                        
                        var define = getDefineName(param.schema.items.$ref);
                        var definition = getDefinitionItemRequest(json,1,define,paramType);
                        for (var i in definition) {
                            serviceModel.request.push(definition[i]);
                        }
                        listDefineRequest = [];

                    } else {
                        var define = param.schema.description;
                        var definition = getDefinitionItemRequest(json,1,define,paramType);
                        for (var i in definition) {
                            serviceModel.request.push(definition[i]);
                        }
                        listDefineRequest = [];
                    }
        
                } else {
                    // LV 1            
                    var requestModel = new modelService.modelRequest();
                    requestModel.name = name;
                    requestModel.paramType = paramType;
                    requestModel.type = type;
                    requestModel.lv = '1';
                    requestModel.description = desc;
                    requestModel.required = required;
                    requestModel.simpleValue = '';
                    serviceModel.request.push(requestModel);
                }        
            }
                
            /* Prepare Response */
            listDefineResponse = [];
            for (var paramName in itemMethod.responses) {
                // filter for response success
                if (paramName != 200) continue;
    
                param = itemMethod.responses[paramName];        
                name = param.name;            
                paramType = 'body';            
                type = param.type;            
                desc = param.description;            
                required = false;
                if (param.required) {
                    required = true;
                }
                if (param.schema) {
                    // LV x => for model response multi level
                    if (param.schema.$ref) {                    
                        var define = getDefineName(param.schema.$ref);
                        var definition = getDefinitionItemResponse(json,1,define,paramType);
                        for (var i in definition) {
                            serviceModel.response.push(definition[i]);
                        }
                        listDefineResponse = [];
                    } else if (param.schema.items.$ref) {
    
                        var define = getDefineName(param.schema.items.$ref);
                        var definition = getDefinitionItemResponse(json,1,define,paramType);
                        for (var i in definition) {
                            serviceModel.response.push(definition[i]);
                        }
                        listDefineResponse = [];
                    } else {
                        
                        var define = param.schema.description;
                        var definition = getDefinitionItemResponse(json,1,define,paramType);
                        for (var i in definition) {
                            serviceModel.response.push(definition[i]);
                        }
                        listDefineResponse = [];
                    }
        
                } else {
                    // LV 1 => for model response single level
                    var responseModel = new modelService.modelService();
                    responseModel.name = name;
                    responseModel.paramType = paramType;
                    responseModel.type = type;
                    responseModel.lv = '1';
                    responseModel.description = desc;
                    responseModel.required = required;
                    responseModel.simpleValue = '';
                    serviceModel.response.push(responseModel);
                }        
            }
        
            serviceList.push(serviceModel);
        }
    }
    
    /***********************
     * Start Create Excel
     ***********************/
    var wb = new excel.Workbook();

    // prepare style for set cell of cell
    // 1. style for table header
    var tHeadStyle = wb.createStyle({
        font: {
            color: '#FFFFFF',        
        },
        border: {
            left: {
                style: 'thin', //§18.18.3 ST_BorderStyle (Border Line Styles) ['none', 'thin', 'medium', 'dashed', 'dotted', 'thick', 'double', 'hair', 'mediumDashed', 'dashDot', 'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot']
                color: '#000000' // HTML style hex value
            },
            right: {
                style: 'thin',
                color: '#000000'
            },
            top: {
                style: 'thin',
                color: '#000000'
            },
            bottom: {
                style: 'thin',
                color: '#000000'
            }
        },
        fill:{
            type: 'pattern', // Currently only 'pattern' is implemented. Non-implemented option is 'gradient'
            patternType: 'solid', //§18.18.55 ST_PatternType (Pattern Type)
            bgColor: '#000000', // HTML style hex value. defaults to black
            fgColor: '#000000' // HTML style hex value. defaults to black.
        }
    });
    // 2. style for table body cell with indent
    var cellIndentStyle = wb.createStyle({
        alignment:{
            indent:1
        }    
    });
    // 3. style for table body cell
    var cellBorderStyle = wb.createStyle({   
        border: { // §18.8.4 border (Border)
            left: {
                style: 'thin', //§18.18.3 ST_BorderStyle (Border Line Styles) ['none', 'thin', 'medium', 'dashed', 'dotted', 'thick', 'double', 'hair', 'mediumDashed', 'dashDot', 'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot']
                color: '#000000' // HTML style hex value
            },
            right: {
                style: 'thin',
                color: '#000000'
            },
            top: {
                style: 'thin',
                color: '#000000'
            },
            bottom: {
                style: 'thin',
                color: '#000000'
            },
            diagonal: {
                style: 'thin',
                color: '#000000'
            },
            diagonalDown: true,
            diagonalUp: true,
            outline: true
        }
    });
    
    /* create sheet index */
    var index = [];
    console.log('Create Sheet Index');
    for (let service in serviceList) {
        index.push({module:serviceList[service].module,service:serviceList[service].service});
    }
    var ws = wb.addWorksheet('index');
    var row = 1;
    // set table header of sheet index
    ws.cell(row, 1).string('No');
    ws.cell(row, 1).style(tHeadStyle);
    ws.cell(row, 2).string('Module');
    ws.cell(row, 2).style(tHeadStyle);
    ws.cell(row, 3).string('Service Name');
    ws.cell(row, 3).style(tHeadStyle);
    ws.cell(row, 4).string('Sheet Link');
    ws.cell(row, 4).style(tHeadStyle);
    row++;

    // start loop set table body of sheet index
    for (let i = 0;i < index.length; i++) {
        var obj = index[i];
        ws.cell(row, 1).number(row -1);
        ws.cell(row, 1).style(cellBorderStyle);
        ws.cell(row, 2).string(obj.module);
        ws.cell(row, 2).style(cellBorderStyle);
        ws.cell(row, 3).string(obj.service);
        ws.cell(row, 3).style(cellBorderStyle);
        var serviceName = obj.service;

        // for protect limit sheet name of excel
        if (serviceName.length > 30) {
            serviceName = serviceName.substring(0,30);
        }

        // for link goto sheet service
        ws.cell(row, 4).formula('=HYPERLINK("#' + serviceName + '!A1","' + obj.service + '")');
        ws.cell(row, 4).style(cellBorderStyle);    
        row++;
    }
    
    /* create excel specification follow api */
    for (let service in serviceList) {
            
        console.log('module : ' + serviceList[service].module + ' / service : ' + serviceList[service].service);        
        var row = 1;
        var serviceName = serviceList[service].service;

        // for protect limit sheet name of excel
        if (serviceName.length > 30) {
            serviceName = serviceName.substring(0,30);
        }

        // create new sheet
        var ws = wb.addWorksheet(serviceName);
        
        ws.cell(row, 1,row,3,true).string('Module : ' + serviceList[service].module);
    
        // for back to index sheet
        ws.cell(row, 11).formula('=HYPERLINK("#index!A1","Back to index")');
    
        row++;
        ws.cell(row, 1,row,3,true).string('Service Name : ' + serviceList[service].service);
        row++;
        ws.cell(row, 1,row,3,true).string('Method Type : ' + serviceList[service].methodType);
        row++;
        ws.cell(row, 1,row,3,true).string('Description : ' + serviceList[service].description);
        row++;
    
        var count = 1;
        // set table header of request parameter
        ws.cell(row, 1).string('Request');
        row++;
        ws.cell(row, 1).string('Parameter');
        ws.cell(row,1).style(tHeadStyle);
        ws.cell(row, 2).string('Parameter Type');
        ws.cell(row,2).style(tHeadStyle);
        ws.cell(row, 3).string('Level');
        ws.cell(row,3).style(tHeadStyle);
        ws.cell(row, 4).string('Data Type');
        ws.cell(row,4).style(tHeadStyle);
        ws.cell(row, 5).string('Length');
        ws.cell(row,5).style(tHeadStyle);
        ws.cell(row, 6).string('O/M');
        ws.cell(row,6).style(tHeadStyle);
        ws.cell(row, 7).string('Description');
        ws.cell(row,7).style(tHeadStyle);
        ws.cell(row, 8).string('Simple Value');
        ws.cell(row,8).style(tHeadStyle);
        ws.cell(row, 9).string('Possible Value');
        ws.cell(row,9).style(tHeadStyle);
        ws.cell(row, 10).string('Formula/Remark');
        ws.cell(row,10).style(tHeadStyle); 
        row++;

        // start table body of request parameter
        for (let req in serviceList[service].request) {        
                
            var item = serviceList[service].request[req];
            
            // Column Parameter
            if (item.name) {
                ws.cell(row, 1).string(item.name);              
            } else {
                ws.cell(row, 1).string('');      
            }
            // check level of parameter for use style
            if (item.lv) {                            
                if (Number(item.lv) > 1){
                    cellIndentStyle.alignment.indent = Number(item.lv) - 1;      
                    ws.cell(row, 1).style(cellIndentStyle);                  
                }    
            }        
            ws.cell(row, 1).style(cellBorderStyle);     
            
            // Column Parameter Type (header , body)
            if (item.paramType) {
                ws.cell(row, 2).string(item.paramType);      
            } else {
                ws.cell(row, 2).string('');
            }     
            ws.cell(row, 2).style(cellBorderStyle);          
            
            // Column Parameter Level
            if (item.lv) {
                ws.cell(row, 3).number(Number(item.lv));               
            } else {
                ws.cell(row, 3).number(0);      
            } 
            ws.cell(row, 3).style(cellBorderStyle);           
            
            // Column Type (string , integer , ....)
            if (item.type) {
                ws.cell(row, 4).string(item.type);      
            } else {
                ws.cell(row, 4).string('');      
            }             
            ws.cell(row, 4).style(cellBorderStyle);     
            
            // Column Length for other condition or mapping db column size
            ws.cell(row, 5).style(cellBorderStyle);
            
            // Column O/M (optional , mandatory)
            if (item.required) {
                ws.cell(row, 6).string('M');
            } else {
                ws.cell(row, 6).string('O');
            }
            ws.cell(row, 6).style(cellBorderStyle);
            
            // Column Description
            if (item.description) {
                ws.cell(row, 7).string(item.description);      
            } else {
                ws.cell(row, 7).string('');      
            } 
            ws.cell(row, 7).style(cellBorderStyle); 
            
            // Column Simple value
            if (item.simpleValue) {
                ws.cell(row, 8).string(item.simpleValue.toString());
            } else {
                ws.cell(row, 8).string('');
            }   
            ws.cell(row, 8).style(cellBorderStyle);
            
            // Column Possible Value not include in swagger
            if (item.posibleValue) {
                ws.cell(row, 9).string(item.posibleValue);      
            } else {
                ws.cell(row, 9).string('');      
            } 
            ws.cell(row, 9).style(cellBorderStyle);    

            // Column Formula/Remark not include in swagger
            ws.cell(row, 10).style(cellBorderStyle);
            count ++;
            row++;
        }
        row++;
    
        // set table header of response parameter
        ws.cell(row, 1).string('Response');
        row++;
        ws.cell(row, 1).string('Parameter');
        ws.cell(row,1).style(tHeadStyle);
        ws.cell(row, 2).string('Parameter Type');
        ws.cell(row,2).style(tHeadStyle);
        ws.cell(row, 3).string('Level');
        ws.cell(row,3).style(tHeadStyle);
        ws.cell(row, 4).string('Data Type');
        ws.cell(row,4).style(tHeadStyle);
        ws.cell(row, 5).string('Length');
        ws.cell(row,5).style(tHeadStyle);
        ws.cell(row, 6).string('O/M');
        ws.cell(row,6).style(tHeadStyle);
        ws.cell(row, 7).string('Description');
        ws.cell(row,7).style(tHeadStyle);
        ws.cell(row, 8).string('Simple Value');
        ws.cell(row,8).style(tHeadStyle);
        ws.cell(row, 9).string('Possible Value');
        ws.cell(row,9).style(tHeadStyle);
        ws.cell(row, 10).string('Formula/Remark');
        ws.cell(row,10).style(tHeadStyle);
        row++;

        // start table body of response parameter
        for (let res in serviceList[service].response) {
                        
            var item = serviceList[service].response[res]; 
            
            // Column Parameter Name
            if (item.name) {
                ws.cell(row, 1).string(item.name);                       
            } else {
                ws.cell(row, 1).string('');      
            } 
            // check level of parameter for use style
            if (item.lv) {                              
                if (Number(item.lv) > 1){
                    cellIndentStyle.alignment.indent = Number(item.lv) - 1;
                    ws.cell(row, 1).style(cellIndentStyle);
                }                                              
            }      
            ws.cell(row, 1).style(cellBorderStyle); 
            
            // Column Parameter Type (header,body)
            if (item.paramType) {
                ws.cell(row, 2).string(item.paramType);      
            } else {
                ws.cell(row, 2).string('');
            }
            ws.cell(row, 2).style(cellBorderStyle);
            
            // Column Parameter Level
            if (item.lv) {
                ws.cell(row, 3).number(Number(item.lv));      
            } else {
                ws.cell(row, 3).number(0);      
            }    
            ws.cell(row, 3).style(cellBorderStyle);    
            
            // Column Type (string , integer , ....)
            if (item.type) {
                ws.cell(row, 4).string(item.type);      
            } else {
                ws.cell(row, 4).string('');      
            }     
            ws.cell(row, 4).style(cellBorderStyle);
    
            // Column Length for other condition or mapping db column size
            ws.cell(row, 5).style(cellBorderStyle);                  
    
            // Column O/M (optional , mandatory)
            if (item.required) {
                ws.cell(row, 6).string('M');
            } else {
                ws.cell(row, 6).string('O');
            }
            ws.cell(row, 6).style(cellBorderStyle);
            
            // Column Description
            if (item.description) {
                ws.cell(row, 7).string(item.description);      
            } else {
                ws.cell(row, 7).string('');      
            } 
            ws.cell(row, 7).style(cellBorderStyle);
            
            // Column Simple Value
            if (item.simpleValue) {
                ws.cell(row, 8).string(item.simpleValue.toString());
            } else {
                ws.cell(row, 8).string('');
            }        
            ws.cell(row, 8).style(cellBorderStyle);
            
            // Column Possible Value not include in swagger                          
            ws.cell(row, 9).style(cellBorderStyle);
            
            // Column Formula/Remark not include in swagger
            ws.cell(row, 10).style(cellBorderStyle);
            count ++;
            row++;
        }        
    }
    
    // save excel file
    wb.write(excelFileName, function (err, stats) {
        if (err) {
            console.error(err);
        }  else {
            console.log(stats); // Prints out an instance of a node.js fs.Stats object
        }
    });
}

/* Funciton for Request */
function getDefinitionItemRequest(json ,lvCount, name,paramType) {    
    for (var item in json.definitions) {
        if (item === name) {
            var prop = json.definitions[item];
            for (var pName in prop.properties) {                
                var data = prop.properties[pName];
                if (data.$ref) {
                    
                    var rItem = prop.properties[pName];                    
                    pushDataToModelRequest(prop,pName,paramType,rItem.type,lvCount,rItem.description,rItem.required,rItem.example,rItem.enum);                    
                                        
                    var defineName = getDefineName(data.$ref);
                    getDefinitionItemRequest(json,(lvCount + 1),defineName,paramType);

                } else {
                    if (data.type == 'object' || data.type == 'array') {
                        // check has child                     
                        for (var cName in data) {
                            var child = data[cName];                                                
                            if (IsString(child)) {
                                if (child.indexOf('#/definitions') !== -1) {
                                    
                                    var defineName = getDefineName(data.$ref);
                                    getDefinitionItemRequest(json,(lvCount + 1),defineName,paramType);                                    
                                } 
                            } else {
                                for (var c2Name in child) {
                                    var child2 = child[c2Name];
                                    if (!IsString(child2)){
                                                                                
                                        var defineName = getDefineName(child2.$ref);                                        
                                        var rItem = child[c2Name];                                        
                                        pushDataToModelRequest(prop,defineName,paramType,rItem.type,lvCount,rItem.description,rItem.required,rItem.example,rItem.enum);
                                        getDefinitionItemRequest(json,(lvCount + 1),defineName,paramType);

                                    } else if (IsString(child2) && child2.indexOf('#' > -1)) {
                                                                                
                                        var defineName = getDefineName(child2);                                        
                                        var rItem = child[c2Name];                                        
                                        pushDataToModelRequest(prop,pName,paramType,rItem.type,lvCount,rItem.description,rItem.required,rItem.example,rItem.enum);
                                        getDefinitionItemRequest(json,(lvCount + 1),defineName,paramType); 
                                    }
                                }
                            }
                        }
                    } else {
                        var rItem = prop.properties[pName];                        
                        pushDataToModelRequest(prop,pName,paramType,rItem.type,lvCount,rItem.description,rItem.required,rItem.example,rItem.enum);
                    }
                }
            }

            return listDefineRequest;
        }
    }
}

/* Function for Response */
function getDefinitionItemResponse(json,lvCount,name,paramType) {    
    for (var item in json.definitions) {
        if (item === name) {
            var prop = json.definitions[item];            
            for (var pName in prop.properties) {
                
                var data = prop.properties[pName];
                
                if (data.$ref) {                    
                    var rItem = prop.properties[pName];                
                    pushDataToModelResponse(pName,paramType,rItem.type,lvCount,rItem.description,rItem.required,rItem.example);
                    var defineName = getDefineName(data.$ref);
                    getDefinitionItemResponse(json,(lvCount + 1),defineName,paramType);
                    
                } else {
                    if (data.type == 'object' || data.type == 'array') {
                        // check has child                     
                        for (var cName in data) {
                            var child = data[cName];                                                
                            if (IsString(child)) {
                                if (child.indexOf('#/definitions') !== -1) {
                                    var defineName =  getDefineName(data.$ref);
                                    getDefinitionItemResponse(json,(lvCount + 1),defineName,paramType);                                    
                                } 
                            } else {
                                for (var c2Name in child) {
                                    var child2 = child[c2Name];
                                    if (!IsString(child2)){
                                                                                
                                        var defineName = getDefineName(child2.$ref);                                        
                                        var rItem = child[c2Name];                  
                                        pushDataToModelResponse(defineName,paramType,rItem.type,lvCount,rItem.description,rItem.required,rItem.example);
                                        getDefinitionItemResponse(json,(lvCount + 1),defineName,paramType);    
                                                                            
                                    } else if (IsString(child2) && child2.indexOf('#' > -1)) {
                                                                                
                                        var defineName = getDefineName(child2);                                        
                                        var rItem = child[c2Name];                                        
                                        pushDataToModelResponse(pName,paramType,rItem.type,lvCount,rItem.description,rItem.required,rItem.example);
                                        getDefinitionItemResponse(json,(lvCount + 1),defineName,paramType); 
                                    }
                                }
                            }
                        }
                    } else {
                        var rItem = prop.properties[pName];
                        pushDataToModelResponse(pName,paramType,rItem.type,lvCount,rItem.description,rItem.required,rItem.example);
                    }
                }                
            }
            
            return listDefineResponse;
        }
    }
}

/* request definition is required */
function checkDefinitionRequestIsRequired(requestItem,requestName) {
    if (!requestItem.required) {
        return false;
    }
    for (var reqName in requestItem) {        
        var reqItem = requestItem.required[reqName];
        if (reqItem === requestName) {
            return true;
        } 
    }
    return false;
}

/* check type */
function IsString(obj) {
    return obj !== undefined && obj != null && obj.toLowerCase !== undefined;
}

/* get define from string */
function getDefineName(valueRefStr) {
    var ref = valueRefStr;
    var tmp = ref.split('/');
    var defineName = tmp[tmp.length - 1];
    return defineName;
}

/* push data to list request */
function pushDataToModelRequest(jsonPopDefineList,paramName,paramType,dataType,paramLv,paramDesc,paramRequired,paramSimpleValue,paramPosible) {
    var requestModel = new modelService.modelRequest();
    requestModel.name = paramName;
    requestModel.paramType = paramType;
    requestModel.type = dataType;
    requestModel.lv = paramLv;
    if (paramDesc) {
        requestModel.description = paramDesc;
    } else {
        requestModel.description = '';
    }
    if (paramRequired) {
        requestModel.required = paramRequired;
    } else {
        requestModel.required = checkDefinitionRequestIsRequired(jsonPopDefineList,paramName);
    }                                    
    requestModel.simpleValue = paramSimpleValue;
    var posibleStr = '';
    if (paramPosible) {
        for (var eName in paramPosible) {
            posibleStr += paramPosible[eName] + ',';
        }
        if (posibleStr != '') {
            posibleStr = posibleStr.substr(0,posibleStr.length -1);
        }
    }
    requestModel.posibleValue = posibleStr;
    listDefineRequest.push(requestModel);
}

/* push data to list response */
function pushDataToModelResponse(paramName,paramType,dataType,paramLv,paramDesc,paramRequired,paramSimpleValue) {
    var responseModel = new modelService.modelResponse();
    responseModel.name = paramName;
    responseModel.paramType = paramType;
    responseModel.type = dataType;
    responseModel.lv = paramLv;
    if (paramDesc) {
        responseModel.description = paramDesc;
    } else {
        responseModel.description = '';
    }
    if (paramRequired) {
        responseModel.required = paramRequired;
    }                                      
    responseModel.simpleValue = paramSimpleValue;
    listDefineResponse.push(responseModel);
}