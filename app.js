let backToTopButton = document.getElementById("btn__back-to-top");
const activityForm = document.querySelector(".log-activity__form");
const activityList = document.getElementById("activity-list");
const categoryFilter = document.getElementById("category-filter");
const menuToggle = document.getElementById("menu-toggle");

const rowsPerPage = 5;
let currentPage = 1;

window.onscroll = function () {
  scrollToTop();
};

document.addEventListener("DOMContentLoaded", () => {
  function initializeApp() {
    populateActivitySuggestions();
    populateCategoryFilter();

    const fuse = new Fuse(getCo2Emissions(), {
      keys: ["activityName"],
      threshold: 0.3,
    });

    menuToggle.addEventListener("click", () => {
      const menuList = document.querySelector(".header__menu-list");
      menuList.classList.toggle("active");
    });

    activityForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(activityForm);

      const activityData = Object.fromEntries(formData);

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
      const category = activityData["category"].trim();
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

      updateChart();
      displayTable(currentPage);

      activityForm.reset();
      populateActivitySuggestions();
    });

    categoryFilter.addEventListener("change", (event) => {
      const selectedCategory = event.target.value.trim();
      displayTable(1, selectedCategory);
    });

    displayTable(currentPage);
    updateChart();
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

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  window.onscroll = function () {
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      backToTopButton.style.display = "flex";
    } else {
      backToTopButton.style.display = "none";
    }
  };
}

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

function populateCategoryFilter() {
  const categoryFilter = document.getElementById("category-filter");
  const activities = getActivities();

  const categories = new Set(activities.map((activity) => activity.category));

  categoryFilter.innerHTML = '<option value="">all categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function getActivities(filterCategory = "") {
  const activities = JSON.parse(localStorage.getItem("activities")) || [];
  return activities
    .filter((activity) =>
      filterCategory ? activity.category === filterCategory : true
    )
    .sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
}

function displayTable(page, filterCategory = "") {
  const tableBody = document.getElementById("activities__list");
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const slicedData = getActivities(filterCategory).slice(startIndex, endIndex);

  tableBody.innerHTML = "";

  if (slicedData.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 5;
    cell.innerHTML = "No activities logged yet.";
    return;
  }

  slicedData.forEach((item, index) => {
    const row = tableBody.insertRow();
    const number = row.insertCell(0);
    const activityName = row.insertCell(1);
    const categoryCell = row.insertCell(2);
    const dateCell = row.insertCell(3);

    number.innerHTML = index + 1 + startIndex;
    activityName.innerHTML = `${item.activityName} (${item.quantity} ${item.quantityUnit})`;
    categoryCell.innerHTML = item.category;
    dateCell.innerHTML = item.date;
  });

  updatePagination(page);
}

function updatePagination(currentPage) {
  const paginationPreviousBtn = document.getElementById("previous-page");
  const paginationNextBtn = document.getElementById("next-page");
  const paginationInfo = document.querySelector(".activities__pagination-info");

  const totalActivities = getActivities().length;
  const totalPages = Math.ceil(totalActivities / rowsPerPage);
  paginationInfo.innerHTML = `Showing ${currentPage} of ${totalPages}`;

  paginationPreviousBtn.disabled = currentPage === 1;
  paginationNextBtn.disabled = currentPage === totalPages;
  paginationPreviousBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayTable(currentPage);
    }
  };

  paginationNextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayTable(currentPage);
    }
  };
}

function updateChart() {
  const activities = getActivities();
  const categoryTotals = {};

  activities.forEach((activity) => {
    const category = activity.category;
    const co2 = activity.carbonFootprint;

    if (categoryTotals[category]) {
      categoryTotals[category] += co2;
    } else {
      categoryTotals[category] = co2;
    }
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (window.activityChart) {
    window.activityChart.destroy();
  }

  const ctx = document.getElementById("co2-bar-graph").getContext("2d");

  window.activityChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total CO₂ Emissions per Category (kg)",
          data: data,
          backgroundColor: "hsl(145, 60%, 55%)",
          borderColor: "transparent",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "CO₂ (kg)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Category",
          },
        },
      },
    },
  });
}
