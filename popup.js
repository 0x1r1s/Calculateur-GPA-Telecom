const elements = document.querySelectorAll("[id*=collapse-]");
const ids = [];

elements.forEach((element) => {
    const id = element.getAttribute("id");
    const number = id.split("-")[1];
    ids.push(number);
});

class Grade {
    constructor(value, name, period, coefficient = null) {
        this.value = value;
        this.name = name;
        this.period = period;
        this.coefficient = coefficient;
    }

    getName() {
        return this.name;
    }

    getMark() {
        return this.value;
    }

    getCoefficient() {
        return this.coefficient;
    }

    getGpa() {
        if (this.value >= 17) {
            return 4.33;
        } else if (this.value >= 13) {
            return 4;
        } else if (this.value >= 12) {
            return 3.5;
        } else if (this.value >= 10) {
            return 3;
        } else if (this.value >= 9) {
            return 2;
        } else if (this.value >= 8) {
            return 1.5;
        } else if (this.value >= 5) {
            return 1;
        } else {
            return 0;
        }
    }

    getGpaWeighted() {
        return this.getGpa() * this.getCoefficient();
    }

    getMarkWeighted() {
        return this.getMark() * this.getCoefficient();
    }

    getSemester() {

     // Seperating S1 and S2 (if S1-S2 count as S1, if not specified count as S2) 

        if (this.period.includes("S1")) {
            return 1;
        } else {
            return 2;
        }
    }

};

function countNeededCourse(name, ectsDone) {
    var ectsNeeded;
    switch (name) {
        case "FH":
            ectsNeeded = 6;
            break;
        case "HUM":
            ectsNeeded = 1.5;
            break;
        case "UE part":
            ectsNeeded = 15;
            break;
    }
    return ectsNeeded - ectsDone;
};

function addGradeToHtml(when, gpaValue, gradeValue) {
    const h1Element = document.querySelector("h1");
    const newElement = document.createElement("p");
    newElement.innerText = "Ton GPA de " + when + " est: " + gpaValue + " ( Moyenne: " + gradeValue + " )";
    h1Element.insertAdjacentElement("afterend", newElement);
};

function addTextToHtml(text) {
    const h1Element = document.querySelector("h1");
    const newElement = document.createElement("p");
    newElement.innerText = text;
    h1Element.insertAdjacentElement("afterend", newElement);
};

var allGradeWeightedSum = 0;
var allGpaWeightedSum = 0;
var allCoefSum = 0;

var fhEcts = 0;
var humEcts = 0;
var uePartEcts = 0;

var allEcts = new Array(ids.length).fill(0);

var execution = 0;

const ectsFirstYear = 46;
const ectsSecondYear = 60;
const sumEctsNeeded = 120;
const diplomaEcts = 180;

async function fetchPerYear(num) {
    try {
        var when = "";
        var year;
        // Determining the year
        if (ids[ids.length - 1] == num) {
            when = "1ère année";
            year = 1;
        } else if (ids[ids.length - 2] == num) {
            when = "2nde année";
            year = 2;
        } else if (ids[ids.length - 3] == num) {
            when = "3ème année";
            year = 3;
        }

        var grades = [];

        var gpaWeightedAverage;
        var gradeWeightedAverage;
        var gradeWeightedAverageS1;
        var gradeWeightedAverageS2;

        const response = await fetch(
            "https://synapses.telecom-paris.fr/liste-notes/" + num
        );
        const data = await response.text();

        // Parse the HTML page to a DOM object
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(data, "text/html");

        // Select all the <tr> elements from the parsed HTML
        var trElements = htmlDoc.querySelectorAll("tr");

        if (trElements.length <= 4) {
            addTextToHtml("Tu n'as pas encore de notes pour ta " + when + " !");
            execution++;
            return;
        }

        // Iterate over each <tr> element and retrieve the values
        trElements.forEach(function (trElement) {
            if (trElement.children.length > 12) {
                const mark = parseFloat(trElement.children[9].textContent);
                const coefficient = trElement.children[11].textContent;
                const period = trElement.children[3].textContent;

                const cat = trElement.children[4].textContent;
                const uePart = trElement.children[18].textContent;
                const humTandem = trElement.children[2].textContent;

                if (coefficient.includes("/")) {
                    const ects = parseFloat(coefficient.split("/")[0]);
                    const coef = parseFloat(coefficient.split("/")[1]);

                    if (!isNaN(mark)) {
                        const name = trElement.children[2].textContent;
                        grades.push(new Grade(mark, name, period, coef));
                        allEcts[year - 1] += ects;
                    }

                    if (cat == "FH") {
                        fhEcts += ects;
                        allEcts[year - 1] += ects;
                    }
                    else if (cat == "HUM") {
                        humEcts += ects;
                    }
                    else if (humTandem.includes("HUM-TANDEM")) {
                        humEcts += ects;
                    }
                    else if (cat == "SES" && isNaN(mark)) {
                        allEcts[year - 1] += ects;
                    }

                    if (uePart.includes("/") && cat != "") {
                        uePartEcts += ects;
                    }
                }
            }
        });

        // Calculating the GPA
        let gradesWeightedSum = 0;
        let gpaWeightedSum = 0;
        let coefficientsSum = 0;

        let gradesWeightedSumS1 = 0;
        let coefficientsSumS1 = 0;

        let gradesWeightedSumS2 = 0;
        let coefficientsSumS2 = 0;
        
        for (let i_1 = 0; i_1 < grades.length; i_1++) {
            gradesWeightedSum += grades[i_1].getMarkWeighted();
            gpaWeightedSum += grades[i_1].getGpaWeighted();
            coefficientsSum += grades[i_1].getCoefficient();

            // Seperating S1 and S2 (if S1-S2 count as S1, if not specified count as S2) 
            if (grades[i_1].getSemester() == 1) {
                gradesWeightedSumS1 += grades[i_1].getMarkWeighted()
                coefficientsSumS1 += grades[i_1].getCoefficient()
            } else if (grades[i_1].getSemester() == 2){
                gradesWeightedSumS2 += grades[i_1].getMarkWeighted()
                coefficientsSumS2 += grades[i_1].getCoefficient()
            }
        }

        gradeWeightedAverage =
            Math.round((gradesWeightedSum * 10) / coefficientsSum) / 10;
        
        gradeWeightedAverageS1 =
            Math.round((gradesWeightedSumS1 * 10) / coefficientsSumS1) / 10;
        
        gradeWeightedAverageS2 =
            Math.round((gradesWeightedSumS2 * 10) / coefficientsSumS2) / 10;

        gpaWeightedAverage =
            Math.round((gpaWeightedSum * 100) / coefficientsSum) / 100;


        allGradeWeightedSum += gradesWeightedSum;
        allGpaWeightedSum += gpaWeightedSum;
        allCoefSum += coefficientsSum;


        addGradeToHtml(when, gpaWeightedAverage, gradeWeightedAverage);
        addTextToHtml("En " + when + " ta moyenne de S1 est : "+gradeWeightedAverageS1 + " et ta moyenne de S2 est : "+gradeWeightedAverageS2);
        addTextToHtml("-----------------------------------------");

        execution++;

        if (ids.length == execution) {
            var allGradeWeightedAverage =
                Math.round((allGradeWeightedSum * 10) / allCoefSum) / 10;
            var allGpaWeightedAverage =
                Math.round((allGpaWeightedSum * 100) / allCoefSum) / 100;
            addGradeToHtml("global", allGpaWeightedAverage, allGradeWeightedAverage);
            addTextToHtml("-----------------------------------------");

            var needText = "Il te faut valider encore minimum:\n";
            var pixelPerfect = "Tu es nickel en crédit:\n";
            var noNeedText = "Tu as trop de crédits:\n";

            var fhEctsNeeded = countNeededCourse("FH", fhEcts);
            var humEctsNeeded = countNeededCourse("HUM", humEcts);
            var uePartEctsNeeded = countNeededCourse("UE part", uePartEcts);

            if (fhEctsNeeded > 0) {
                needText += "- FH: " + fhEctsNeeded + " ects\n";
            } else if (fhEctsNeeded == 0) {
                pixelPerfect += "- FH: " + fhEctsNeeded + " ects\n";
            } else {
                noNeedText += "- FH: " + (-fhEctsNeeded) + " ects en trop !\n";
            }

            if (humEctsNeeded > 0) {
                needText += "- HUM: " + humEctsNeeded + " ects\n";
            } else if (humEctsNeeded == 0) {
                pixelPerfect += "- HUM: " + humEctsNeeded + " ects\n";
            } else {
                noNeedText += "- HUM: " + (-humEctsNeeded) + " ects en trop !\n";
            }

            if (uePartEctsNeeded > 0) {
                needText += "- UE part: " + uePartEctsNeeded + " ects\n";
            } else if (uePartEctsNeeded == 0) {
                pixelPerfect += "- UE part: " + uePartEctsNeeded + " ects\n";
            } else {
                noNeedText += "- UE part: " + (-uePartEctsNeeded) + " ects en trop !\n";
            }

            addTextToHtml(
                needText + "\n" + pixelPerfect + "\n" + noNeedText
            );

            addTextToHtml("-----------------------------------------");



            var yearSummary = "Tu as " + allEcts[0] + " ects en 1ère année\n"

            if (allEcts[0] < ectsFirstYear) {
                yearSummary += "Il te faut encore " + (ectsFirstYear - allEcts[0]) + " ects pour passer en 2ème année\n";
            } else {
                yearSummary += "Tu as assez d'ects pour passer en 2ème année\n";
            }


            if (allEcts.length > 1) {
                yearSummary += "\nTu as " + allEcts[1] + " ects en 2ème année\n";
                if (allEcts[1] < ectsSecondYear) {
                    yearSummary += "Il te faut encore " + (ectsSecondYear - allEcts[1]) + " ects pour passer en 3ème année\n";
                }
                if (allEcts[0] + allEcts[1] < sumEctsNeeded) {
                    yearSummary += "\nAttention il te manque encore " + (sumEctsNeeded - allEcts[1] - allEcts[0]) + " ects pour avoir 120 ects après 2 ans\n";
                } else {
                    yearSummary += "\nTu as " + (allEcts[0] + allEcts[1]) + " ects en 2 ans donc assez d'ects après 2 ans\n";
                }
            }

            if (allEcts.length > 2) {
                yearSummary += "\nTu as " + allEcts[2] + " ects en 3ème année\n";
                if (allEcts[0] + allEcts[1] + allEcts[2] < diplomaEcts) {
                    yearSummary += "Il te faut encore " + (diplomaEcts - allEcts[2] - allEcts[1] - allEcts[0]) + " ects pour avoir ton diplôme\n";
                }
            }
            addTextToHtml(yearSummary);

            addTextToHtml("-----------------------------------------");

        }

        return gpaWeightedAverage;
    } catch (error) {
        return console.error(error);
    }
};

addTextToHtml("-----------------------------------------");

ids.forEach(async (id) => {
    console.log("Grades obtained here (private): https://synapses.telecom-paris.fr/liste-notes/" + id);
    await fetchPerYear(id);
});