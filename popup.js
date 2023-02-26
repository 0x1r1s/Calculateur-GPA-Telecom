const elements = document.querySelectorAll("[id*=collapse-]");
const ids = [];

elements.forEach((element) => {
    const id = element.getAttribute("id");
    const number = id.split("-")[1];
    ids.push(number);
});

function convertToGrade(markParam) {
    if (markParam >= 17) {
        return 4.33;
    } else if (markParam >= 13) {
        return 4;
    } else if (markParam >= 12) {
        return 3.5;
    } else if (markParam >= 10) {
        return 3;
    } else if (markParam >= 9) {
        return 2;
    } else if (markParam >= 8) {
        return 1.5;
    } else if (markParam >= 5) {
        return 1;
    } else {
        return 0;
    }
}

function addToHtml(when, gpaValue, gradeValue) {
    const h1Element = document.querySelector("h1");
    const newElement = document.createElement("p");
    newElement.innerText = "Ton GPA de " + when + " est: " + gpaValue + " ( Moyenne: " + gradeValue + " )";
    h1Element.insertAdjacentElement("afterend", newElement);
}

var allGpaWeightedSum = 0;
var allGradeWeightedSum = 0;
var allCoefSum = 0;
var execution = 0;

async function fetchPerYear(num) {
    try {
        var grades = [];
        var gpaGrades = [];
        var coefficients = [];
        var gpaWeightedAverage;
        var gradeWeightedAverage;
        
        const response = await fetch(
            "https://synapses.telecom-paris.fr/liste-notes/" + num
        );
        const data = await response.text();
        
        // Parse the HTML page to a DOM object
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(data, "text/html");

        console.log(htmlDoc)

        // Select all the <tr> elements from the parsed HTML
        var trElements = htmlDoc.querySelectorAll("tr");

        // Iterate over each <tr> element and retrieve the values
        trElements.forEach(function (trElement) {
            if (trElement.children.length > 12) {
                var mark = parseInt(trElement.children[9].textContent);
                var coefficient = trElement.children[11].textContent;
                if (!isNaN(mark) && coefficient.includes("/")) {
                    grades.push(mark);
                    gpaGrades.push(convertToGrade(mark));
                    coefficients.push(coefficient);
                }
            }
        });
        
        // Calculating the GPA
        let gradesWeightedSum = 0;
        let gpaWeightedSum = 0;
        let coefficientsSum = 0;
        for (let i_1 = 0; i_1 < gpaGrades.length; i_1++) {
            const numerator = parseFloat(coefficients[i_1].split("/")[1]);
            gradesWeightedSum += grades[i_1] * numerator;
            gpaWeightedSum += gpaGrades[i_1] * numerator;
            coefficientsSum += numerator;
        }

        gradeWeightedAverage = Math.round((gradesWeightedSum * 100) / coefficientsSum) / 100;
        gpaWeightedAverage = Math.round((gpaWeightedSum * 100) / coefficientsSum) / 100;

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

        addToHtml(when, gpaWeightedAverage, gradeWeightedAverage);
        execution++;

        if (ids.length == execution) {
            var allGpaWeightedAverage = Math.round((allGpaWeightedSum * 100) / allCoefSum) / 100;
            var allGradeWeightedAverage = Math.round((allGradeWeightedSum * 100) / allCoefSum) / 100;
            addToHtml("global", allGpaWeightedAverage, allGradeWeightedAverage);
        }
        
        return gpaWeightedAverage;
    } catch (error) {
        return console.error(error);
    }
}

ids.forEach(
    async (id) => {
        console.log(id);
        await fetchPerYear(id)
    }
)