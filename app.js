const activityForm = document.querySelector(".log-activity__form");
const activityList = document.getElementById("activity-list");

// Initialize Tom Select for the activity name input
document.addEventListener("DOMContentLoaded", () => {
  populateActivitySuggestions();
});

activityForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(activityForm);

  const activityData = Object.fromEntries(formData);

  // Calculate the carbon footprint based on the activity
  let carbonFootprint = 0;
  let emissionFactor = 0;
  const co2Emissions = getCo2Emissions();
  if (co2Emissions.length > 0) {
    const activityName = activityData["activity-name"].trim();
    // Ensure the activity name is not empty
    if (activityName === "") {
      console.error("Activity name is required.");
      return;
    }
    // Find the emission factor for the activity
    for (const emission of co2Emissions) {
      if (emission.activityName == activityName) {
        emissionFactor = emission;
        break;
      }
    }
  }

  // If the activity is not found, use a default emission factor
  if (!emissionFactor) {
    emissionFactor = { activityForm: "default", co2PerUnit: 0.1 }; // Default value
  } else {
    emissionFactor = emissionFactor.co2PerUnit;
  }

  // Calculate the carbon footprint
  const quantity = parseFloat(activityData.quantity);
  carbonFootprint = emissionFactor * quantity;

  activityData.carbonFootprint = carbonFootprint;

  // Save the activity data to local storage
  saveActivityData(activityData);

  activityForm.reset();
  console.log("Activity Data:", activityData);
});

// Get the list of co2 emissions from the local storage
function getCo2Emissions() {
  const emissions = localStorage.getItem("co2Emissions");
  return emissions ? JSON.parse(emissions) : [];
}

// Save the co2 emissions to the local storage
function saveCo2Emissions(emissions) {
  localStorage.setItem("co2Emissions", JSON.stringify(emissions));
}

// Save the activity data to local storage
function saveActivityData(activityData) {
  const activities = JSON.parse(localStorage.getItem("activities")) || [];
  activities.push(activityData);
  localStorage.setItem("activities", JSON.stringify(activities));
}

// Populate the activity name input with search suggestions
function populateActivitySuggestions() {
  const activitySuggestions = document.getElementById("activity-suggestions");

  const co2Emissions = getCo2Emissions();
  if (co2Emissions.length > 0) {
    const activityNames = co2Emissions.map((emission) => emission.activityName);

    // Clear existing options
    activitySuggestions.innerHTML = "";

    // Populate the datalist with activity names
    activityNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      activitySuggestions.appendChild(option);
    });
  }
}

if (getCo2Emissions().length === 0) {
  saveCo2Emissions([
    { activityName: "Shower", co2PerUnit: 0.5 },
    { activityName: "Drive", co2PerUnit: 2.3 },
    { activityName: "Bike Ride", co2PerUnit: 0.1 },
    { activityName: "Electricity Usage", co2PerUnit: 0.4 },
    { activityName: "Water Usage", co2PerUnit: 0.01 },
    { activityName: "Food Consumption", co2PerUnit: 1.5 },
    { activityName: "Waste Disposal", co2PerUnit: 0.2 },
    { activityName: "Public Transport", co2PerUnit: 0.3 },
    { activityName: "Air Travel", co2PerUnit: 3.0 },
  ]);
}
