const socket = io("https://footprintlogger-backend.onrender.com");

socket.on("weeklyGoalUpdate", (goal) => {
  updateWeeklyGoal(goal);
});

async function loadDashboard() {
  try {
    activateSidebarLink();
    const user = JSON.parse(localStorage.getItem("user"));
    const streak = await apiRequest("/stats/streak");

    document.querySelector(
      ".content__header h4"
    ).textContent = `Hello ${user.firstName} 👋,`;

    document.getElementById("content__header--streak-text").textContent =
      streak.currentStreak;

    const currentPath = window.location.pathname;
    if (currentPath !== "/app/dashboard.html") {
      return;
    }

    // const weekly = await apiRequest("/stats/weekly-summary");
    const communityAverage = await apiRequest("/stats/community-average");
    const yourStats = await getYourStats();
    const tip = await apiRequest("/insights/latest-tip");

    document.getElementById("stats__item--activities").textContent =
      yourStats.count;
    document.getElementById("stats__item--average").textContent =
      yourStats.average.toFixed(2);
    document.getElementById("stats__item--community").textContent =
      communityAverage.averageCarbonFootprint.toFixed(2);

    document.getElementById("tip__title").textContent = `Tip: ${
      tip.tip ? tip.tip : "No tip available"
    }`;

    document
      .getElementById("toggle-goal-form")
      .addEventListener("click", () => {
        document
          .querySelector(".weekly-goal__form")
          .classList.toggle("weekly-goal__form--hidden");
      });

    await getWeeklyGoal();
    await getHighestCategoryEmission();
    generateGraph();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

async function setWeeklyGoal(event) {
  try {
    event.preventDefault();
    const sucessMessage = document.getElementById("weekly-goal-message");

    const targetReduction = document.getElementById("targetReduction").value;
    const category = document.getElementById("category").value;
    await apiRequest("/insights/add-weekly-goal", "POST", {
      targetReduction,
      category,
    });
    await getWeeklyGoal();

    sucessMessage.style.display = "block";
    sucessMessage.textContent = "Weekly goal set successfully!";

    document.getElementById("targetReduction").value = "";
    document.getElementById("category").value = "";

    setTimeout(() => {
      sucessMessage.style.display = "none";
    }, 3000);
  } catch (error) {
    const errorMessage = document.getElementById("weekly-goal-error");
    errorMessage.style.display = "block";
    errorMessage.textContent = "Error setting weekly goal. Please try again.";
    console.error("Error setting weekly goal:", error);
  }
}

async function getWeeklyGoal() {
  const response = await apiRequest("/insights/weekly-goal");
  const goalValue = document.getElementById("goal-value");
  const progressBarContainer = document.getElementById("weekly-progress-bar");
  const progressBarFill = document.getElementById("progress-bar-fill");

  if (!response.goal) {
    goalValue.textContent = "No weekly goal set";
    progressBarContainer.classList.add("weekly-goal__progress--hidden");
    return;
  }

  const { targetReduction, category, progress, totalEmission } = response.goal;

  goalValue.textContent = `${Math.max(progress, 0).toFixed(
    1
  )}% of ${targetReduction}kg CO₂ reduction for ${category} (Emitted: ${totalEmission.toFixed(
    2
  )}kg)`;

  progressBarContainer.classList.remove("weekly-goal__progress--hidden");
  let progressPercent = Math.min(Math.max(progress, 0), 100);

  progressBarFill.style.width = `${progressPercent}%`;

  progressBarFill.style.backgroundColor = progress >= 0 ? "#4caf50" : "#f44336";
}

function updateWeeklyGoal(goal) {
  console.log(goal);
  const goalValue = document.getElementById("goal-value");
  const progressBarContainer = document.getElementById("weekly-progress-bar");
  const progressBarFill = document.getElementById("progress-bar-fill");

  goalValue.textContent = `${Math.max(goal.progress, 0).toFixed(1)}% of ${
    goal.targetReduction
  }kg CO₂ reduction for ${goal.category} (Emitted: ${goal.totalEmission}kg)`;
  progressBarContainer.classList.remove("weekly-goal__progress--hidden");

  const progressPercent = Math.min(Math.max(goal.progress, 0), 100);
  progressBarFill.style.width = `${progressPercent}%`;
  progressBarFill.style.backgroundColor =
    goal.progress >= 0 ? "#4caf50" : "#f44336";
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

async function getHighestCategoryEmission() {
  const logs = await apiRequest("/logs");

  const categoryTotals = {};

  logs.forEach((log) => {
    const cat = log.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + log.carbonFootprint;
  });

  const categories = Object.keys(categoryTotals);

  if (categories.length === 0) {
    document.getElementById("stats__item--highest").textContent = "No data yet";
    return;
  }

  const highestCategory = categories.reduce((a, b) => {
    return categoryTotals[a] > categoryTotals[b] ? a : b;
  });

  document.getElementById(
    "stats__item--highest"
  ).textContent = `${highestCategory}: ${
    categoryTotals[highestCategory].toFixed(2) || 0
  }`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
