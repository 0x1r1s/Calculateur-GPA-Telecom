// strings.js

window.interpolateString = function(str, params) {
    return str.replace(/\$\{(\w+)}/g, (_, key) => params[key]);
}


window.STRINGS = {
    fr_FR: {
        creditsByCategory: "Crédits par catégorie",
        creditsMissingCategory: "\${category} : Il te faut encore \${missing} ECTS (\${acquired} acquis pour \${required} requis) ❌",
        creditsEnoughCategory: "\${category} : \${acquired} ECTS pour \${required} requis ✅",
        creditsExcessCategory: "\${category} : \${excess} ECTS en trop (\${acquired} acquis pour \${required} requis) ✅",
        averagesByYear: "Moyennes par année",
        averageSemester: "Moyenne au \${semester} : \${average} (GPA : \${gpa}).",
        averageYear: "Moyenne de l'année : \${average} (GPA : \${gpa}).",
        gapYear: "Césure",
        gapYearDescription: "Tu étais en césure, pas de notes à afficher.",
        repeatedYear: "année redoublée",
        noDataYear: "En attente de données...",
        creditsByYear: "Crédits par année",
        creditsEarnedFirstYear: "Tu as \${ects} ECTS en 1ère année.",
        creditsEarnedSecondYear: "Tu as \${ects} ECTS en 2ème année.",
        creditsEarnedThirdYear: "Tu as \${ects} ECTS en 3ème année.",
        enoughEctsFirstYear: "Tu as assez d'ECTS pour passer en 2ème année ✅",
        missingEctsFirstYear: "Il te faut encore \${missing} ECTS pour passer en 2ème année ❌",
        missingEctsSecondYear: "Il te faut encore \${missing} ECTS pour valider la 2ème année ❌",
        enoughEctsAfterTwoYears: "Tu as \${acquired} ECTS en 2 ans donc assez d'ECTS après 2 ans pour passer en 3ème année ✅",
        missingEctsAfterTwoYears: "Attention il te faut encore \${missing} ECTS pour avoir \${required} ECTS après 2 ans et passer en 3ème année ❌",
        missingEctsForDegree: "Il te faut encore \${missing} ECTS pour avoir les \${required} requis pour ton diplôme (\${acquired} acquis pour le moment) ❌",
        enoughEctsForDegree: "Tu as \${acquired} ECTS donc assez d'ECTS pour avoir ton diplôme 🍾",
        generalAverage: "Moyenne générale",
        generalGPAText: "Ton GPA général est de \${gpa}.",
        generalAverageText: "Ta moyenne générale est de \${average}."
    },
    en_US: {
        creditsByCategory: "Credits per category",
        creditsMissingCategory: "\${category}: You still need \${missing} ECTS (\${acquired} acquired for now for \${required} required) ❌",
        creditsEnoughCategory: "\${category}: \${acquired} ECTS for \${required} required ✅",
        creditsExcessCategory: "\${category}: \${excess} exceeding ECTS (\${acquired} acquired for \${required} required) ✅",
        averagesByYear: "Averages per year",
        averageSemester: "Average of the \${semester}: \${average} (GPA: \${gpa}).",
        averageYear: "Average of the year: \${average} (GPA: \${gpa}).",
        gapYear: "Gap Year",
        gapYearDescription: "You were on a gap year, no grades to display",
        repeatedYear: "repeated year",
        noDataYear: "Waiting for data...",
        creditsByYear: "Credits per year",
        creditsEarnedFirstYear: "You have \${ects} ECTS in the 1st year.",
        creditsEarnedSecondYear: "You have \${ects} ECTS in the 2nd year.",
        creditsEarnedThirdYear: "You have \${ects} ECTS in the 3rd year.",
        enoughEctsFirstYear: "You have enough ECTS to move to the 2nd year ✅",
        missingEctsFirstYear: "You still need \${missing} ECTS to move to the 2nd year ❌",
        missingEctsSecondYear: "You still need \${missing} ECTS to pass the 2nd year ❌",
        enoughEctsAfterTwoYears: "You have \${acquired} ECTS in 2 years, so enough ECTS after 2 years to move to the 3rd year ✅",
        missingEctsAfterTwoYears: "Attention, you still need \${missing} ECTS to have \${required} ECTS after 2 years and move to the 3rd year ❌",
        missingEctsForDegree: "You still need \${missing} ECTS to have the \${required} required for your degree (\${acquired} acquired for now) ❌",
        enoughEctsForDegree: "You have \${acquired} ECTS, so enough ECTS to get your degree 🍾",
        generalAverage: "General Average",
        generalGPAText: "Your general GPA is \${gpa}.",
        generalAverageText: "Your general average is \${average}."
    }
}