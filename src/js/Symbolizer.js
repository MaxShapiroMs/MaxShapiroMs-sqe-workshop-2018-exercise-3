import * as esprima from 'esprima';
var global_table = [],local_table=[], inputIndex=[], symbolizedCode = [];
var token;
var funcStart,funcEnd;
var inputVector;
var originalCode;
var passedLine;
var ifGreenLines=[];
var ifRedLines=[];
var graphString='';
var graphParameters=[];
var countOps=0;
var assignmentCount=0;
var realGraphParameters=[];
var functionName='';
function symbolizer(code,input){
    inputVector=eval('['+input+']');global_table=[];symbolizedCode='';token=new Array();inputIndex=[];funcStart=-1;funcEnd=-1;
    passedLine=0;
    originalCode=code;
    let parsedCode = esprima.parseScript(code,{ loc : true });
    parseData(parsedCode.body,true);
    filterGraphParams(graphParameters);
    createGraphText(realGraphParameters);
    return graphString;
}
function filterGraphParams(graph) {
    let tempGraph = [];
    for (let op in graph) {
        if (typeof graph[op].Parent !== 'undefined')
            tempGraph.push(graph[op]);
    }
    realGraphParameters.push({'Parent':'start','Name':'st','Value':functionName,'Operation':'start'});
    for (let op in tempGraph)
    {
        if(checkAndAddItem(tempGraph[op],tempGraph)!=false)
            realGraphParameters.push(tempGraph[op]);
    }

}
function createGraphText(graph){
    initGraphVars(graph);
    connectGraphVars(graph);
}
function initGraphVars(graph){
    for(let op in graph){
        graphString=graphString+graph[op].Name+'=>'+graph[op].Operation +': '+graph[op].Value+'\n';
    }
}
function connectGraphVars(graph){
    let previousOps=[];let currentOp='';
    for(let op in graph){
        if(graph[op].Parent!='start' && !checkIfInArray(graph[op],previousOps)) {
            currentOp = graph[op].Parent;
            if(checkIfIfExp(currentOp)){connectIfGraphVar(currentOp,graph); previousOps.push(currentOp);}
            else{connectSimpleGraphVar(currentOp,graph);
                previousOps.push(currentOp);}
        }
    }
}
function connectIfGraphVar(currentOp,graph){
    for(let op in graph){
        if(graph[op].Name==currentOp) {
            checkIfHasCondition(graph[op]);
            graphString += '\n';
            return;
        }
    }
    graphString+='\n';

}
function checkIfIfExp(currentop){
    if(currentop.charAt(0)=='o' && currentop.charAt(1)=='p'){
        return true;
    }
    else return false;
}
function connectSimpleGraphVar(currentOp,graph){
    let currentName='';
    for(let op in graph){
        if(graph[op].Parent==currentOp && graph[op].Name!='end'){
            connectSimpleGraphVar1(currentOp,graph,op,currentName);
            currentName=graph[op].Name;
        }
    }
    graphString+='\n';
}
function connectSimpleGraphVar1(currentOp,graph,op,currentName){
    if(currentName!='') {
        graphString = graphString + '->' + graph[op].Name;
    }else {
        graphString = graphString + currentOp + '->' + graph[op].Name;
    }

}
function checkIfHasCondition(op){
    if(typeof op.connectTrue!=='undefined'){
        graphString+=op.Name+'(true)->'+op.connectTrue.Name+'\n';
        if(typeof op.connectFalse!=='undefined')
            graphString+=op.Name+'(false)->'+op.connectFalse.Name+'\n';
        else
            graphString+=op.Name+'(false)->end'+'\n';
        return true;
    }
    else if(typeof op.connectFalse!=='undefined'){
        graphString+=op.Name+'(true)->end'+'\n';
        graphString+=op.Name+'(false)->'+op.connectFalse.Name+'\n';
        return true;
    }
    else
        return false;

}
function checkIfInArray(op,previousArray){
    for(let i in previousArray)
    {
        if(previousArray[i]==op.Parent)
            return true;
    }
    return false;
}
function checkAndAddItem(item,graph){
    for(let op in graph){
        if(item.Parent==graph[op].Name)
            return true;
    }
    return false;
}
function getGreenLines()
{
    return ifGreenLines;
}
function getRedLines()
{
    return ifRedLines;
}
function getInputAtIndex(index)
{
    return inputVector[index];
}
/*function convertArray(input,i,count)
{
    let array='';
    for(let j=i;j<input.length;j++)
    {
        if(input[j]==']'){
            input_table[count]=array;
            return j;
        }
        else{
            array+=input[j];
        }
    }
}*/

const parseDataType = {
    'FunctionDeclaration': parseFunction,
    'VariableDeclaration': parseVariable,
    'ExpressionStatement': parseExpression,
    'ReturnStatement': parseReturn,
    'WhileStatement': parseWhile,
    //'ForStatement': parseFor,
    'IfStatement': parseIf,
    'UpdateExpression': parseUpdate,
    'AssignmentExpression': parseAssignment,
    'BinaryExpression':parseBinaryExpression,
    'MemberExpression':parseMemberExpression,
    'Literal': parseLiteral,
    'Identifier': parseIdentifierExpression,
    'UnaryExpression': parseUnaryExpression,
    'BlockStatement': blockExpression

};
function parseData(data,toToken)
{
    getGreenLines();
    getRedLines();
    for(let i=0;i<data.length;i++) {
        parseDataType[data[i].type](data[i],toToken);
    }
}
function getLine(code,lineNum) {
    if (lineNum - 1 > passedLine)
        for (let i = passedLine; i < lineNum - 1; i++){
            symbolizedCode = symbolizedCode + code.split('\n')[i] + '\n';
        }
    passedLine=lineNum;
    return code.split('\n')[lineNum-1];
}
function parseFunction(data,toToken){
    if(toToken)
        token.push({'Line':data.loc.start.line , 'Type': data.type , 'Name': data.id.name , 'Condition':'' , 'Value':''});
    funcStart=data.loc.start.line;
    funcEnd=data.loc.end.line;
    passedLine=funcStart;
    symbolizedCode=symbolizedCode+getLine(originalCode,data.loc.start.line)+'\n';
    for(let i=0;i<data.params.length;i++){
        if(toToken)
            token.push({'Line':data.loc.start.line , 'Type': 'FunctionDeclaration' , 'Name': data.params[i].name , 'Condition':'' , 'Value':''});
        global_table[data.params[i].name]=getInputAtIndex(i);
        inputIndex[data.params[i].name]=i;
    }
    graphParameters.push({'Parent':'start','Name':'st','Value':data.id.name});
    functionName=data.id.name;
    blockExpression(data.body,toToken,'st');
}
function parseVariable(data,toToken,parent){
    for(let i=0;i<data.declarations.length;i++)
    {

        if(data.declarations[i].init==null) {
            if (toToken)
                token.push({
                    'Line': data.loc.start.line,
                    'Type': 'VariableDeclaration',
                    'Name': data.declarations[i].id.name,
                    'Condition': '',
                    'Value': 'null'
                });
        }
        else{
            parseVariableExpression(data.declarations[i],toToken,parent);
        }

    }
}
function parseVariableExpression(data,toToken,parent){
    let variableJson={};
    variableJson.Parent=parent;
    variableJson.Operation='operation';
    if(data.init.raw!=null && toToken){
        token.push({'Line':data.loc.start.line , 'Type': 'VariableDeclaration' , 'Name': data.id.name , 'Condition':'' , 'Value':data.init.raw});
        addToRelevantTable(data,data.init.raw,toToken);
        variableJson.Name=data.id.name;
        variableJson.Value=data.init.raw;
    }
    else{
        if(toToken){
            token.push({'Line':data.loc.start.line , 'Type': 'VariableDeclaration' , 'Name': data.id.name , 'Condition':'' , 'Value':parseBinaryExpression(data.init,true)});
            addToRelevantTable(data,parseBinaryExpression(data.init,true),toToken);
        }
        variableJson.Name=data.id.name;
        variableJson.Value=parseBinaryExpression(data.init,true);
    }
    graphParameters.push(variableJson);
}
function addToRelevantTable(data,valueToAdd,toToken)
{
    let currentLine = getLine(originalCode,data.loc.start.line);
    if(funcStart<data.loc.start.line && funcEnd>data.loc.end.line && toToken)
        local_table[data.id.name]=valueToAdd;
    else {
        if(toToken)
            global_table[data.id.name] = eval(valueToAdd);
    }
    symbolizedCode=symbolizedCode+currentLine.split('=')[0]+'='+valueToAdd+'\n';
}
function parseExpression(data,toToken,parent){
    return parseDataType[data.expression.type](data.expression,toToken,parent);
}
function parseReturn(data,toToken,parent){
    if(toToken) {
        token.push({
            'Line': data.loc.start.line,
            'Type': data.type,
            'Name': '',
            'Condition': '',
            'Value': parseDataType[data.argument.type](data.argument)
        });
        symbolizedCode = symbolizedCode + 'return ' + parseDataType[data.argument.type](data.argument) + '\n';
        graphParameters.push({'Name':'end','Parent':parent,'Value':'end','Operation':'end'});
        passedLine++;
    }
}
function parseWhile(data,toToken){
    if(toToken)
        token.push({'Line':data.loc.start.line , 'Type': data.type , 'Name': '' , 'Condition':parseDataType[data.test.type](data.test) , 'Value':''});
    blockExpression(data.body,toToken);
}
/*function parseFor(data){
    token.push({'Line':data.loc.start.line , 'Type': data.type , 'Name': '' , 'Condition':parseDataType[data.test.type](data.test) , 'Value':''});
    parseDataType[data.init.type](data.init);
    parseDataType[data.test.type](data.test);
    parseDataType[data.update.type](data.update);
    blockExpression(data.body);
}*/
function parseIf(data,toToken,parent){
    let count=0;let colorFlag=determineColor(parseDataType[data.test.type](data.test,true));let operation = 'op'+countOps;let operationJson={};countOps++;
    if(toToken)token.push({'Line':data.loc.start.line , 'Type': data.type , 'Name': '' , 'Condition':parseDataType[data.test.type](data.test) , 'Value':'','Color':colorFlag,'consequentDepth':parseDataType[data.consequent.type](data.consequent,false),'alternativeDepth':parseDataType[data.alternate.type](data.alternate,false)});
    operationJson.Operation='condition';
    operationJson.Parent=parent;
    operationJson.Name=operation;
    operationJson.Value=parseDataType[data.test.type](data.test);
    if(colorFlag=='Green'){
        ifGreenLines.push(data.loc.start.line);
        let result = parseDataType[data.consequent.type](data.consequent,toToken,operation);
        count += result.count;
        operationJson.connectTrue=result.results[0].result.operatorToConnect;}
    else {
        ifRedLines.push(data.loc.start.line);
        let result = continueParsingWithoutTables(data.consequent, toToken,operation);
        count += result.count;
        operationJson.connectTrue=result.operatorToConnect;}

    return checkAlternate(data,colorFlag,toToken,count,operation,operationJson);
}
/*function getParameterByName(name){
    for(let i=0; i<graphParameters.length;i++){
        if(graphParameters[i].Name==name){
            return graphParameters[i];
        }
    }
}*/

function checkAlternate(data,colorFlag,toToken,count,operation,operationJson){
    if(data.alternate!=null){
        //if(data.alternate.test==null)
        //symbolizedCode=symbolizedCode+getLine(originalCode,data.alternate.loc.start.line)+'\n';
        if(colorFlag=='Green') {
            let result = continueParsingWithoutTables(data.alternate, toToken,operation);
            count += result.count;
            operationJson.connectFalse=result.operatorToConnect;
        }else {
            let result=parseDataType[data.alternate.type](data.alternate, toToken,operation);
            count += result.count;
            operationJson.connectFalse=result.operatorToConnect;
        }
        graphParameters.push(operationJson);
        return {'count':count+1,'operatorToConnect':operationJson};
    }
}
/*function getIfEndIndex(code,lineNum){
    let line = getLine(code,lineNum);
    for(let i=line.length;i>0;i--)
        if(line[i]==')')
            return i;
}*/
function continueParsingWithoutTables(data,toToken,parent){
    let tempLocal = copyTable(local_table);
    let tempGlobal = copyTable(global_table);
    let result = parseDataType[data.type](data,toToken,parent);
    local_table=[];
    global_table=[];
    local_table=copyTable(tempLocal);
    global_table=copyTable(tempGlobal);
    return {'count':result.results[0].result.count+1,'operatorToConnect':result.results[0].result.operatorToConnect};
}
function copyTable(table)
{
    let temp=[];
    for(let index in table)
        temp[index]=table[index];
    return temp;
}
function determineColor(condition) {
    let temp=condition;
    for (let key in global_table)
    {
        temp=condition.replace(key,global_table[key]);
        if(temp.indexOf(',')!=-1)
            condition=condition.replace(key,getArrayIndex(key,condition[condition.indexOf(key)+2]));
        else
            condition=temp;
    }
    //condition.replace(condition[0],parseIdentifierExpression(condition[0],true));
    if(eval(condition))
        return 'Green';
    else
        return 'Red';
}
function getArrayIndex(key,index){
    if(index==-1)
        return global_table[key];

    try {
        if(isNaN(global_table[key][index]))
            return '"'+global_table[key][index]+'"';
        else
            return global_table[key][index];
    }
    catch (e) {
        return eval(global_table[key][index]);
    }
}
function parseUpdate(data){
    return data;
}
function parseAssignment(data,toToken,parent){
    let assignment='ass'+assignmentCount;let assignmentJson={};
    assignmentCount++;
    if(toToken){
        token.push({'Line':data.loc.start.line, 'Type':data.type,'Name':data.left.name,'Condition':'', 'Value':parseDataType[data.right.type](data.right)});
    }
    assignmentJson.Operation='operation';
    assignmentJson.Parent=parent;
    assignmentJson.Name=assignment;
    assignmentJson.Value=data.left.name+'='+parseDataType[data.right.type](data.right);

    //symbolizedCode=symbolizedCode+data.left.name+'='+parseDataType[data.right.type](data.right)+'\n';
    passedLine++;
    //if(data.left.name in local_table)
    //    local_table[data.left.name]=parseDataType[data.right.type](data.right);
    if(data.left.name in global_table)
        global_table[data.left.name]=parseDataType[data.right.type](data.right);
    graphParameters.push(assignmentJson);
    return {'count':1,'operatorToConnect':assignmentJson};
}
////
function parseBinaryExpression(data,isIfState){
    if(data.left==null)
        return;
    if(bracesTester(data.left.type))
    {
        return parseDataType[data.left.type](data.left,isIfState)+data.operator+parseDataType[data.right.type](data.right,isIfState);
    }
    else
    {
        return parseDataType[data.left.type](data.left,isIfState)+' '+data.operator+' ('+parseDataType[data.right.type](data.right,isIfState)+')';
    }
}
function bracesTester(data){
    if(data=='Identifier')
        return 1;
    else if(data=='Literal')
        return 1;
    else if(data=='MemberExpression')
        return 1;
    return 0;
}
function parseMemberExpression(data){
    //if(data.object.indexOf('[')!=-1)
    //return global_table[data.object.name[data.property]]=parseDataType
    return data.object.name+'['+parseDataType[data.property.type](data.property)+']';
}
function parseLiteral(data){
    if(data.raw in local_table)
        return data.raw;
    else if(data.raw in global_table)
        return global_table[data.raw];
    else
        return data.raw;
}
function parseIdentifierExpression(data,isIfState){
    if(data.name in local_table && isIfState){
        return local_table[data.name];}
    //else if(data.name in global_table)
    //    return global_table[data.name]
    else
        return data.name;
}
function parseUnaryExpression(data){
    return '-'+parseDataType[data.argument.type](data.argument);
}
function blockExpression(data,toToken,parent)
{
    let parseJson=[];
    for(let i=0;i<data.body.length;i++)
    {
        parseJson.push({'index':i,'result':parseDataType[data.body[i].type](data.body[i],toToken,parent)});
    }
    return {'length':data.body.length,'results':parseJson};
}

export {symbolizer,getGreenLines,getRedLines};