import $ from 'jquery';
//import {parseCode} from './code-analyzer';
import {symbolizer,getGreenLines,getRedLines} from './Symbolizer';
import * as flowchart from 'flowchart.js';
//import {symbolizer} from './Symbolizer';
var newLine,i,j;
var greenLines=getGreenLines();
var redLines=getRedLines();
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        getSymbolizer();
        //getTable();
    });
});
function getSymbolizer(){
    let codeToParse = $('#codePlaceholder').val();
    let parsedCode = symbolizer(codeToParse,$('#parameterPlaceHolder').val());
    var diagram = flowchart.parse(parsedCode);
    diagram.drawSVG('diagram',{'line-width': 5, 'maxWidth': 100, 'line-length': 100, 'text-margin': 10, 'font-size': 14, 'font': 'normal', 'font-family': 'Helvetica', 'font-weight': 'normal', 'font-color': 'black', 'line-color': 'black', 'element-color': 'black', 'fill': 'white', 'yes-text': 'True', 'no-text': 'False', 'arrow-end': 'block', 'scale': 1, 'symbols': {'start': {'font-color': 'black', 'element-color': 'black', 'fill': 'green'}, 'end': {'class': 'end-element'}}, 'flowstate': {'green': {'fill': 'green'}, 'red': {'fill': 'red'},}});

    if(greenLines.length>0){i=0;}
    if(redLines.length>0){j=0;}
    for(let line in parsedCode.split('\n')) {
        checkColor(line,parsedCode);
    }
}
function checkColor(line,parsedCode){
    newLine = getColor(greenLines, redLines, line, i, j);
    if (newLine.getAttribute('class') == 'greenColor')
        i++;
    else if (newLine.getAttribute('class') == 'redColor')
        j++;
    var node = document.createTextNode(parsedCode.split('\n')[line]);
    newLine.appendChild(node);
    document.getElementById('parsedCode').appendChild(newLine);
}
function getColor(green,red,line,i,j){
    let tempLine=document.createElement('P');
    if(line==green[i]-1) {
        tempLine.setAttribute('class', 'greenColor');
        i++;
    }else if(line==red[j]-1) {
        tempLine.setAttribute('class', 'redColor');
        j++;
    }return tempLine;
}
/*function getTable() {

    let codeToParse = $('#codePlaceholder').val();
    let parsedCode = symbolizer(codeToParse,$('#parameterPlaceHolder').val());
    let tableHtml = '<table><tr>';
    for (let j in parsedCode[0]) {
        tableHtml += '<th>' + j + '</th>';
    }
    tableHtml += '</tr>';
    for (let i = 0; i < parsedCode.length; i++) {
        tableHtml += '<tr>';
        for (let j in parsedCode[i]) {
            tableHtml += '<td>' + parsedCode[i][j] + '</td>';
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</table>';
    document.getElementById('parsedCode').innerHTML = tableHtml;
}*/