var marks2 = [];
var coefficients2 = [];
var weightedAverage;
const elements2 = document.querySelectorAll('[id*=collapse-]');
const ids2 = [];

elements2.forEach(element => {
    const id = element.getAttribute('id');
    const number = id.split('-')[1];
    ids2.push(number);

});
if (ids2[1] != undefined) {
    var num = ids2[1];
    console.log(num);
    function fetchValue() {
        return fetch('https://synapses.telecom-paris.fr/liste-notes/' + num)
            .then(response => response.text())
            .then(data => {
                // Parse the HTML page to a DOM object
                var parser = new DOMParser();
                var htmlDoc = parser.parseFromString(data, 'text/html');

                // Select all the <tr> elements2 from the parsed HTML
                var trelements2 = htmlDoc.querySelectorAll("tr");

                // Iterate over each <tr> element and retrieve the values
                var i = 0;
                trelements2.forEach(function (trElement) {
                    if (trElement.children.length > 12) {

                        var mark = parseInt(trElement.children[9].textContent);
                        var coefficient = trElement.children[11].textContent;
                        if (!isNaN(mark) && coefficient.includes("/")) {
                            marks2[i] = convertToGrade(mark);
                            coefficients2[i] = coefficient;
                            i++;
                        }


                    }
                })
                let sum = 0;
                let totalCoefficient = 0;
                for (let i = 0; i < marks2.length; i++) {
                    const numerator = parseFloat(coefficients2[i].split('/')[1]);
                    sum += marks2[i] * numerator;
                    totalCoefficient += numerator;
                }
                weightedAverage = Math.round(sum * 100 / totalCoefficient) / 100;
                // Select the h1 element
                const h1Element = document.querySelector('h1');

                // Create a new element to hold the text
                const newElement = document.createElement('p');
                newElement.innerText = 'Ton GPA de 1ère  année est: ' + weightedAverage;

                // Insert the new element after the h1 element
                h1Element.insertAdjacentElement('afterend', newElement);

                return weightedAverage;
            })
            .catch(error => console.error(error));


    }

    function convertToGrade(markparam) {
        if (markparam >= 17) {
            return 4.33;
        } else if (markparam >= 13) {
            return 4;
        } else if (markparam >= 12) {
            return 3.5;
        } else if (markparam >= 10) {
            return 3;
        } else if (markparam >= 9) {
            return 2;
        } else if (markparam >= 8) {
            return 1.5;
        } else if (markparam >= 5) {
            return 1;
        } else {
            return 0;
        }
    }



    fetchValue().then(value => value);
}
