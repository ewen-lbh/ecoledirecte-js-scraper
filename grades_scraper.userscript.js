// ==UserScript==
// @name        ED bot
// @namespace    https://ecoledirecte.com/*
// @version      0.0.1
// @description  Ecoledirecte scrapper
// @author       Mx3
// @match        http://ecoledirecte.com/*
// @grant        none
// ==/UserScript==
/*
data[0] is subject names
data[1] is an array of all marks, for each subject
data[10] is an array of all marks, processed, for each subject
data[11] is an array of all marks' coefficients, for each subject
data[2] is subject coeficients
data[990] is subject name DOM element
data[3] is subject averages
data[4] is the global average
data[5] is wether the subject is a subsubject, and its parent.
*/

data = []
data[0] = []
data[990] = []
data[1] = []
data[10] = []
data[11] = []
data[2] = []
data[3] = []
data[4] = []
data[5] = []
subjectsE = document.querySelectorAll('td.discipline')
subjectsE.forEach(subjectE => {
    data[990].push(subjectE)
    data[0].push(getSubjectName(subjectE))
    iterator = data[990].keys()
    for (let key of iterator) {
        // console.log(data[0][key])
        data[5][key] = getSubSubjectParent(data[990][key])
        if (hasAnyGrades(data[990][key])) {
            data[2][key] = getWeightFromSubjectElement(data[990][key])
            data[1][key] = getAllGradesFromSubjectElement(data[990][key])
            // console.log("After getAllGradesFromSubjectElement() : "+data[1][key])
            data[10][key] = getAllTreatedGradesFromArray(data[1][key])
            // console.log("After getAllTreatedGradesFromArray() : "+data[1][key])
            data[11][key] = getAllGradesWeightsFromArray(data[1][key])
            console.log("After getAllGradesWeightsFromArray() : " + data[1][key])
            data[3][key] = getAvg(data[10][key], data[11][key])
        }
    }
});
data[4] = getAvg(data[3], data[2])

function sanitizeGrade(str) {
    return str.replace(/<!--(.*?)-->/gi, '').replace(/ng-if=".+"/gi, '').replace(/<sup class="coef" +>\(([\d.]+)\)<\/sup>/gi, '^$1').replace(/<sub class="quotien" +>\/([\d.]+)<\/sub>/gi, '_$1').replace(/ +/gi, '').replace(',', '.')
}

function getAllGradesFromSubjectElement(ele) {
    returnarr = []
    e = ele.nextElementSibling.nextElementSibling.nextElementSibling.querySelectorAll('span.valeur')
    e.forEach(se => {
        returnarr.push(sanitizeGrade(se.innerHTML))
    });
    return returnarr
}

function getAllTreatedGradesFromArray(inputarr) {
    arr = inputarr.slice(0) //creates a copy of the original array, preventing mutation
    for (var k = 0; k < arr.length; k++) {
        currentGrade = arr[k]
        if (currentGrade.includes('^')) {
            value = currentGrade.replace(/^([\d.]+)\^([\d.]+)/gi, '$1')
            arr[k] = value
        }
        if (currentGrade.includes('_')) {
            value = currentGrade.replace(/^([\d.]+)_([\d.]+)/gi, '$1')
            under = currentGrade.replace(/^([\d.]+)_([\d.]+)/gi, '$2')
            arr[k] = value / under * 20
        }
        arr[k] = parseFloat(arr[k])
    }
    return arr
}

function hasAnyGrades(ele) {
    return getAllGradesFromSubjectElement(ele).length > 0
}

function getAllGradesWeightsFromArray(inputarr) {
    arr = inputarr.slice(0) //creates a copy of the original array, preventing mutation
    //remove undefined values.
    arr.filter(function (el) {
        return el != null;
    });
    for (var k = 0; k < arr.length; k++) {
        currentGrade = arr[k]
        if (typeof currentGrade === "string" && currentGrade.includes('^')) {
            coef = currentGrade.replace(/^([\d.]+)\^([\d.]+)/gi, '$2')
            arr[k] = coef
        } else {
            arr[k] = 1
        }
        arr[k] = parseFloat(arr[k])
    }
    return arr
}

function getWeightFromSubjectElement(ele) {
    return parseInt(ele.nextElementSibling.querySelector('span').innerHTML)
}

function getSubjectName(ele) {
    return ele.querySelector('.nommatiere b').innerHTML.replace(/\.$/gi, '').replace(/&amp;/gi, '&')
}

function show() {
    console.table(data)
}

function getSubSubjectParent(ele) {
    if(ele.classList.contains('sousmatiere')) {
        return true;
    } else {
        return false;
    }
}

function getAvg(values, weights) {
    //remove undefined values.
    values.filter(function (el) {
        return el != null;
    });
    //remove undefined values.
    weights.filter(function (el) {
        return el != null;
    });
    var avg = 0
    if (values.length > 0) {
        weightedValues = []
        for (i = 0; i < values.length; i++) {
            weightedValues.push(values[i] * weights[i])
        }
        avg = sum(weightedValues) / sum(weights);
    } else {
        avg = false
    }
    return avg
}

function sum(input) {

    if (toString.call(input) !== "[object Array]")
        return false;

    var total = 0;
    for (var i = 0; i < input.length; i++) {
        if (isNaN(input[i])) {
            continue;
        }
        total += Number(input[i]);
    }
    return total;
}

show()
