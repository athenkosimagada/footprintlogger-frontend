const activityForm = document.querySelector(".log-activity__form");
const activityList = document.getElementById("activity-list");

document.addEventListener("DOMContentLoaded", () => {
  function initializeApp() {
    populateActivitySuggestions();

    const fuse = new Fuse(getCo2Emissions(), {
      keys: ["activityName"],
      threshold: 0.3,
    });

    activityForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(activityForm);

      const activityData = Object.fromEntries(formData);

      console.log("Activity Data:", activityData);

      let carbonFootprint = 0;
      let emissionFactor = 0;

      const activityName = activityData["activity-name"].trim();
      const co2Emissions = getCo2Emissions();

      const matchedEmission = co2Emissions.find(
        (emission) =>
          emission.activityName.toLowerCase() === activityName.toLowerCase()
      );

      if (matchedEmission) {
        emissionFactor = matchedEmission.co2PerUnit;
      } else {
        const result = fuse.search(activityName);
        if (result.length > 0) {
          emissionFactor = result[0].item.co2PerUnit;
        } else {
          const newCo2 = prompt(
            "Activity not found. Please enter CO₂ per unit value for this activity (e.g., 0.05):"
          );

          if (newCo2 !== null && !isNaN(newCo2) && newCo2.trim() !== "") {
            emissionFactor = parseFloat(newCo2);
            co2Emissions.push({
              activityName: activityName,
              co2PerUnit: emissionFactor,
            });
            saveCo2Emissions(co2Emissions);
          } else {
            alert("Invalid CO₂ value per unit. Please try again.");
            return;
          }
        }
      }

      const quantity = parseFloat(activityData["quantity"]);
      const quantityUnit = activityData["quantity-unit"].trim();
      const category = activityData["category"];
      carbonFootprint = emissionFactor * quantity;
      const activityDate = new Date().toLocaleDateString();
      const activityTime = new Date().toLocaleTimeString();
      const activityEntry = {
        activityName,
        quantity,
        quantityUnit,
        category,
        carbonFootprint,
        date: activityDate,
        time: activityTime,
      };
      saveActivityData(activityEntry);

      activityForm.reset();
      populateActivitySuggestions();
    });
  }

  if (getCo2Emissions().length === 0) {
    fetch("co2_emissions.json")
      .then((response) => response.json())
      .then((data) => {
        const emissions = data.map((item) => ({
          activityName: item.activityName,
          co2PerUnit: parseFloat(item.co2PerUnit),
        }));
        localStorage.setItem("co2Emissions", JSON.stringify(emissions));
        initializeApp();
      })
      .catch((error) => {
        console.error("Error fetching CO₂ emissions data:", error);
        alert("Failed to load CO₂ emissions data. Please try again later.");
      });
  } else {
    initializeApp();
  }
});

function getCo2Emissions() {
  const emissions = localStorage.getItem("co2Emissions");
  return emissions ? JSON.parse(emissions) : [];
}

function saveCo2Emissions(co2Emissions) {
  if (!co2Emissions) {
    co2Emissions = getCo2Emissions();
  }
  localStorage.setItem("co2Emissions", JSON.stringify(co2Emissions));
}

function saveActivityData(activityData) {
  const activities = JSON.parse(localStorage.getItem("activities")) || [];
  activities.push(activityData);
  localStorage.setItem("activities", JSON.stringify(activities));
}

function populateActivitySuggestions() {
  const activitySuggestions = document.getElementById("activity-suggestions");

  const co2Emissions = getCo2Emissions().sort((a, b) => {
    return a.activityName.localeCompare(b.activityName);
  });

  if (co2Emissions.length > 0) {
    const activityNames = co2Emissions.map((emission) => emission.activityName);

    activitySuggestions.innerHTML = "";

    activityNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      activitySuggestions.appendChild(option);
    });
  }
}
