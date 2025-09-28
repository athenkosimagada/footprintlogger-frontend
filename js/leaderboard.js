async function getLeaderboard() {
  const leaderboardList = document.getElementById("leaderboard__list");

  try {
    const response = await apiRequest("/stats/top-contributors");

    leaderboardList.innerHTML = "";

    response.forEach((user, index) => {
      leaderboardList.appendChild(createLeaderboardItem(user, index));
    });

    if (response.length === 0) {
      leaderboardList.innerHTML = `<tr><td colspan="3">No users found</td></tr>`;
    }
  } catch (error) {
    leaderboardList.innerHTML = `<tr><td colspan="3">Error loading leaderboard</td></tr>`;
  }
}

function createLeaderboardItem(user, index) {
  const leaderboardItem = document.createElement("tr");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  if (currentUser.id == user.userId) {
    leaderboardItem.classList.add("current-user");
  }

  leaderboardItem.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.firstName} ${user.lastName}</td>
        <td>${user.totalCarbonFootprint.toFixed(2)}</td>`;
  return leaderboardItem;
}

document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname;

  if (currentPath === "/app/leaderboard.html") {
    getLeaderboard();
  }
});
