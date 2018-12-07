// ==UserScript==
// @name         ED Scraper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Ecoledirecte scrapper
// @author       Mx3
// @match        https://www.ecoledirecte.com/*
// @grant        none
// ==/UserScript==


/*
TRUCS A HANDLE:
Notes = {BASE}/Notes
Devoirs = {BASE}/CahierDeTexte

TRUCS A LINKER:
Timeline = {BASE}
Vie scolaire = {BASE}/VieScolaire
Messages = {BASE}/Messagerie
Cloud = {BASE}/MonCloud
Workspace = /E/{ID}/EspacesTravail
Logout = /logout
About = /about
Contact Etablissmement = /contactEtablissement
*/

bannerRawHTML = ''
bannerRawCSS = ''


function main() {
    profile = {
        "name": null,
        "conseilDeClasseDate": null,
        "nthTrimester": null,
        "id":parseInt(window.location.href.replace(/https:\/\/www\.ecoledirecte\.com\/Eleves\/(\d+)\/.+/gi, '$1')),
        "baseURL":"/Eleves/"+profile.id
    }
    grades = {
        "subject": null,
        "subjectTeacher": null,
        "rawValues": null,
        "tooltips": null,
        "subjectWeight": null,
        "subjectAvg": null,
        "isSubSubject": null,
        "values": null,
        "weights": null,
        "DOMelements": null,
        "globalAvg": null
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
        for (key of iterator) {
            grades.isSubSubject[key] = getSubSubjectParent(grades.DOMelements[key])
            if (!grades.isSubSubject[key]) {
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
    profile.conseilDeClasseDate = uppercaseFirstChar(document.querySelector('div.help-block[ng-if="periode.dateConseil"]').textContent.replace('Conseil de classe le ', '').trim())
    profile.trimesterDOMElements = document.querySelectorAll('li[ng-repeat="periode in periodes track by $index"]')
    profile.activeTrimesterDOMElement = document.querySelector('li[ng-repeat="periode in periodes track by $index"].active')
    profile.nthTrimester = uppercaseFirstChar(document.querySelector('li[ng-repeat="periode in periodes track by $index"].active a[ng-click^=setSelectedPeriode]').textContent.trim().toLowerCase())
    profile.picture = document.querySelector('.ed-menu-image-wrapper .circular').style.background.replace(/\url\("(.+)\"\).+/gi, 'http:$1')
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
    summary = 'Conseil de classe : ' + profile.conseilDeClasseDate + '<br> Moyenne générale : ' + grades.globalAvg.toFixed(2) + '/20 <br> Moyenne en ' + getGreatestCoefSubjectName() + ' : ' + uppercaseFirstChar(getAvgFromSubjectName(getGreatestCoefSubjectName()).toFixed(1)) + '/20'
    document.querySelector('table.releve ~ p.help-block').innerHTML += summary;
    // alert(summary())
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

function build() {
    document.body.style.background = 'none';

    document.getElementById('header-part').style.display = 'none'
    document.getElementById('header-part').insertAdjacentHTML('beforebegin', bannerRawHTML);
    document.getElementById('header-part').insertAdjacentHTML('beforebegin', '<style>'+bannerRawCSS+'</style>');

}

function getAllTreatedGradesFromArray(inputarr) {
    arr = inputarr.slice(0) //creates a copy of the original array, preventing mutation
    for (k = 0; k < arr.length; k++) {
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
        if (se.hasAttribute('uib-tooltip')) {
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
    for (k = 0; k < arr.length; k++) {
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
    return ele.querySelector('.nommatiere b').innerHTML.replace(/\.$/gi, '').replace(/&amp;/gi, '&').trim()
}

function getGreatestCoefSubjectName() {
    return grades.subject[grades.subjectWeight.indexOf(getMax(grades.subjectWeight))]
}

function getSubjectTeacherName(ele) {
    return ele.textContent.replace(getSubjectName(ele), '').replace(/^\./gi, '').trim()
}

function getSubSubjectParent(ele) {
    if (ele.classList.contains('sousmatiere')) {
        return true;
    } else {
        return false;
    }
}

function getAvgFromSubjectName(str) {
    return grades.subjectAvg[grades.subject.indexOf(str)]
}

function show() {
    isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    // console.log('===PROFILE===')
    if (!isFirefox) {
        console.table(profile)
    } else {
        console.log('nthTrimester:')
        console.log(profile.nthTrimester)
        console.log('conseilDeClasseDate:')
        console.log(profile.conseilDeClasseDate)
        console.log('activeTrimesterDOMElement:')
        console.log(profile.activeTrimesterDOMElement)
    }
    // console.log('===GRADES===')
    if (!isFirefox) {
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
    console.log(summary)
}

function getMax(arr) {
    arr = arr.filter(function (el) {
        return el != null;
    });
    max = arr[0]
    arr.forEach(e => {
        if (e >= max) {
            max = e
        }
    });
    return max
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
    avg = 0
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
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}


function sum(input) {

    if (toString.call(input) !== "[object Array]")
        return false;

    total = 0;
    for (i = 0; i < input.length; i++) {
        if (isNaN(input[i])) {
            continue;
        }
        total += Number(input[i]);
    }
    return total;
}

function pageIsValid() {
    return window.location.href.match(/https:\/\/www\.ecoledirecte\.com\/Eleves\/\d+\/Notes/gi)
}

function emptyTrimester() {
    return document.querySelector('td.moyennegenerale-valeur').textContent.trim() === ''
}

function run() {
    if(emptyTrimester()) {
        alert('Ce trimestre ne possède aucune note!')
    } else {
        main()
        show()
        if(confirm('Build ?')) {
            build(bannerRawHTML)
        }
    }
}

if (pageIsValid()) {
    setTimeout(() => {
        run()
        // Select the node that will be observed for mutations (profile object isn't defined yet, so we use a querySelector )
        targetNode = document.querySelector('li[ng-repeat="periode in periodes track by $index"].active')
    
        // Callback function to execute when mutations are observed
        callback = function (mutationsList, observer) {
            for (mutation of mutationsList) {
                if (mutation.type == 'attributes' && mutation.attributeName === 'class' && !targetNode.classList.contains('active')) {
                    setTimeout(() => {
                        run()
                    }, 1000);
                }
            }
        };
        observer = new MutationObserver(callback);
        observer.observe(targetNode, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }, 2000);
} else {
    gotoed = confirm('Veuillez aller sur ecoledirecte.com avec un compte élève, pages notes, et lancer le script. \nL\'URL doit ressembler à https://www.ecoledirecte.com/Eleves/12345/Notes. Cliquez sur confirmer pour aller sur ecoledirecte.com.')
    if (gotoed) {
        window.location.href = 'https://www.ecoledirecte.com/'
    }
}