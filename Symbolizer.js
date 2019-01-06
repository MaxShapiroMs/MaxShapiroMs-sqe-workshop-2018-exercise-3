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
var op;
function symbolizer(code,input){
    inputVector=eval('['+input+']');
    global_table=[];
    symbolizedCode='';
    token=new Array();
    inputIndex=[];
    funcStart=-1;
    funcEnd=-1;
    passedLine=0;
    originalCode=code;
    let parsedCode = esprima.parseScript(code,{ loc : true });
    parseData(parsedCode.body,true);
    forEach(op in graphParameters)
    {
        if(op.operationToConnect!=null)
            graphString=graphString+op;
        while(op.operationToConnect!=null){
            graphString=graphString+'->'+op.operationToConnect;
            op = graphParameters[op.operationToConnect];
        }
    }
    /* eslint-disable no-console */
    console.log(graphString);
    /* eslint-enable no-console */
    return graphString;
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
    graphString=graphString+'st=>start: '+ data.id.Name+'\n';
    graphParameters.push({'Name':'st'});
    blockExpression(data.body,toToken);
}
function parseVariable(data,toToken){
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
            parseVariableExpression(data.declarations[i],toToken);
        }

    }
}
function parseVariableExpression(data,toToken){
    if(data.init.raw!=null && toToken){
        token.push({'Line':data.loc.start.line , 'Type': 'VariableDeclaration' , 'Name': data.id.name , 'Condition':'' , 'Value':data.init.raw});
        addToRelevantTable(data,data.init.raw,toToken);
    }
    else{
        if(toToken){
            token.push({'Line':data.loc.start.line , 'Type': 'VariableDeclaration' , 'Name': data.id.name , 'Condition':'' , 'Value':parseBinaryExpression(data.init)});
            addToRelevantTable(data,parseBinaryExpression(data.init),toToken);
        }
    }
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
function parseExpression(data){
    parseDataType[data.expression.type](data.expression);
}
function parseReturn(data,toToken){
    if(toToken) {
        token.push({
            'Line': data.loc.start.line,
            'Type': data.type,
            'Name': '',
            'Condition': '',
            'Value': parseDataType[data.argument.type](data.argument)
        });
        symbolizedCode = symbolizedCode + 'return ' + parseDataType[data.argument.type](data.argument) + '\n';
        graphString=graphString+'end=>end: return\n';
        graphParameters.push({'Name':'end'});
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
function parseIf(data,toToken){
    let count=0;
    let colorFlag=determineColor(parseDataType[data.test.type](data.test));
    let operation = countOps;
    countOps++;
    //let ifIndexEnd=getIfEndIndex(originalCode,data.loc.start.line);
    //symbolizedCode=symbolizedCode+getLine(originalCode,data.loc.start.line).substr(0,getLine(originalCode,data.loc.start.line).indexOf('(')+1)+parseDataType[data.test.type](data.test)+')'+getLine(originalCode,data.loc.start.line).substr(ifIndexEnd+1)+'\n';
    if(toToken)token.push({'Line':data.loc.start.line , 'Type': data.type , 'Name': '' , 'Condition':parseDataType[data.test.type](data.test) , 'Value':'','Color':colorFlag,'consequentDepth':parseDataType[data.consequent.type](data.consequent,false),'alternativeDepth':parseDataType[data.alternate.type](data.alternate,false)});
    graphString=graphString+operation+'=>'+operation+': '+data.test;
    graphParameters.push({'Name':operation});
    if(colorFlag=='Green'){
        ifGreenLines.push(data.loc.start.line);
        let result = parseDataType[data.consequent.type](data.consequent,toToken);
        count += result.count;
        graphParameters[operation].connectTrue=result.operatorToConnect;}
    else {
        ifRedLines.push(data.loc.start.line);
        let result = continueParsingWithoutTables(data.consequent, toToken);
        count += result.count;
        graphParameters[operation].connectFalse=result.operatorToConnect;}
    return checkAlternate(data,colorFlag,toToken,count,operation);
}
function checkAlternate(data,colorFlag,toToken,count,operation){
    if(data.alternate!=null){
        //if(data.alternate.test==null)
        //symbolizedCode=symbolizedCode+getLine(originalCode,data.alternate.loc.start.line)+'\n';
        if(colorFlag=='Green') {
            let result = continueParsingWithoutTables(data.alternate, toToken);
            count += result.count;
            graphParameters[operation].connectTrue=result.operationToConnect;
        }else {
            let result=parseDataType[data.alternate.type](data.alternate, toToken);
            count += result.count;
            graphParameters[operation].connectFalse=result.operationToConnect;
        }return {'count':count+1,'operationToConnect':operation};
    }
}
/*function getIfEndIndex(code,lineNum){
    let line = getLine(code,lineNum);

    for(let i=line.length;i>0;i--)
        if(line[i]==')')
            return i;
}*/
function continueParsingWithoutTables(data,toToken){
    let tempLocal = copyTable(local_table);
    let tempGlobal = copyTable(global_table);
    let result = parseDataType[data.type](data,toToken);
    local_table=[];
    global_table=[];
    local_table=copyTable(tempLocal);
    global_table=copyTable(tempGlobal);
    return {'count':result.count+1,'operationToConnect':result.operationToConnect};
}
function copyTable(table)
{
    let temp=[];
    for(let index in table)
        temp[index]=table[index];
    return temp;
}
function determineColor(condition) {
    let temp;
    for (let key in global_table)
    {
        temp=condition.replace(key,global_table[key]);
        if(temp.indexOf(',')!=-1)
            condition=condition.replace(key,getArrayIndex(key,condition[condition.indexOf(key)+2]));
        else
            condition=temp;
    }
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
function parseAssignment(data,toToken){
    let assignment='ass'+assignmentCount;
    assignmentCount++;
    if(toToken)
        token.push({'Line':data.loc.start.line, 'Type':data.type,'Name':data.left.name,'Condition':'', 'Value':parseDataType[data.right.type](data.right)});
    graphString=graphString+assignment + '=>' + assignment + ':' + data.left.name;
    graphParameters.push({'Name':assignment});
    symbolizedCode=symbolizedCode+data.left.name+'='+parseDataType[data.right.type](data.right)+'\n';
    passedLine++;
    if(data.left.name in local_table)
        local_table[data.left.name]=parseDataType[data.right.type](data.right);
    if(data.left.name in global_table)
        global_table[data.left.name]=parseDataType[data.right.type](data.right);
    return {'count':count+1,'operationToConnect':assignment};
}
////
function parseBinaryExpression(data){
    if(data.left==null)
        return;
    if(bracesTester(data.left.type))
    {
        return parseDataType[data.left.type](data.left)+data.operator+parseDataType[data.right.type](data.right);
    }
    else
    {
        return parseDataType[data.left.type](data.left)+' '+data.operator+' ('+parseDataType[data.right.type](data.right)+')';
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
        return local_table[data.raw];
    else if(data.raw in global_table)
        return global_table[data.raw];
    else
        return data.raw;
}
function parseIdentifierExpression(data){
    if(data.name in local_table){
        return local_table[data.name];}
    //else if(data.name in global_table)
    //    return global_table[data.name]
    else
        return data.name;
}
function parseUnaryExpression(data){
    return '-'+parseDataType[data.argument.type](data.argument);
}
function blockExpression(data,toToken)
{
    for(let i=0;i<data.body.length;i++)
    {
        parseDataType[data.body[i].type](data.body[i],toToken);
    }
    return data.body.length;
}

export {symbolizer,getGreenLines,getRedLines};
