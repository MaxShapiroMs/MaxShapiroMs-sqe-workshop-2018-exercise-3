import assert from 'assert';
import {symbolizer} from '../src/js/Symbolizer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('function func(x,y){}','1,2')),
            '\"st=>start: func\\n\"'
        );
    });
});
describe('The javascript parser', () => {
    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('let a = 1;','')),
            '\"st=>start: func\\nst=>start: func\\nst=>start: func\\n\"'
        );
    });
});
describe('The javascript parser', () => {
    it('is parsing a simple function correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('function binarySearch(X, V, n){return 1;}','1,1,1')),
            '\"st=>start: func\\nst=>start: func\\nst=>start: func\\nst=>start: func\\nst=>start: func\\nst=>start: binarySearch\\nend=>end: end\\n\\n\"'
        );
    });
});
describe('The javascript parser', () => {
    it('is parsing a simple if condition correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('function func(low,high){\n' +
                'let i=0;\n' +
                'if(i<high){\n' +
                '}\n' +
                '}','1,5')),
            '\"function func(low,high){\\nlet i=0\\nif(0<high){\\n}\\n}\\n\"'
        );
    });
});
describe('The javascript parser', () => {
    it('is parsing a simple if with else condition correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('function func(low,high){\n' +
                    'let i=0;\n' +
                    'if(i<high){\n' +
                    '}\n' +
                    'else{\n' +
                    '}\n' +
                    '}','1,5')),
            '\"function func(low,high){\\nlet i=0\\nif(0<high){\\nelse{\\nelse{\\n}\\n}\\n\"'
        );
    });
});
describe('The javascript parser', () => {
    it('is parsing a example given correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n','1,1,3')),
            ''
    });
});
describe('The javascript parser', () => {
    it('is parsing a another example given correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n','1,1,3')),
            '\"function foo(x, y, z){\\n    let a =x+1\\n    let b =x+1+y\\n    let c =0\\nc=x+1+x+1+y\\nz=x+1+x+1+y*2\\nreturn z\\n        z = c * 2;\\n    }\\n    \\n    return z;\\n}\\n\"'
        );
    });
});
describe('The javascript parser', () => {
    it('is parsing a let before function correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('let w=0;\n' +
                'function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n','1,1,1')),
            '\"let w=0\\nfunction foo(x, y, z){\\n    let a =x+1\\n    let b =x+1+y\\n    let c =0\\nc=x+1+x+1+y\\nz=x+1+x+1+y*2\\nreturn z\\n        z = c * 2;\\n    }\\n    \\n    return z;\\n}\\n\"'
        );
    });
});
describe('The javascript parser', () => {
    it('is parsing a string in the inputvector correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('function foo(x, y, z){}','"testString","hello","helloAgain"')),
            '\"function foo(x, y, z){}\\n\"'
        );
    });
});
describe('The javascript parser', () => {
    it('is parsing a combination of inputs correctly', () => {
        assert.equal(
            JSON.stringify(symbolizer('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z[2]) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z[1] + c;\n' +
                '    } else if (b < z[2] * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z[1] + c;\n' +
                '    } else {\n' +
                '        c = c + z[1] + 5;\nreturn x + y + z[2] + c;\n}\n}\n','1,2,["hello",2,1]')),
            '\"function foo(x, y, z){\\n    let a =x+1\\n    let b =x+1+y\\n    let c =0\\n    \\n    if (x+1+y<z[2]) {\\nc=0+5\\nreturn x+y + (z[1]) + (0+5)\\n    } else if (x+1+y<z[2]*2) {\\nc=0+x + (5)\\nreturn x+y + (z[1]) + (0+x + (5))\\n    } else {\\nc=0+z[1] + (5)\\nreturn x+y + (z[2]) + (0+z[1] + (5))\\n}\\n}\\n\"'
        );
    });
});

