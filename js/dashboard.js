async function loadDashboard() {
  activateSidebarLink();
  const user = JSON.parse(localStorage.getItem("user"));

  document.querySelector(
    ".content__header h4"
  ).textContent = `Hello ${user.firstName} 👋,`;

  try {
    const streak = await apiRequest("/stats/streak");
    // const weekly = await apiRequest("/stats/weekly-summary");
    const communityAverage = await apiRequest("/stats/community-average");
    const yourStats = await getYourStats();

    document.getElementById("content__header--streak-text").textContent =
      streak.currentStreak;

    document.getElementById("stats__item--activities").textContent =
      yourStats.count;
    document.getElementById("stats__item--average").textContent =
      yourStats.average.toFixed(2) || 0;
    document.getElementById("stats__item--community").textContent =
      communityAverage.averageCarbonFootprint.toFixed(2) || 0;

    generateGraph();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

function activateSidebarLink() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll(".sidebar__menu-item a");

  sidebarLinks.forEach((link) => {
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}
async function getYourStats() {
  const activities = await apiRequest("/logs");
  let sum = 0;
  activities.forEach((activity) => {
    sum += activity.carbonFootprint;
  });
  const average = sum / activities.length;
  return { average, count: activities.length };
}

async function generateGraph() {
  const logs = await apiRequest("/logs");

  const categoryTotals = {};
  const categoryCounts = {};

  logs.forEach((log) => {
    const cat = log.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + log.carbonFootprint;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const labels = Object.keys(categoryTotals);

  const data = labels.map((cat) => categoryTotals[cat] / categoryCounts[cat]);

  const ctx = document.getElementById("graph").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Average Carbon Footprint by Category",
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
          },
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", loadDashboard);
