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

}

function addTextToHtml(text) {
    const h1Element = document.querySelector("h1");
    const newElement = document.createElement("p");
    newElement.innerText = text;
    h1Element.insertAdjacentElement("afterend", newElement);
}

var allGradeWeightedSum = 0;
var allGpaWeightedSum = 0;
var allCoefSum = 0;

var allEcts = new Array(ids.length).fill(0);

var execution = 0;

const ectsFirstYear = 46;
const ectsSecondYear = 60;
const sumEctsNeeded = 120;
const diplomaEcts = 180;

const repeatedYears = {};
const results = [];

const separator = "-";
const separatorMaxRepeat = 75;

function paddwithSep(text) {
    var sep = "";
    for (var i = 0; i < separatorMaxRepeat - Math.round(text.length/2); i++) {
        sep += separator;
    }
    var paddOdd = "";
    if (text.length % 2 !== 0) {
        paddOdd = separator;
    }
    return sep + " " + text + " " + sep + paddOdd + "\n";
}

// Function to format the extracted credit category data
function formatCreditsData(creditsData) {
    let formattedText = paddwithSep("Crédits par catégorie") + "\n";
    let first = true;

    for (const category in creditsData) {
        const data = creditsData[category];
        const remaining = data.required - data.acquired

        formattedText += first ? "" : "\n";
        first = false;

        if (remaining > 0) {
            formattedText += `\t- ${category}: Il te faut encore ${remaining} ECTS (${data.acquired} acquis pour ${data.required} requis) ❌\n`;
        } else if (remaining === 0) {
            formattedText += `\t- ${category}: ${data.acquired} ECTS pour ${data.required} requis ✅\n`;
        } else {
            formattedText += `\t- ${category}: ${-remaining} ECTS en trop (${data.acquired} acquis pour ${data.required} requis) ✅\n`;
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

async function fetchPerYear(id, yearText, repeatedYears) {
    try {
        const response = await fetch(`https://synapses.telecom-paris.fr/liste-notes/${id}`);
        const data = await response.text();

        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(data, "text/html");
        const trElements = htmlDoc.querySelectorAll("tr");

        if (trElements.length <= 4) {
            return { year: parseInt(yearText), text: `En ${yearText} - Diplôme d'ingénieur - césure tu étais en césure` };
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
                when = `${yearText} - Césure`;
                year = 0;
            }
        });

        if (year === 0) {
            return { year: parseInt(yearText), text: `${when}:\n\t- Tu étais en césure, pas de notes à afficher.\n`};
        }

        if (repeatedYears[year]) {
            when += " (année redoublée)";
        } else {
            repeatedYears[year] = true;
        }

        var grades = [];
        var gradeWeightedAverage;
        var gradeWeightedAverageS1;
        var gradeWeightedAverageS2;
        var gpaWeigtedAverage;
        var gpaWeigtedAverageS1;
        var gpaWeigtedAverageS2;

        trElements.forEach(function (trElement) {
            if (trElement.children.length > 12) {
                const mark = parseFloat(trElement.children[9].textContent);
                const coefficient = trElement.children[11].textContent;
                const period = trElement.children[3].textContent;

                const cat = trElement.children[4].textContent;

                if (coefficient.includes("/")) {
                    const ects = parseFloat(coefficient.split("/")[0]);
                    const coef = parseFloat(coefficient.split("/")[1]);

                    if (!isNaN(mark)) {
                        const name = trElement.children[2].textContent;
                        grades.push(new Grade(mark, name, period, coef));
                        allEcts[year - 1] += ects;
                    }

                    if (cat === "FH") {
                        allEcts[year - 1] += ects;
                    } else if (cat === "SES" && isNaN(mark)) {
                        allEcts[year - 1] += ects;
                    }
                }
            }
        });

        let gradesWeightedSum = 0;
        let coefficientsSum = 0;
        let gpaWeigtedSum = 0;

        let gradesWeightedSumS1 = 0;
        let coefficientsSumS1 = 0;
        let gpaWeigtedSumS1 = 0;

        let gradesWeightedSumS2 = 0;
        let coefficientsSumS2 = 0;
        let gpaWeigtedSumS2 = 0;

        for (let i_1 = 0; i_1 < grades.length; i_1++) {
            gradesWeightedSum += grades[i_1].getMarkWeighted();
            coefficientsSum += grades[i_1].getCoefficient();
            gpaWeigtedSum += grades[i_1].getGpaWeighted();

            if (grades[i_1].getSemester() === 1) {
                gradesWeightedSumS1 += grades[i_1].getMarkWeighted();
                coefficientsSumS1 += grades[i_1].getCoefficient();
                gpaWeigtedSumS1 += grades[i_1].getGpaWeighted();
            } else if (grades[i_1].getSemester() === 2) {
                gradesWeightedSumS2 += grades[i_1].getMarkWeighted();
                coefficientsSumS2 += grades[i_1].getCoefficient();
                gpaWeigtedSumS2 += grades[i_1].getGpaWeighted();
            }
        }

        gradeWeightedAverage = gradesWeightedSum / coefficientsSum;
        gradeWeightedAverageS1 = gradesWeightedSumS1 / coefficientsSumS1;
        gradeWeightedAverageS2 = gradesWeightedSumS2 / coefficientsSumS2;

        gpaWeigtedAverage = gpaWeigtedSum / coefficientsSum;
        gpaWeigtedAverageS1 = gpaWeigtedSumS1 / coefficientsSumS1;
        gpaWeigtedAverageS2 = gpaWeigtedSumS2 / coefficientsSumS2;

        allGradeWeightedSum += gradesWeightedSum;
        allCoefSum += coefficientsSum;
        allGpaWeightedSum += gpaWeigtedSum;

        const text = `${when}:
        \t- Moyenne au S1 : ${gradeWeightedAverageS1.toFixed(1)} (GPA: ${gpaWeigtedAverageS1.toFixed(2)}).
        \t- Moyenne au S2 : ${gradeWeightedAverageS2.toFixed(1)} (GPA: ${gpaWeigtedAverageS2.toFixed(2)}).
        \t- Moyenne de l'année : ${gradeWeightedAverage.toFixed(1)} (GPA: ${gpaWeigtedAverage.toFixed(2)}).`;

        return { year: parseInt(yearText), text: text + "\n"};
    } catch (error) {
        console.error(error);
    }
}

document.querySelectorAll('.panel-group .panel').forEach(async (panel) => {

    if (execution > 0) {
        return;
    }

    const panelId = panel.querySelector('.panel-heading').id.split('-')[2];
    const yearText = panel.querySelector('.panel-title a').textContent.trim();

    const result = await fetchPerYear(panelId, yearText, repeatedYears);
    results.push(result);

    if (results.length === document.querySelectorAll('.panel-group .panel').length) {
        results.sort((a, b) => b.year - a.year); // Chronological order
        results.forEach(result => {
            addTextToHtml(result.text + "\n");
        });
        addTextToHtml(paddwithSep("Moyennes par année"));

        let recapText = paddwithSep("Crédits par année") + "\n";
        recapText += `Tu as ${allEcts[0]} ECTS en 1ère année.\n`;
        if (allEcts[0] < ectsFirstYear) {
            recapText += `Il te faut encore ${ectsFirstYear - allEcts[0]} ECTS pour passer en 2ème année ❌\n`;
        } else {
            recapText += "Tu as assez d'ECTS pour passer en 2ème année ✅\n";
        }

        if (allEcts.length > 1) {
            recapText += `\nTu as ${allEcts[1]} ECTS en 2ème année.\n`;
            if (allEcts[1] < ectsSecondYear) {
                recapText += `Il te faut encore ${ectsSecondYear - allEcts[1]} ECTS pour valider la 2ème année ❌\n`;
            }
            if (allEcts[0] + allEcts[1] < sumEctsNeeded) {
                recapText += `Attention il te manque encore ${sumEctsNeeded - allEcts[1] - allEcts[0]} ECTS pour avoir ${sumEctsNeeded} ECTS après 2 ans et passer en 3ème année ❌\n`;
            } else {
                recapText += `Tu as ${allEcts[0] + allEcts[1]} ECTS en 2 ans donc assez d'ECTS après 2 ans pour passer en 3ème année ✅\n`;
            }
        }

        if (allEcts.length > 2) {
            recapText += `\nTu as ${allEcts[2]} ECTS en 3ème année.\n`;
            if (allEcts[0] + allEcts[1] + allEcts[2] < diplomaEcts) {
                recapText += `Il te faut encore ${diplomaEcts - allEcts[2] - allEcts[1] - allEcts[0]} ECTS pour avoir les ${diplomaEcts} requis pour ton diplôme (${allEcts[0] + allEcts[1] + allEcts[2]} acquis pour le moment) ❌\n\n`;
            } else {
                recapText += `Tu as ${allEcts[0] + allEcts[1] + allEcts[2]} ECTS donc assez d'ECTS pour avoir ton diplôme 🍾\n\n`;
            }
        }

        let gpaText = paddwithSep("Moyenne Générale") + "\n";
        var allGradeWeightedAverage = allGradeWeightedSum / allCoefSum;
        var allGpaWeightedAverage = allGpaWeightedSum / allCoefSum;
        gpaText += `Ton GPA général est de ${allGpaWeightedAverage.toFixed(2)}.\n`
        gpaText += `Ta moyenne générale est de ${allGradeWeightedAverage.toFixed(1)}.\n\n`;

        let catText = await fetchCreditsData()

        addTextToHtml(gpaText);
        addTextToHtml(catText);
        addTextToHtml(recapText);
    }
});