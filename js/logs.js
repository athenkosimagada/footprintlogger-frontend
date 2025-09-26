async function addLog(event) {
  event.preventDefault();

  const logActivityError = document.getElementById("log-activity__error");

  const activity = document.getElementById("activity").value;
  const category = document.getElementById("category").value;
  const quantity = document.getElementById("quantity").value;
  const quantityUnit = document.getElementById("quantityUnit").value;

  try {
    await apiRequest(
      "/logs",
      "POST",
      { activity, category, quantity, quantityUnit },
      true
    );

    logActivityError.textContent = "";

    document.getElementById("activity").value = "";
    document.getElementById("category").value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("quantityUnit").value = "";

    window.location.href = "/app/activities.html";
  } catch (error) {
    if (error.message == "Internal server error") {
      logActivityError.textContent = "Server error. Please try again later.";
    } else {
      logActivityError.textContent = "Log activity failed";
    }
  }
}

async function getActivities(filterCategory = "all") {
  const activitiesList = document.getElementById("activities__list");
  try {
    const response = await apiRequest("/logs?category=" + filterCategory);

    activitiesList.innerHTML = "";

    activitiesList.innerHTML = `
        <th>#</th>   
        <th>Activity</th>
        <th>Quantity</th>
        <th>Category</th>
        <th>Carbon Footprint</th>`;

    response.forEach((activity, index) => {
      activitiesList.appendChild(createLogItem(activity, index));
    });
  } catch (error) {
    activitiesBody.innerHTML = `<tr><td colspan="4">Error loading activities</td></tr>`;
  }
}

function createLogItem(activity, index) {
  const logItem = document.createElement("tr");
  logItem.innerHTML = `
        <td>${index + 1}</td>
        <td>${activity.activity}</td>
        <td>${activity.quantity} ${activity.quantityUnit}</td>
        <td>${activity.category}</td>
        <td>${activity.carbonFootprint.toFixed(2)}</td>`;
  return logItem;
}

document.addEventListener("DOMContentLoaded", async () => {
  const currentPath = window.location.pathname;

  if (currentPath !== "/app/activities.html") {
    return;
  }

  await getActivities();

  const filterCategory = document.getElementById("category-filter").value;

  document
    .getElementById("category-filter")
    .addEventListener("change", async () => {
      await getActivities(document.getElementById("category-filter").value);
    });
});
