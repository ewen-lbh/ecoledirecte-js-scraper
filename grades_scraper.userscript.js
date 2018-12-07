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
grades.subject is subject names
grades.subjectTeacher is subjects' teachers name
grades.rawValues is an array of all marks, for each subject
grades.values is an array of all marks, processed, for each subject
grades.weights is an array of all marks' coefficients, for each subject
grades.subjectWeight is subject coeficients
grades.DOMelements is subject name DOM element
grades.subjectAvg is subject averages
grades.globalAvg is the global average
grades.isSubSubject is wether the subject is a subsubject, and its parent.

profile.name is the student's name
profile.class is the student's class (NOT IMPLEMENTED)
profile.conseilDeClasseDate is the student's conseil de classe date
raw is the grade object's trimester 

*/
function main() {
    profile = {
        "name" : null,
        "conseilDeClasseDate":null,
        "nthTrimester":null,
    }
    grades = {
        "subject" : null,
        "subjectTeacher" : null,
        "rawValues" : null,
        "tooltips" : null,
        "subjectWeight" : null,
        "subjectAvg" : null,
        "isSubSubject" : null,
        "values" : null,
        "weights" : null,
        "DOMelements" : null,
        "globalAvg" : null
    }
    grades.subject = []
    grades.subjectTeacher = []
    grades.DOMelements = []
    grades.tooltips = []
    grades.rawValues = []
    grades.values = []
    grades.weights = []
    grades.subjectWeight = []
    grades.subjectAvg = []
    grades.globalAvg = []
    grades.isSubSubject = []
    subjectsE = document.querySelectorAll('td.discipline')
    subjectsE.forEach(subjectE => {
        grades.DOMelements.push(subjectE)
        grades.subject.push(getSubjectName(subjectE))
        iterator = grades.DOMelements.keys()
        for (let key of iterator) {
            grades.isSubSubject[key] = getSubSubjectParent(grades.DOMelements[key])
            if(!grades.isSubSubject[key]) {
                grades.subjectTeacher[key] = getSubjectTeacherName(grades.DOMelements[key])
            } else {
                grades.subjectTeacher[key] = '';
            }
            // console.log(grades.subject[key])
            if (hasAnyGrades(grades.DOMelements[key])) {
                grades.subjectWeight[key] = getWeightFromSubjectElement(grades.DOMelements[key])
                grades.rawValues[key] = getAllGradesFromSubjectElement(grades.DOMelements[key])
                grades.tooltips[key] = getAllGradesPopupsFromSubjectElement(grades.DOMelements[key])
                grades.values[key] = getAllTreatedGradesFromArray(grades.rawValues[key])
                grades.weights[key] = getAllGradesWeightsFromArray(grades.rawValues[key])
                grades.subjectAvg[key] = getAvg(grades.values[key], grades.weights[key])
            }
        }
    });
    grades.globalAvg = getAvg(grades.subjectAvg, grades.subjectWeight)
    
    profile.name = document.querySelector('a#user-account-link').text.trim()
    profile.conseilDeClasseDate = uppercaseFirstChar(document.querySelector('div.help-block[ng-if="periode.dateConseil"]').textContent.replace('Conseil de classe le ','').trim())
    profile.trimesterDOMElements = document.querySelectorAll('li[ng-repeat="periode in periodes track by $index"]')
    profile.activeTrimesterDOMElement = document.querySelector('li[ng-repeat="periode in periodes track by $index"].active')
    profile.nthTrimester = uppercaseFirstChar(document.querySelector('li[ng-repeat="periode in periodes track by $index"].active a[ng-click^=setSelectedPeriode]').textContent.trim().toLowerCase())
    switch (profile.nthTrimester) {
        case "Premier trimestre":
            profile.nthTrimester = 1
            break;
        case "Deuxieme trimestre":
            profile.nthTrimester = 2
            break;
        case "Troisieme trimestre":
            profile.nthTrimester = 3
            break;
    
        default:
            break;
    }
}


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

function getAllGradesPopupsFromSubjectElement(ele) {
    returnarr = []
    e = ele.nextElementSibling.nextElementSibling.nextElementSibling.querySelectorAll('span[uib-tooltip]')
    e.forEach(se => {
        if(se.hasAttribute('uib-tooltip')) {
            returnarr.push(se.attributes['uib-tooltip'].textContent)
        }
    });
    return returnarr
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
function getSubjectTeacherName(ele) {
    return ele.textContent.replace(getSubjectName(ele),'').replace(/^\./gi,'')
}

function getSubSubjectParent(ele) {
    if(ele.classList.contains('sousmatiere')) {
        return true;
    } else {
        return false;
    }
}

function show() {
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    console.log('===PROFILE===')
    if(!isFirefox) {
        console.table(profile)
    } else {
        console.log('nthTrimester:')
        console.log(profile.nthTrimester)
        console.log('conseilDeClasseDate:')
        console.log(profile.conseilDeClasseDate)
        console.log('activeTrimesterDOMElement:')
        console.log(profile.activeTrimesterDOMElement)
    }
    console.log('===GRADES===')
    if(!isFirefox) {
        console.table(grades)
    } else {
        console.log('values:')
        console.log(grades.values)
        console.log('subject:')
        console.log(grades.subject)
        console.log('subjectTeacher:')
        console.log(grades.subjectTeacher)
        console.log('subjectAvg:')
        console.log(grades.subjectAvg)
        console.log('globalAvg:')
        console.log(grades.globalAvg)
    }
    console.log('Vous êtes sur le trimestre n°'+profile.nthTrimester)
}

function startObserver() {    
    // Select the node that will be observed for mutations
    var targetNode = profile.activeTrimesterDOMElement

    // Options for the observer (which mutations to observe)
    var config = { attributes: true, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    var callback = function(mutationsList, observer) {
        for(var mutation of mutationsList) {
            if (mutation.type == 'attributes' && mutation.attributeName === 'class') {
                console.log('jaaj');
            }
        }
    };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
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

function uppercaseFirstChar(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function rerunOnClassChange(elem) {
    var lastClassName = elem.className;
    window.setInterval( function() {   
       var className = elem.className;
        if (className !== lastClassName) {
            main();   
            lastClassName = className;
        }
    },10);
}

function pageIsValid() {
    return window.location.href.match(/https:\/\/www\.ecoledirecte\.com\/Eleves\/\d+\/Notes/gi)
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

if(pageIsValid()) {
    main()
    show()
    startObserver()
} else {
    alert('Veuillez aller sur ecoledirecte.com avec un compte élève, pages notes, et lancer le script. \nL\'URL doit ressembler à https://www.ecoledirecte.com/Eleves/12345/Notes.')
}