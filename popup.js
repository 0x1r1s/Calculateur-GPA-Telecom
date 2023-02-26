const elements2 = document.querySelectorAll("[id*=collapse-]");
const ids = [];

elements2.forEach((element) => {
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

async function fetchValue(num) {
    try {
        var marks = [];
        var coefficients = [];
        var weightedAverage;
        const response = await fetch(
            "https://synapses.telecom-paris.fr/liste-notes/" + num
        );
        const data = await response.text();
        // Parse the HTML page to a DOM object
        var parser = new DOMParser();
        var htmlDoc = parser.parseFromString(data, "text/html");

        // Select all the <tr> elements from the parsed HTML
        var trElements = htmlDoc.querySelectorAll("tr");

        // Iterate over each <tr> element and retrieve the values
        var i = 0;
        trElements.forEach(function (trElement) {
            if (trElement.children.length > 12) {
                var mark = parseInt(trElement.children[9].textContent);
                var coefficient = trElement.children[11].textContent;
                if (!isNaN(mark) && coefficient.includes("/")) {
                    marks[i] = convertToGrade(mark);
                    coefficients[i] = coefficient;
                    i++;
                }
            }
        });
        let sum = 0;
        let totalCoefficient = 0;
        for (let i_1 = 0; i_1 < marks.length; i_1++) {
            const numerator = parseFloat(coefficients[i_1].split("/")[1]);
            sum += marks[i_1] * numerator;
            totalCoefficient += numerator;
        }
        weightedAverage = Math.round((sum * 100) / totalCoefficient) / 100;
        // Select the h1 element
        const h1Element = document.querySelector("h1");

        // Create a new element to hold the text
        const newElement = document.createElement("p");
        if (ids[0] == num) {
            year = "1ère année";
        } else if (ids[1] == num) {
            year = "2nde année";
        } else if (ids[2] == num) {
            year = "3ème année";
        }
        newElement.innerText = "Ton GPA de " + year + " est: " + weightedAverage;

        // Insert the new element after the h1 element
        h1Element.insertAdjacentElement("afterend", newElement);
        return weightedAverage;
    } catch (error) {
        return console.error(error);
    }
}

ids.forEach(
    async (id) => {
        console.log(id);
        await fetchValue(id)
    }
)