const elements = document.querySelectorAll("[id*=collapse-]");
const ids = [];

elements.forEach((element) => {
    const id = element.getAttribute("id");
    const number = id.split("-")[1];
    ids.push(number);
});

class Grade {
    constructor(value, coefficient, name) {
        this.value = value;
        this.coefficient = coefficient;
        this.name = name;
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
        if (value >= 17) {
            return 4.33;
        } else if (value >= 13) {
            return 4;
        } else if (value >= 12) {
            return 3.5;
        } else if (value >= 10) {
            return 3;
        } else if (value >= 9) {
            return 2;
        } else if (value >= 8) {
            return 1.5;
        } else if (value >= 5) {
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
    newElement.innerText = "Ton GPA " + when + " est: " + gpaValue + " ( Moyenne: " + gradeValue + " )";
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

var execution = 0;

async function fetchPerYear(num) {
    try {
        var grades = [];

        var gpaWeightedAverage;
        var gradeWeightedAverage;

        const response = await fetch(
            "https://synapses.telecom-paris.fr/liste-notes/" + num
        );
        const data = await response.text();

        // Parse the HTML page to a DOM object
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(data, "text/html");

        console.log(htmlDoc);

        // Select all the <tr> elements from the parsed HTML
        var trElements = htmlDoc.querySelectorAll("tr");

        // Iterate over each <tr> element and retrieve the values
        trElements.forEach(function (trElement) {
            if (trElement.children.length > 12) {
                const mark = parseFloat(trElement.children[9].textContent);
                const coefficient = trElement.children[11].textContent;

                const cat = trElement.children[4].textContent;
                const uePart = trElement.children[18].textContent;

                if (!isNaN(mark) && coefficient.includes("/")) {
                    grades.push(new Grade(mark, parseFloat(coefficient.split("/")[1])));
                }

                if (cat == "FH" && coefficient.includes("/")) {
                    fhEcts += parseFloat(coefficient.split("/")[0]);
                }
                if (cat == "HUM" && coefficient.includes("/")) {
                    humEcts += parseFloat(coefficient.split("/")[0]);
                }
                if (uePart.includes("/") && coefficient.includes("/") && cat != "") {
                    uePartEcts += parseFloat(coefficient.split("/")[0]);
                    console.log(uePartEcts);
                }
            }
        });

        // Calculating the GPA
        let gradesWeightedSum = 0;
        let gpaWeightedSum = 0;
        let coefficientsSum = 0;
        for (let i_1 = 0; i_1 < grades.length; i_1++) {
            gradesWeightedSum += grades[i_1].getMarkWeighted();
            gpaWeightedSum += grades[i_1].getGpaWeighted();
            coefficientsSum += grades[i_1].getCoefficient();
        }

        gradeWeightedAverage =
            Math.round((gradesWeightedSum * 10) / coefficientsSum) / 10;
        gpaWeightedAverage =
            Math.round((gpaWeightedSum * 100) / coefficientsSum) / 100;

        allGradeWeightedSum += gradesWeightedSum;
        allGpaWeightedSum += gpaWeightedSum;
        allCoefSum += coefficientsSum;

        // Determining the year
        if (ids[ids.length - 1] == num) {
            when = "de 1ère année";
        } else if (ids[ids.length - 2] == num) {
            when = "de 2nde année";
        } else if (ids[ids.length - 3] == num) {
            when = "de 3ème année";
        }

        addGradeToHtml(when, gpaWeightedAverage, gradeWeightedAverage);
        
        execution++;

        if (ids.length == execution) {
            var allGradeWeightedAverage =
                Math.round((allGradeWeightedSum * 10) / allCoefSum) / 10;
            var allGpaWeightedAverage =
                Math.round((allGpaWeightedSum * 100) / allCoefSum) / 100;
            addGradeToHtml("global", allGpaWeightedAverage, allGradeWeightedAverage);
            addTextToHtml("-----------------------------------------");

            addTextToHtml(
                "Il te faut valider encore minimum:\n\n" +
                "- HUM: " + countNeededCourse("HUM", humEcts) + " ects\n" +
                "- FH: " + countNeededCourse("FH", fhEcts) + " ects\n" +
                "- UE part: " + countNeededCourse("UE part", uePartEcts) + " ects"
            );

            addTextToHtml("-----------------------------------------");
        }

        return gpaWeightedAverage;
    } catch (error) {
        return console.error(error);
    }
};

addTextToHtml("-----------------------------------------");

ids.forEach(async (id) => {
    console.log(id);
    await fetchPerYear(id);
});