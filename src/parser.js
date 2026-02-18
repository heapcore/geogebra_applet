function isTypedWord(word) {
    return isId(word) || isColor(word) || isNum(word) || isList(word);
}

function matchesPlaceholder(placeholder, word) {
    if (subString("_id", placeholder)) {
        return { ok: isId(word), kind: "id" };
    }
    if (subString("_color", placeholder)) {
        return { ok: isColor(word), kind: "color" };
    }
    if (subString("_number", placeholder)) {
        return { ok: isNum(word), kind: "number" };
    }
    if (subString("_list", placeholder)) {
        return { ok: isList(word), kind: "list" };
    }
    return { ok: false, kind: "" };
}

function collectCapturedWords(captured) {
    currentids.clear();
    currentcolors.clear();
    currentnumbers.clear();
    currentlists.clear();

    for (var i = 0; i < captured.ids.length; i++) {
        currentids.add(captured.ids[i]);
    }
    for (var i = 0; i < captured.colors.length; i++) {
        currentcolors.add(captured.colors[i]);
    }
    for (var i = 0; i < captured.numbers.length; i++) {
        currentnumbers.add(captured.numbers[i]);
    }
    for (var i = 0; i < captured.lists.length; i++) {
        currentlists.add(captured.lists[i]);
    }
}

function patternMatchesTokens(patternItem, inputList, captureValues) {
    var r = 0;
    var captured = { ids: [], colors: [], numbers: [], lists: [] };

    for (var q = 0; q < patternItem.count(); q++) {
        var token = patternItem.words[q];
        if (token[0] == "_") {
            while ((r < inputList.count() - 1) && (!isTypedWord(inputList.words[r]))) {
                r += 1;
            }

            var currentWord = inputList.words[r];
            if (typeof currentWord === "undefined") {
                return false;
            }

            var matchResult = matchesPlaceholder(token, currentWord);
            if (!matchResult.ok) {
                return false;
            }

            if (captureValues) {
                if (matchResult.kind == "id") captured.ids.push(currentWord);
                if (matchResult.kind == "color") captured.colors.push(currentWord);
                if (matchResult.kind == "number") captured.numbers.push(currentWord);
                if (matchResult.kind == "list") captured.lists.push(currentWord);
            }
        } else {
            while ((token != inputList.words[r]) && (r != inputList.count() - 1)) {
                r += 1;
            }
            if (token != inputList.words[r]) {
                return false;
            }
        }
    }

    if (captureValues) {
        collectCapturedWords(captured);
    }
    return true;
}

function findMatchingPatternIndex(a, captureValues) {
    var counts = countKeys(a);
    var k = counts[0];
    var i = counts[1];
    var n = counts[2];
    var l = counts[3];

    for (var p = 0; p < countp; p++) {
        var pat = pattern[p];
        if ((pat.keys == k) && (pat.ids == i) && (pat.numbers == n) && (pat.lists == l)) {
            if (patternMatchesTokens(pat, a, captureValues)) {
                return p;
            }
        }
    }
    return -1;
}

function recognizePattern(a) {
    var index = findMatchingPatternIndex(a, true);
    if (index == -1) {
        return "";
    }
    return pattern[index].answer;
}

// function, which determines number of pattern from given list a
function incId(s) {
    var p = strPos('_', s);
    if (p == -1) {
        return s + "_1";
    }
    var prefix = strCopy(s, 0, p + 1);
    var suffix = strCopy(s, p + 1, s.length - p - 1);
    var n = parseInt(suffix, 10);
    if (isNaN(n)) {
        return s + "_1";
    }
    return prefix + String(n + 1);
}

function existId(id) {
    return usedids.words.indexOf(id) !== -1;
}

function existIdGGB(id) {
    const length = ggb.getObjectNumber();
    for (let j = 0; j < length; j++) {
        if (id === ggb.getObjectName(j)) {
            return true;
        }
    }
    return false;
}

function nextId(id) {
    if (id.length == 1) {
        if (id.toLowerCase() == "z") {
            return id == "z" ? "a_1" : "A_1";
        }
        return nextLetter(id);
    }

    var letter = id[0];
    var suffix = id.slice(1);
    if (letter.toLowerCase() == "z") {
        var match = /^_(\d+)$/.exec(suffix);
        if (match) {
            var nextNum = parseInt(match[1], 10) + 1;
            return (letter == "z" ? "a_" : "A_") + String(nextNum);
        }
        return letter == "z" ? "a_1" : "A_1";
    }

    return nextLetter(letter) + suffix;
}

// function, which puts given GeoGebra Command in the database and corrects it
function parseAsObject(s) {
    var i, l, r, p, countlbrackets, countrbrackets, counteqs;
    var id, newid, inbrackets, inb, p1, objtype, t;
    var objexists, objseq;
    var res = s;

    countlbrackets = (s.match(/\(/g) || []).length;
    countrbrackets = (s.match(/\)/g) || []).length;
    counteqs = (s.match(/=/g) || []).length;

    var lowerRes = res.toLowerCase();
    objtype = "";
    if (subString("line", lowerRes)) objtype = "line";
    else if (subString("segment", lowerRes)) objtype = "segment";
    else if (subString("polygon", lowerRes)) objtype = "polygon";
    else if (subString("midpoint", lowerRes)) objtype = "midpoint";
    else return res;

    if ((countlbrackets === 1) && (countrbrackets === 1) && (counteqs === 1)) {
        objexists = false;
        objseq = false;
        p = strPos('=', s);
        id = strCopy(s, 0, p);
        newid = id;
        l = strPos('(', s);
        r = strPos(')', s);
        inbrackets = strCopy(s, l + 1, r - l - 1);
        inb = inbrackets;

        for (var k = 0; k < countobjects; k++) {
            p1 = obj[k].points[0];
            for (var j = 1; j < obj[k].countPoints(); j++) {
                p1 = p1 + "," + obj[k].points[j];
            }
            if ((p1 === inb) && (objtype === obj[k].objType)) {
                objexists = true;
                break;
            }
        }
        if (objexists) {
            objseq = true;
            res = "";
        }
        else {
            while (existId(newid) || existIdGGB(newid)) newid = incId(newid);
            t = strPos("=", res);
            res = strDelete(res, 0, t);
            res = newid + res;
        }
        if (!objseq) {
            obj[countobjects] = new myObject(objtype, newid);
            usedids.add(newid);

            var pointIds = inb.split(",");
            for (var idx = 0; idx < pointIds.length; idx++) {
                id = pointIds[idx];
                if (isId(id) && (!pointExists(id))) {
                    t = id + "=(<_X,_Y>)";
                    parseCommand(t);
                }
                obj[countobjects].addPoint(id);
            }
            countobjects++;
        }
    }
    return res;
}

function pointExists(s) {
    var ptexists = false;
    var i = strPos('=', s);
    if (i !== -1) {
        s = strCopy(s, 0, i);
    }
    var length = ggb.getObjectNumber();
    for (var j = 0; j < length; j++) {
        var nm = ggb.getObjectName(j);
        if ((s === nm) && (ggb.getObjectType(nm) === "point")) {
            ptexists = true;
            break;
        }
    }
    return ptexists;
}

function isRational(s) {
    if (!s) {
        return false;
    }
    return /^-?\d+(?:\.\d+)?$/.test(s);
}

function isPointCommand(v) {
    var match = /^([^=]+)=\(([^,]+),([^)]+)\)$/.exec(v);
    if (!match) {
        return false;
    }
    var id = match[1];
    var leftnum = match[2];
    var rightnum = match[3];
    return isId(id) && isRational(leftnum) && isRational(rightnum);
}

function isCorrectPoint(v) {
    var match = /^([^=]+)=\(([^,]+),([^)]+)\)$/.exec(v);
    if (!match) {
        return false;
    }
    var x = parseFloat(match[2]);
    var y = parseFloat(match[3]);
    if (isNaN(x) || isNaN(y)) {
        return false;
    }
    return (x1 <= x) && (x <= x2) && (y1 <= y) && (y <= y2);
}

function addPoint(v) {
    var i = strPos('=', v);
    var id = strCopy(v, 0, i);
    usedids.add(id);
}

function identificator(currentid, arn, num, reg) {
    var i, k, p, count;
    var f;
    var s, v;

    var identificator_result;
    s = "";
    count = 0;
    i = 0;
    while ((count !== num) && (i <= currentid.length)) {
        p = ((currentid[i] >= 'A') && (currentid[i] <= 'Z'));
        count += p;
        i += 1;
    }
    i -= 1;
    k = i;
    while ((k < currentid.length) && (((currentid[k + 1] >= '0') && (currentid[k + 1] <= '9')) || (currentid[k + 1] === '_'))) {
        k += 1;
    }
    if (count === num) {
        s = strCopy(currentid, i, k - i + 1);
        if (reg) {
            s = s.toLowerCase();
        }
    }
    identificator_result = s;
    return identificator_result;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function countPoints() {
    var length = ggb.getObjectNumber();
    var res = 0;
    for (var j = 0; j < length; j++) {
        var nm = ggb.getObjectName(j);
        if (ggb.getObjectType(nm) === "point") {
            res++;
        }
    }
    return res;
}

// function, which returns the coordinates for new point
function createPointCoords() {
    var i, j;
    var vectx = 0;
    var vecty = 1;
    var stepx = (x2 - x1) / 5;
    var stepy = (y2 - y1) / 5;
    var x = [];
    var y = [];

    x[0] = stepx * 2;
    y[0] = stepy * 2;
    for (i = 1; i < 25; i++) {
        x[i] = x[i - 1] + stepx * vectx;
        y[i] = y[i - 1] + stepy * vecty;
        if (i == 1) { vectx = 1; vecty = 0; }
        if (i == 2) { vectx = 0; vecty = -1; }
        if (i == 4) { vectx = -1; vecty = 0; }
        if (i == 6) { vectx = 0; vecty = 1; }
        if (i == 9) { vectx = 1; vecty = 0; }
        if (i == 12) { vectx = 0; vecty = -1; }
        if (i == 16) { vectx = -1; vecty = 0; }
        if (i == 20) { vectx = 0; vecty = 1; }
    }
    for (i = 0; i < 25; i++) {
        x[i] = x[i] + x1 + stepx / 2;
        y[i] = y[i] + y1 + stepy / 2;
    }

    var points = [];
    var length = ggb.getObjectNumber();
    for (j = 0; j < length; j++) {
        var nm = ggb.getObjectName(j);
        if (ggb.getObjectType(nm) == "point") {
            points.push({
                x: ggb.getXcoord(nm),
                y: ggb.getYcoord(nm),
            });
        }
    }

    var pointCount = points.length;
    if (pointCount > 24) {
        return [-10000000, -10000000];
    }

    var chosen = 0;
    if (pointCount > 0) {
        var rangeMax = pointCount <= 5 ? 8 : 24;
        var found = false;
        for (var attempt = 0; attempt < 200 && !found; attempt++) {
            var candidate = getRandomInt(0, rangeMax);
            var occupied = false;
            for (j = 0; j < points.length; j++) {
                if ((Math.abs(points[j].x - x[candidate]) < stepx / 2) && (Math.abs(points[j].y - y[candidate]) < stepy / 2)) {
                    occupied = true;
                    break;
                }
            }
            if (!occupied) {
                chosen = candidate;
                found = true;
            }
        }
    }

    var x0 = roundPlus(x[chosen] + stepx * (Math.random() - 0.5) / 2, 1);
    var y0 = roundPlus(y[chosen] + stepy * (Math.random() - 0.5) / 2, 1);
    return [x0, y0];
}

function operationStrExpr(s) {
    var depth = 0;
    var op = "";

    for (var i = 0; i < s.length; i++) {
        if (s[i] == "(") depth++;
        if (s[i] == ")") depth--;
        if ((s[i] == "+" || s[i] == "-" || s[i] == "*" || s[i] == "/") && depth === 0) {
            op = s[i];
        }
    }
    return op;
}

function operandsStrExpr(s) {
    function readGroup(str, startPos) {
        var start = strPos("(", str.slice(startPos));
        if (start == -1) {
            return { value: "", next: str.length };
        }
        start += startPos;
        var depth = 1;
        var i = start + 1;
        while (i < str.length && depth > 0) {
            if (str[i] == "(") depth++;
            if (str[i] == ")") depth--;
            i++;
        }
        return {
            value: str.slice(start + 1, i - 1),
            next: i,
        };
    }

    var leftGroup = readGroup(s, 0);
    var rightGroup = readGroup(s, leftGroup.next);
    return [parseFloat(leftGroup.value), parseFloat(rightGroup.value)];
}

function deleteObject(n) {
    if ((n < 0) || (n >= countobjects)) {
        return;
    }
    obj.splice(n, 1);
    countobjects = obj.length;
}

function deletePoint(arg) {
    var i, k;
    var toDelete = [];
    for (i = 0; i < countobjects; i++) {
        for (k = 0; k < obj[i].countPoints(); k++) {
            if ((obj[i].points[k] == arg) && (toDelete.indexOf(i) == -1)) {
                toDelete.push(i);
            }
        }
    }
    for (i = toDelete.length - 1; i >= 0; i--) {
        deleteObject(toDelete[i]);
    }
}

// function, which returns GeoGebra Command string by pattern s
function recognizeAnswer(s) {
    function parseTemplateArgs(segment, defaults) {
        var args = segment.split(",");
        var res = {
            id: defaults.id,
            arn: defaults.arn,
            num: defaults.num,
            reg: defaults.reg,
        };
        if (args.length > 0 && args[0] !== "") res.id = parseInt(args[0], 10);
        if (args.length > 1 && args[1] !== "") res.arn = parseInt(args[1], 10);
        if (args.length > 2 && args[2] !== "") res.num = parseInt(args[2], 10);
        if (args.length > 3 && args[3] !== "") res.reg = (args[3] === "lower");
        return res;
    }

    function pickSeedId(useLower) {
        var best = null;
        for (var idx = 0; idx < usedids.count(); idx++) {
            var candidate = usedids.words[idx];
            var isLower = candidate === candidate.toLowerCase();
            if (isLower === useLower) {
                if ((best === null) || (best < candidate)) {
                    best = candidate;
                }
            }
        }
        if (best === null) {
            return useLower ? "a" : "A";
        }
        // Keep legacy behavior.
        if (best === best.toLowerCase()) {
            return useLower ? "a" : "A";
        }
        return best;
    }

    var i, l, r, id, arn, num, z, z1, ptpos, cnt, t;
    var x0, y0, left, right;
    var v, p, ans2, meth;
    var c;
    var reg;

    while (subString('<', s)) {
        l = strPos('<', s);
        i = l + 1;
        cnt = 1;
        while (cnt != 0) {
            if (s[i] == '<') cnt += 1;
            if (s[i] == '>') cnt -= 1;
            i += 1;
        }
        r = i - 1;
        v = strCopy(s, l + 1, r - l - 1);
        p = strCopy(s, l, r - l + 1);
        if (subString('<', v)) {
            ans2 = "";
            ans2 = recognizeAnswer(v);
            if (subString('+', ans2) || subString('-', ans2) || subString('*', ans2) || subString('/', ans2)) {
                c = operationStrExpr(ans2);
                ans2 = operandsStrExpr(ans2);
                left = ans2[0];
                right = ans2[1];
                switch (c) {
                    case '+': ans2 = roundPlus(left + right, 1); break;
                    case '-': ans2 = roundPlus(left - right, 1); break;
                    case '*': ans2 = roundPlus(left * right, 1); break;
                    case '/': ans2 = roundPlus(left / right, 1);
                    break;
                }
            }
            s = s.replaceAll(p, ans2);
        }
        else {
            if (subString("_id", v)) {
                id = 0;
                arn = 1;
                num = 1;
                reg = false;
                ptpos = strPos('.', v);
                meth = "";
                if (ptpos != -1) {
                    meth = strCopy(v, ptpos + 1, v.length - ptpos - 1);
                }
                l = strPos('(', v);
                r = strPos(')', v);
                v = strCopy(v, l + 1, r - l - 1);
                l = strPos(',', v);
                id = parseInt(strCopy(v, 0, l), 10);
                v = strDelete(v, 0, l + 1);
                l = strPos(',', v);
                if (l != -1) {
                    arn = parseInt(strCopy(v, 0, l), 10);
                    v = strDelete(v, 0, l + 1);
                }
                else {
                    arn = parseInt(v, 10);
                    v = "";
                }
                if (v != "") {
                    l = strPos(',', v);
                    if (l != -1) {
                        num = parseInt(strCopy(v, 0, l), 10);
                        v = strDelete(v, 0, l + 1);
                    }
                    else {
                        num = parseInt(v, 10);
                        v = "";
                    }
                    if (v !== "") {
                        if (v === "lower") reg = true;
                        if (v === "upper") reg = false;
                    }
                }
                v = identificator(currentids.words[id], arn, num, reg);
                lastpnt = v;
                if (meth !== "") {
                    if (meth === "currX") {
                        v = ggb.getXcoord(v);
                    }
                    if (meth === "currY") {
                        v = ggb.getYcoord(v);
                    }
                }
                s = s.replaceAll(p, v);
            }
            if (subString("_color", v)) {
                l = strPos('(', v);
                r = strPos(')', v);
                v = strCopy(v, l + 1, r - l - 1);
                id = parseInt(v, 10);
                v = currentcolors.words[id];
                s = s.replaceAll(p, v);
            }
            if (subString("_number", v)) {
                l = strPos('(', v);
                r = strPos(')', v);
                v = strCopy(v, l + 1, r - l - 1);
                id = parseInt(v, 10);
                v = currentnumbers.words[id];
                v = v.replaceAll(",", ".");
                s = s.replaceAll(p, v);
            }
            if (subString("_X,_Y", v)) {
                var crds = createPointCoords();
                x0 = crds[0];
                y0 = crds[1];
                v = x0 + ',' + y0;
                s = s.replaceAll(p, v);
            }
            if (subString("_list", v)) {
                var z2 = "_list(";
                t = 0;
                id = 0;
                arn = 1;
                num = 1;
                reg = false;
                l = strPos('(', v);
                r = strPos(')', v);
                v = strCopy(v, l + 1, r - l - 1);
                l = strPos(',', v);
                t = strCopy(v, 0, l);
                z2 = z2 + t + ",";
                v = strDelete(v, 0, l + 1);
                l = strPos(',', v);
                id = strCopy(v, 0, l);
                if (id === 'n') {

                }
                else if (id === 'i') {

                }
                else {
                    id = parseInt(id, 10);
                }
                z2 = z2 + id;
                v = strDelete(v, 0, l + 1);
                if (v !== "") {
                    var parsedList = parseTemplateArgs(v, { id: 0, arn: 1, num: 1, reg: false });
                    arn = parsedList.arn;
                    num = parsedList.num;
                    reg = parsedList.reg;
                }
                z = currentlists.words[t];
                var curids = z.split("$");
                for (t = 0; t < curids.length - 1; t++) {
                    z1 = s;
                    v = identificator(curids[t], arn, num, reg);
                    z1 = z1.replaceAll(p, v);
                    if (subString(z2, z1)) {
                        z1 = z1.replaceAll(z2, "_id(" + currentids.count());
                    }
                    currentids.add(curids[t]);
                    parseCommand(z1);
                }
                v = identificator(curids[curids.length - 1], arn, num, reg);
                s = s.replaceAll(p, v);
                s = s.replaceAll(z2, "_id(" + currentids.count());
                currentids.add(curids[curids.length - 1]);
            }
            if (subString("_lastfig", v)) {
                if (!pointislast) {
                    var z2 = "_lastfig";
                    var lastob = obj[countobjects - 1];
                    var curids = new wordList();
                    for (var t = 0; t < lastob.countPoints(); t++) {
                        curids.add(lastob.points[t]);
                    }
                    arn = 1;
                    num = 1;
                    reg = false;
                    for (t = 0; t < curids.count() - 1; t++) {
                        z1 = s;
                        v = identificator(curids.words[t], arn, num, reg);
                        z1 = z1.replaceAll(p, v);
                        if (subString(z2, z1)) {
                            z1 = z1.replaceAll(z2, "_id(" + currentids.count() + ",1)");
                        }
                        currentids.add(curids.words[t]);
                        parseCommand(z1);
                    }
                    v = identificator(curids.words[curids.count() - 1], arn, num, reg);
                    s = s.replaceAll(p, v);
                    s = s.replaceAll(z2, "_id(" + currentids.count() + ",1)");
                    currentids.add(curids.words[curids.count() - 1]);
                }
                else {
                    var z2 = "_lastfig";
                    s = s.replaceAll(p, lastpnt);
                    s = s.replaceAll(z2, "_id(" + currentids.count() + ",1)");
                    currentids.add(lastpnt);
                }
            }
            if (subString("_littlenum", v)) {
                v = littlenum;
                s = s.replaceAll(p, v);
            }
            if (subString("_newid", v)) {
                if (usedids.count() === 0) {
                    if (subString("low", v)) {
                        v = "a";
                    }
                    else {
                        v = "A";
                    }
                }
                else {
                    v = pickSeedId(subString("low", v));
                    while (existId(v)) v = nextId(v);
                }
                usedids.add(v);
                if (v !== v.toLowerCase()) {
                    lastpnt = v;
                }

                s = s.replaceAll(p, v);
            }
        }
    }
    if (subString("Delete", s)) {
        deletePoint(currentids.words[id]);
    }
    if (subString("error", s)) {
        s = "";
        alert("Error!");
        throw "MyError";
    }
    return s;
}

// function, which get GeoGebra Command by pattern v and adds it to the database
function parseCommand(v) {
    var ans = recognizeAnswer(v);

    function evalAndStore(command) {
        ggb.evalCommand(command);
        allcmds += command + "<br>";
    }

    if (!isPointCommand(ans)) {
        pointislast = false;
        ans = parseAsObject(ans);
        if (ans !== "") {
            evalAndStore(ans);
        }
    }
    else {
        pointislast = true;
        if (!pointExists(ans) && isCorrectPoint(ans)) {
            addPoint(ans);
            evalAndStore(ans);
        }
    }
    return true;
}

// function, which process initial data directly from html forms
function runParser() {
    var modeForm = document.myForm;
    var inputForm = document.myForm3;
    var num = 0;
    var radios = modeForm.getElementsByTagName("input");

    for (var k = 0; k < radios.length; k++) {
        if ((radios[k].type == "radio") && radios[k].checked) {
            num = k;
            break;
        }
    }

    main();
    var s = inputForm.inputfield.value;

    if (num === 0) {
        ggb.evalCommand(s);
    }
    if (num === 1) {
        var parts = strReplaceEnters(s).split(".");
        for (var i = 0; i < parts.length; i++) {
            var v = strTrim(parts[i]);
            if (v === "") {
                continue;
            }
            list.clear();
            list.parseFromString(v);
            v = recognizePattern(list);
            if (v !== "") {
                parseCommand(v);
            }
        }
    }
}
