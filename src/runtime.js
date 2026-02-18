let flag = false;
let allcmds = "";
let pointislast = false;
let lastpnt = "";

const punctSet = new Set(["'", ",", ".", "?", "!", ":", ";"]);
const alphaRegex = /^[A-Z]$/;
const digitRegex = /^[0-9]$/;

const x1 = 1;
const x2 = 11;
const y1 = 1;
const y2 = 11;

const littlenum = ((x2 - x1) + (y2 - y1)) / 100;

let countp = 0;
let countobjects = 0;

let obj = [];
let pattern = [];
const list = new wordList();
const keywords = new wordList();

const usedids = new wordList();
const currentids = new wordList();
const currentlists = new wordList();
const colors = new wordList();
const currentcolors = new wordList();
const currentnumbers = new wordList();

let ggb = null;
let plotUpdateTimer = null;

function ggbOnInit() {
    ggb = document.ggbApplet;
    if (!plotUpdateTimer) {
        plotUpdateTimer = setInterval(updPlot, 100);
    }
}

function updPlot() {
    if (!ggb) {
        return;
    }
    if (!flag) {
        if (ggb.evalCommand("ZoomIn[" + x1 + "," + y1 + "," + x2 + "," + y2 + "]")) {
            flag = true;
        }
    }
}

function appletDeleteAll() {
    allcmds = "";
    const length = ggb.getObjectNumber();
    let i = 0;
    const names = [];
    for (i = 0; i < length; i++) {
        names[i] = ggb.getObjectName(i);
    }
    for (i = 0; i < length; i++) {
        ggb.deleteObject(names[i]);
    }
    usedids.clear();
    countobjects = 0;
    obj = [];
}

// round function, x - number, n - number digits
function roundPlus(x, n) {
    if (isNaN(x) || isNaN(n)) return false;
    const m = Math.pow(10, n);
    return Math.round(x * m) / m;
}

function printCommands() {
    let str = "To draw this image, you must enter the following GeoGebra Commands:" + "<br>";
    str += allcmds;
    const sdiv = document.getElementById("cmds");
    sdiv.innerHTML = str;
}

function nextLetter(s){
    return s.replace(/([a-zA-Z])[^a-zA-Z]*$/, function(a){
        var c = a.charCodeAt(0);
        switch(c){
            case 90: return 'A';
            case 122: return 'a';
            default: return String.fromCharCode(++c);
        }
    });
}

function inPunct(c) {
    return punctSet.has(c);
}

function inAlpha(c) {
    return alphaRegex.test(c);
}

function inNum(c) {
    return digitRegex.test(c);
}

function subString(sub, str) {
    return str.includes(sub);
}

function strTrim(s) {
    return s.trim();
}

function removeDoubleSpaces(s) {
    return s.replace(/\s{2,}/g, " ");
}

function strDelete(s, m, count) {
    return s.slice(0, m) + s.slice(m + count);
}

function strInsert(src, s, m) {
    if (m > src.length) {
        return src;
    }
    return src.slice(0, m) + s + src.slice(m);
}

function deleteAllSymbols(s) {
    const tild = "~";
    let res = "";
    for (let k = 0; k < s.length; k++) {
        if (inPunct(s[k])) {
            if ((s[k] === ",") && (k !== 0) && (k !== (s.length - 1))) {
                if (inNum(s[k - 1]) && inNum(s[k + 1])) {
                    res += tild;
                }
            }
        }
        else {
            res += s[k];
        }
    }
    s = res;
    let k = strPos(tild, s);
    while (k !== -1) {
        s = s.slice(0, k) + "," + s.slice(k + 1);
        k = strPos(tild, s);
    }
    return s;
}

function isId(s) {
    if (!s) {
        return false;
    }
    // Legacy rules:
    // 1) starts with upper-case letter
    // 2) remaining chars are [A-Z0-9_]
    // 3) no consecutive digits, no consecutive underscores
    if (!/^[A-Z][A-Z0-9_]*$/.test(s)) {
        return false;
    }
    if (/(\d{2}|__)/.test(s)) {
        return false;
    }
    return true;
}

function isList(s) {
    // List is a $-separated list of IDs, e.g. A$B$C
    return /^[A-Z][A-Z0-9_]*(?:\$[A-Z][A-Z0-9_]*)+$/.test(s);
}

function strCopy(s, m, count) {
    return s.slice(m, m + count);
}

function strPos(sub, str) {
    return str.indexOf(sub);
}

function strReplaceEnters(s) {
    return s.replace(/\r?\n/g, " ");
}

function convertIdLists(s) {
    var i = 0, l = 0, r = 0, n = 0;
    var v = "";
    var comma;
    n = s.length;
    while (i < n) {
        comma = false;
        while (!inAlpha(s[i]) && (i < n)) {
            i++;
        }
        l = i;
        while ((inAlpha(s[i]) || inNum(s[i]) || (s[i] === ' ') || (s[i] === '_') || (s[i] === ',')) && (i < n)) {
            if (s[i] === ',') {
                comma = true;
            }
            i++;
        }
        r = i;
        if (comma) {
            while ((s[r] !== ' ') && (r !== n - 1)) {
                r--;
            }
            if (s[r - 1] === ",") r-=2;
            v = strCopy(s, l, r - l);
            v = strTrim(v);
            v = removeDoubleSpaces(v);
            v = v.replaceAll(' ', '');
            v = v.replaceAll(',', '$');
            s = strDelete(s, l, r - l);
            s = strInsert(s, v, l);
        }
    }
    return s;
}

// MyObject's constructor
function myObject(type_, name_) {
    this.objType = type_;
    this.name = name_;
    this.points = [];

    this.addPoint = function(str) {
        this.points.push(str);
    }

    this.countPoints = function() {
        return this.points.length;
    }
}

// WordList's constructor
function wordList() {
    this.words = [];

    // add a new word
    this.add = function(str) {
        this.words.push(str);
    }

    // add words from string
    this.parseFromString = function(s) {
        var i, k;
        var p;

        s = strTrim(s);
        s = removeDoubleSpaces(s);
        s = convertIdLists(s);
        s = deleteAllSymbols(s);
        i = strPos(' ', s);
        while (i != -1) {
            p = strCopy(s, 0, i);
            if (!isId(p) && (!isList(p))) p = p.toLowerCase();
            this.words.push(p);
            s = strDelete(s, 0, i + 1);
            i = strPos(' ', s);
        }
        if (!isId(s) && (!isList(s))) s = s.toLowerCase();
        this.words.push(s);
    }

    // clear all words
    this.clear = function() {
        this.words = [];
    }

    // display number of words
    this.count = function() {
        return this.words.length;
    }
}

// Pattern's constructor
function patternList(s) {
    this.words = [];
    this.answer = "";
    this.keys = 0;
    this.ids = 0;
    this.numbers = 0;
    this.lists = 0;

    // add a new word
    this.add = function(str) {
        this.words.push(str);
    }

    var i, k;

    i = strPos(':', s);
    this.keys = parseInt(strCopy(s, 0, i));
    s = strDelete(s, 0, i + 1);
    i = strPos(':', s);
    this.ids = parseInt(strCopy(s, 0, i));
    s = strDelete(s, 0, i + 1);
    i = strPos(':', s);
    this.numbers = parseInt(strCopy(s, 0, i));
    s = strDelete(s, 0, i + 1);
    i = strPos(':', s);
    this.lists = parseInt(strCopy(s, 0, i));
    s = strDelete(s, 0, i + 1);
    i = strPos('|', s);
    // add words from string
    while (i != -1) {
        this.add(strCopy(s, 0, i));
        s = strDelete(s, 0, i + 1);
        i = strPos('|', s);
    }
    i = strPos(':', s);
    this.add(strCopy(s, 0, i));
    s = strDelete(s, 0, i + 1);
    this.answer = s;

    // display number of words
    this.count = function() {
        return this.words.length;
    }
}

// Initializes English keywords and one-pattern rules.
function main() {
    keywords.clear();
    colors.clear();
    pattern = [];
    keywords.parseFromString("let set in to up right down left delete move paint");
    keywords.parseFromString("point points line midpoint triangle triangles size segment circle radius center quadrilateral quadrilaterals");
    keywords.parseFromString("aqua black blue fuchsia gray green lime maroon navy olive purple red silver teal white yellow");
    colors.parseFromString("aqua black blue fuchsia gray green lime maroon navy olive purple red silver teal white yellow");
    const patternDefs = [
        "2:1:0:0:let|_id(0,1)|point:<_id(0,1)>=(<_X,_Y>)",
        "2:1:0:0:let|_id(0,2)|line:<_id(0,1,1,lower)>=Line(<_id(0,1,1)>,<_id(0,1,2)>)",
        "3:1:0:0:let|_id(0,2)|line|segment:<_id(0,1,1,lower)>=Segment(<_id(0,1,1)>,<_id(0,1,2)>)",
        "3:2:0:0:let|_id(0,1)|midpoint|line|_id(1,2):<_id(0,1)>=Midpoint(<_id(1,1,1)>,<_id(1,1,2)>)",
        "4:2:0:0:let|_id(0,1)|midpoint|line|segment|_id(1,2):<_id(0,1)>=Midpoint(<_id(1,1,1)>,<_id(1,1,2)>)",
        "2:1:0:0:let|_id(0,3)|triangle:<_id(0,1,1,lower)>=Polygon(<_id(0,1,1)>,<_id(0,1,2)>,<_id(0,1,3)>)",
        "4:2:1:0:let|_id(0,1)|circle|center|_id(1,1)|radius|_number(0):<_id(0,1,1,lower)>=Circle(<_id(1,1)>,<_number(0)>)",
        "2:1:0:0:delete|point|_id(0,1):Delete(<_id(0,1)>)",
        "3:1:1:0:set|point|_id(0,1)|size|_number(0):SetPointSize(<_id(0,1)>, <_number(0)>)",
        "4:1:0:0:paint|point|_id(0,1)|in|_color(0):SetColor(<_id(0,1)>, <_color(0)>)",
        "4:1:1:0:move|point|_id(0,1)|up|to|_number(0):SetCoords(<_id(0,1)>,<_id(0,1).currX>,<<_id(0,1).currY>+<_number(0)>>)",
        "4:1:1:0:move|point|_id(0,1)|right|to|_number(0):SetCoords(<_id(0,1)>,<<_id(0,1).currX>+<_number(0)>>,<_id(0,1).currY>)",
        "4:1:1:0:move|point|_id(0,1)|down|to|_number(0):SetCoords(<_id(0,1)>,<_id(0,1).currX>,<<_id(0,1).currY>-<_number(0)>>)",
        "4:1:1:0:move|point|_id(0,1)|left|to|_number(0):SetCoords(<_id(0,1)>,<<_id(0,1).currX>-<_number(0)>>,<_id(0,1).currY>)",
        "2:1:0:0:let|_id(0,4)|quadrilateral:<_id(0,1,1,lower)>=Polygon(<_id(0,1,1)>,<_id(0,1,2)>,<_id(0,1,3)>,<_id(0,1,4)>)",
        "2:0:0:1:let|_list(0,n,1)|points:<_list(0,i,1)>=(<_X,_Y>)",
        "2:0:0:1:let|_list(0,n,3)|triangles:<_list(0,i,1,1,lower)>=Polygon(<_list(0,i,1,1)>,<_list(0,i,1,2)>,<_list(0,i,1,3)>)",
        "2:0:0:1:let|_list(0,n,4)|quadrilaterals:<_list(0,i,1,1,lower)>=Polygon(<_list(0,i,1,1)>,<_list(0,i,1,2)>,<_list(0,i,1,3)>,<_list(0,i,1,4)>)",
        "2:1:0:0:let|point|_id(0,1):<_id(0,1)>=(<_X,_Y>)",
    ];
    pattern = patternDefs.map(function(definition) {
        return new patternList(definition);
    });
    countp = pattern.length;
    return true;
}

function isNum(s) {
    if (!s) {
        return false;
    }
    const normalized = s.replaceAll(",", ".");
    // Legacy behavior accepts digits with optional single dot, including ".5" and "12."
    return /^\d*\.?\d*$/.test(normalized) && normalized !== ".";
}

function isColor(s) {
    return member(s, colors);
}

function member(s, a) {
    return a.words.includes(s);
}

function countKeys(a) {
    var res = [];
    var k = 0, i = 0, n = 0, l = 0;
    for (var p = 0; p < a.count(); p++) {
        if (member(a.words[p], keywords)) k += 1;
        if (isId(a.words[p])) i += 1;
        if (isNum(a.words[p])) n += 1;
        if (isList(a.words[p])) l += 1;
    }
    res[0] = k;
    res[1] = i;
    res[2] = n;
    res[3] = l;
    return res;
}
