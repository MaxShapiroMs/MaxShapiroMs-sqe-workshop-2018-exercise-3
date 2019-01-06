import $ from 'jquery';
//import {parseCode} from './code-analyzer';
//import {symbolizer,getGreenLines,getRedLines} from './Symbolizer';
import {symbolizer} from './Symbolizer';
//var newLine,i,j;
//var greenLines=getGreenLines();
//var redLines=getRedLines();
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        getSymbolizer();
        //getTable();
    });
});
function getSymbolizer(){
    let codeToParse = $('#codePlaceholder').val();
    let parsedCode = symbolizer(codeToParse,$('#parameterPlaceHolder').val());


    if(greenLines.length>0){i=0;}
    if(redLines.length>0){j=0;}
    for(let line in parsedCode.split('\n')) {
        checkColor(line,parsedCode);
    }
}
function checkColor(line,parsedCode){
    let newLine = getColor(greenLines, redLines, line, i, j);
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
function getTable() {

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
}