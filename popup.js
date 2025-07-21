const elements = document.querySelectorAll("[id*=collapse-]");
const ids = [];
const currentLanguage = document.querySelector('.lang-label')?.getAttribute('data-language') || 'fr_FR';
const t = window.STRINGS[currentLanguage] || window.STRINGS['fr_FR'];
console.info(`Language detected: ${currentLanguage}`);

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

        // Separating S1 and S2 (if S1-S2 count as S1, if not specified count as S2)

        if (this.period.includes("S1")) {
            return 1;
        } else {
            return 2;
        }
    }

}

function addTextToHtml(text) {
    const h1Element = document.querySelector("h1");
    const newElement = document.createElement("p");
    newElement.innerText = text;
    h1Element.insertAdjacentElement("afterend", newElement);
}

let allGradeWeightedSum = 0;
let allGpaWeightedSum = 0;
let allCoefSum = 0;

let allEcts = new Array(ids.length).fill(0);

const ectsFirstYear = 46;
const ectsSecondYear = 60;
const sumEctsNeeded = 120;
const diplomaEcts = 180;

const repeatedYears = {};
const results = [];

const separator = "-";
const separatorMaxRepeat = window.innerWidth < 600 ? 30 : window.innerWidth < 800 ? 50 : 75;

function paddwithSep(text) {
    let sep = "";
    for (let i = 0; i < separatorMaxRepeat - Math.round(text.length/2); i++) {
        sep += separator;
    }
    let paddOdd = "";
    if (text.length % 2 !== 0) {
        paddOdd = separator;
    }
    return sep + " " + text + " " + sep + paddOdd + "\n";
}

// Function to format the extracted credit category data
function formatCreditsData(creditsData) {
    let formattedText = paddwithSep(t.creditsByCategory) + "\n";
    let first = true;

    for (const category in creditsData) {
        const data = creditsData[category];
        const remaining = data.required - data.acquired

        formattedText += first ? "" : "\n";
        first = false;

        if (remaining > 0) {
            formattedText += `\t- ${window.interpolateString(t.creditsMissingCategory, {category: category, missing: remaining, acquired: data.acquired, required: data.required})}\n`;
        } else if (remaining === 0) {
            formattedText += `\t- ${window.interpolateString(t.creditsEnoughCategory, {category: category, acquired: data.acquired, required: data.required})}\n`;
        } else {
            formattedText += `\t- ${window.interpolateString(t.creditsExcessCategory, {category: category, excess: -remaining, acquired: data.acquired, required: data.required})}\n`;
        }
    }

    return formattedText + "\n";
}

async function fetchCreditsData() {
    try {
        // Extract student ID (####) from the current URL
        const currentUrl = window.location.href;
        const match = currentUrl.match(/mon-dossier-pedagogique\/(\d+)/);
        if (!match) {
            console.error("Student ID not found in URL.");
            return;
        }
        const studentId = match[1];

        // Fetch the credit summary page
        const response = await fetch(`/dossier-pedagogique/${studentId}/recapitulatifs-credits`);
        const data = await response.text();

        // Parse the response HTML
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(data, "text/html");
        const table = htmlDoc.querySelector("#recapitulatifs-credits tbody");

        if (!table) {
            console.error("Table not found in the fetched page.");
            return;
        }

        // Extract credits data
        const creditsData = {};
        const rows = table.querySelectorAll("tr");

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length >= 6) {
                const category = cells[0].textContent.trim().replace("Cr ", ""); // Remove "Cr " prefix
                const required = parseFloat(cells[1].textContent.trim());
                const acquired = parseFloat(cells[2].textContent.trim());

                if (category !== "Ects") {
                    creditsData[category] = {
                        required: required,
                        acquired: acquired,
                    };
                }
            }
        });

        return formatCreditsData(creditsData);


    } catch (error) {
        console.error("Error fetching credits data:", error);
    }
}

async function fetchByYear(id, yearText, repeatedYears) {
    try {
        const response = await fetch(`https://synapses.telecom-paris.fr/liste-notes/${id}`);
        const data = await response.text();

        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(data, "text/html");
        const trElements = htmlDoc.querySelectorAll("tr");

        if (trElements.length <= 4) {
            return { year: parseInt(yearText), text: `${yearText} - ${t.noDataYear}` };
        }

        let when = "";
        let year = 0;

        trElements.forEach(trElement => {
            const code = trElement.children[1]?.textContent.trim();
            if (code === "ING-1A") {
                when = yearText;
                year = 1;
            } else if (code === "ING-2A") {
                when = yearText;
                year = 2;
            } else if (code === "ING-3A") {
                when = yearText;
                year = 3;
            } else if (code === "CES-ACA-2S") {
                when = `${yearText} - ${t.gapYear}`;
                year = 0;
            }
        });

        if (year === 0) {
            return { year: parseInt(yearText), text: `${when}:\n\t- ${t.gapYearDescription}\n`};
        }

        if (repeatedYears[year]) {
            when += ` (${t.repeatedYear})`;
        } else {
            repeatedYears[year] = true;
        }

        let grades = [];
        let gradeWeightedAverage;
        let gradeWeightedAverageS1;
        let gradeWeightedAverageS2;
        let gpaWeightedAverage;
        let gpaWeightedAverageS1;
        let gpaWeightedAverageS2;

        trElements.forEach(function (trElement) {
            if (trElement.children.length > 12) {
                const codeUE = trElement.children[1].textContent.trim();
                const mark = parseFloat(trElement.children[9].textContent);
                const coefficient = trElement.children[11].textContent;
                const period = trElement.children[3].textContent;

                if (coefficient.includes("/") && codeUE !== "") {
                    const ects = parseFloat(coefficient.split("/")[0]);
                    const coef = parseFloat(coefficient.split("/")[1]);

                    if (!isNaN(mark)) {
                        const name = trElement.children[2].textContent;
                        grades.push(new Grade(mark, name, period, coef));
                    }
                    allEcts[year - 1] += ects;
                }
            }
        });

        let gradesWeightedSum = 0;
        let coefficientsSum = 0;
        let gpaWeightedSum = 0;

        let gradesWeightedSumS1 = 0;
        let coefficientsSumS1 = 0;
        let gpaWeightedSumS1 = 0;

        let gradesWeightedSumS2 = 0;
        let coefficientsSumS2 = 0;
        let gpaWeightedSumS2 = 0;

        for (let i_1 = 0; i_1 < grades.length; i_1++) {
            gradesWeightedSum += grades[i_1].getMarkWeighted();
            coefficientsSum += grades[i_1].getCoefficient();
            gpaWeightedSum += grades[i_1].getGpaWeighted();

            if (grades[i_1].getSemester() === 1) {
                gradesWeightedSumS1 += grades[i_1].getMarkWeighted();
                coefficientsSumS1 += grades[i_1].getCoefficient();
                gpaWeightedSumS1 += grades[i_1].getGpaWeighted();
            } else if (grades[i_1].getSemester() === 2) {
                gradesWeightedSumS2 += grades[i_1].getMarkWeighted();
                coefficientsSumS2 += grades[i_1].getCoefficient();
                gpaWeightedSumS2 += grades[i_1].getGpaWeighted();
            }
        }

        gradeWeightedAverage = gradesWeightedSum / coefficientsSum;
        gradeWeightedAverageS1 = gradesWeightedSumS1 / coefficientsSumS1;
        gradeWeightedAverageS2 = gradesWeightedSumS2 / coefficientsSumS2;

        gpaWeightedAverage = gpaWeightedSum / coefficientsSum;
        gpaWeightedAverageS1 = gpaWeightedSumS1 / coefficientsSumS1;
        gpaWeightedAverageS2 = gpaWeightedSumS2 / coefficientsSumS2;

        allGradeWeightedSum += gradesWeightedSum;
        allCoefSum += coefficientsSum;
        allGpaWeightedSum += gpaWeightedSum;

        const text = `${when}:
        \t- ${window.interpolateString(t.averageSemester, {semester: "S1", average: gradeWeightedAverageS1.toFixed(1), gpa: gpaWeightedAverageS1.toFixed(2)})}
        \t- ${window.interpolateString(t.averageSemester, {semester: "S2", average: gradeWeightedAverageS2.toFixed(1), gpa: gpaWeightedAverageS2.toFixed(2)})}
        \t- ${window.interpolateString(t.averageYear, {average: gradeWeightedAverage.toFixed(1), gpa: gpaWeightedAverage.toFixed(2)})}`;

        return { year: parseInt(yearText), text: text + "\n"};
    } catch (error) {
        console.error(error);
    }
}

document.querySelectorAll('.panel-group .panel').forEach(async (panel) => {

    const panelId = panel.querySelector('.panel-heading').id.split('-')[2];
    const yearText = panel.querySelector('.panel-title a').textContent.trim();

    const result = await fetchByYear(panelId, yearText, repeatedYears);
    results.push(result);

    if (results.length === document.querySelectorAll('.panel-group .panel').length) {
        results.sort((a, b) => b.year - a.year); // Chronological order
        results.forEach(result => {
            addTextToHtml(result.text + "\n");
        });
        addTextToHtml(paddwithSep(t.averagesByYear));

        let recapText = paddwithSep(t.creditsByYear) + "\n";
        recapText += `${window.interpolateString(t.creditsEarnedFirstYear, {ects: allEcts[0]})}\n`;
        if (allEcts[0] < ectsFirstYear) {
            recapText += `${window.interpolateString(t.missingEctsFirstYear, {missing: ectsFirstYear - allEcts[0]})}\n`;
        } else {
            recapText += t.enoughEctsFirstYear + "\n";
        }

        if (allEcts.length > 1) {
            recapText += `\n${window.interpolateString(t.creditsEarnedSecondYear, {ects: allEcts[1]})}\n`;
            if (allEcts[1] < ectsSecondYear) {
                recapText += `${window.interpolateString(t.missingEctsSecondYear, {missing: ectsSecondYear - allEcts[1]})}\n`;
            }
            if (allEcts[0] + allEcts[1] < sumEctsNeeded) {
                recapText += `${window.interpolateString(t.missingEctsAfterTwoYears, {missing: sumEctsNeeded - allEcts[1] - allEcts[0], required: sumEctsNeeded})}\n`;
            } else {
                recapText += `${window.interpolateString(t.enoughEctsAfterTwoYears, {acquired: allEcts[0] + allEcts[1]})}\n`;
            }
        }

        if (allEcts.length > 2) {
            recapText += `\n${window.interpolateString(t.creditsEarnedThirdYear, {ects: allEcts[2]})}\n`;
            if (allEcts[0] + allEcts[1] + allEcts[2] < diplomaEcts) {
                recapText += `${window.interpolateString(t.missingEctsForDegree, {missing: diplomaEcts - allEcts[2] - allEcts[1] - allEcts[0], required: diplomaEcts, acquired: allEcts[0] + allEcts[1] + allEcts[2]})}\n\n`;
            } else {
                recapText += `${window.interpolateString(t.enoughEctsForDegree, {acquired: allEcts[0] + allEcts[1] + allEcts[2]})}\n\n`;
            }
        }

        let gpaText = paddwithSep(t.generalAverage) + "\n";
        let allGradeWeightedAverage = allGradeWeightedSum / allCoefSum;
        let allGpaWeightedAverage = allGpaWeightedSum / allCoefSum;
        gpaText += window.interpolateString(t.generalGPAText, {gpa: allGpaWeightedAverage.toFixed(2)}) + "\n";
        gpaText += window.interpolateString(t.generalAverageText, {average: allGradeWeightedAverage.toFixed(1)}) + "\n\n";

        let catText = await fetchCreditsData()

        addTextToHtml(gpaText);
        addTextToHtml(catText);
        addTextToHtml(recapText);
    }
});