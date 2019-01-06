import * as esprima from 'esprima';
let token;
const parseCode = (codeToParse) => {
    token=new Array();
    let parsedCode = esprima.parseScript(codeToParse,{ loc : true });
    parseData(parsedCode.body,true);
    return token;
};

const parseDataType = {
    'FunctionDeclaration': parseFunction,
    'VariableDeclaration': parseVariable,
    'ExpressionStatement': parseExpression,
    'ReturnStatement': parseReturn,
    'WhileStatement': parseWhile,
    'ForStatement': parseFor,
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

function parseData(data,shouldParse)
{
    if(shouldParse){
        for(let i=0;i<data.length;i++) {
            parseDataType[data[i].type](data[i],shouldParse);
        }
    }
}

function parseFunction(data,shouldParse){
    if(shouldParse) {
        token.push({
            'Line': data.loc.start.line,
            'Type': data.type,
            'Name': data.id.name,
            'Condition': '',
            'Value': ''
        });
        for (let i = 0; i < data.params.length; i++)
            token.push({
                'Line': data.loc.start.line,
                'Type': 'FunctionDeclaration',
                'Name': data.params[i].name,
                'Condition': '',
                'Value': ''
            });
    }
    blockExpression(data.body,shouldParse);
}
function parseVariable(data,shouldParse){
    for(let i=0;i<data.declarations.length;i++)
    {

        if(data.declarations[i].init==null && shouldParse)
            token.push({'Line':data.loc.start.line , 'Type': 'VariableDeclaration' , 'Name': data.declarations[i].id.name , 'Condition':'' , 'Value':'null'});
        else{
            parseVariableExpression(data.declarations[i],shouldParse);
        }

    }
}
function parseVariableExpression(data,shouldParse){
    if(data.init.raw!=null && shouldParse){
        token.push({'Line':data.loc.start.line , 'Type': 'VariableDeclaration' , 'Name': data.id.name , 'Condition':'' , 'Value':data.init.raw});
        //addToRelevantTable(data,data.init.raw);
    }
    else{
        if(shouldParse){
            token.push({'Line':data.loc.start.line , 'Type': 'VariableDeclaration' , 'Name': data.id.name , 'Condition':'' , 'Value':parseBinaryExpression(data.init)});
            //addToRelevantTable(data,parseBinaryExpression(data.init));
        }
    }
}
function parseExpression(data,shouldParse){
    parseDataType[data.expression.type](data.expression,shouldParse);
}
function parseReturn(data,shouldParse){
    if(shouldParse)
        token.push({'Line':data.loc.start.line, 'Type':data.type,'Name':'','Condition':'', 'Value':parseDataType[data.argument.type](data.argument)});
}
function parseWhile(data,shouldParse){
    if(shouldParse)
        token.push({'Line':data.loc.start.line , 'Type': data.type , 'Name': '' , 'Condition':parseDataType[data.test.type](data.test) , 'Value':''});
    blockExpression(data.body,shouldParse);
}
function parseFor(data,shouldParse){
    if(shouldParse)
        token.push({'Line':data.loc.start.line , 'Type': data.type , 'Name': '' , 'Condition':parseDataType[data.test.type](data.test) , 'Value':''});
    parseDataType[data.init.type](data.init);
    parseDataType[data.test.type](data.test);
    parseDataType[data.update.type](data.update);
    blockExpression(data.body,shouldParse);
}

function parseIf(data,shouldParse){
    //let colorFlag=determineColor(parseDataType[data.test.type](data.test));
    let consequentDepth;
    let alternateDepth;
    consequentDepth = parseDataType[data.consequent.type](data.consequent,false);
    alternateDepth = parseDataType[data.alternate.type](data.alternate,false);
    if(shouldParse)
        token.push({'Line':data.loc.start.line , 'Type': data.type , 'Name': '' , 'Condition':parseDataType[data.test.type](data.test) , 'Value':'', 'consequentDepth':consequentDepth,'alternameDepth':alternateDepth});
    //if(colorFlag=='Green'){
    parseDataType[data.consequent.type](data.consequent,shouldParse)+1;
    //}
    if(data.alternate!=null)
        return parseDataType[data.alternate.type](data.alternate,shouldParse)+1;
}
function parseUpdate(data){
    return data;
}
function parseAssignment(data,shouldParse){
    if(shouldParse)
        token.push({'Line':data.loc.start.line, 'Type':data.type,'Name':parseDataType[data.left.type](data.left),'Condition':'', 'Value':parseDataType[data.right.type](data.right)});
    return 1;
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
    return data.object.name+'['+parseDataType[data.property.type](data.property)+']';
}
function parseLiteral(data){
    return data.raw;
}
function parseIdentifierExpression(data){
    return data.name;
}
function parseUnaryExpression(data){
    return '-'+parseDataType[data.argument.type](data.argument);
}
function blockExpression(data,shouldParse)
{///////////////////////////might need to add a counter here
    for(let i=0;i<data.body.length;i++)
    {
        parseDataType[data.body[i].type](data.body[i],shouldParse);
    }
}

export {parseCode};
