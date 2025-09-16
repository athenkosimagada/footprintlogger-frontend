async function login(event) {
  event.preventDefault();

  const loginError = document.getElementById("login__error");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await apiRequest(
      "/auth/login",
      "POST",
      { email, password },
      false
    );

    loginError.textContent = "";

    document.getElementById("email").value = "";
    document.getElementById("password").value = "";

    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));

    window.location.href = "/app/dashboard.html";
  } catch (error) {
    if (error.message == "Invalid credentials") {
      loginError.textContent = "Invalid email or password";
    } else if (error.message == "Internal server error") {
      loginError.textContent = "Server error. Please try again later.";
    } else {
      loginError.textContent = "Login failed. Please try again.";
    }
  }
}

async function register(event) {
  event.preventDefault();

  const registerError = document.getElementById("register__error");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;

  try {
    const response = await apiRequest(
      "/auth/register",
      "POST",
      { email, password, firstName, lastName },
      false
    );

    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));

    window.location.href = "/app/dashboard.html";
  } catch (error) {
    if (error.message == "Email already in use") {
      registerError.textContent = "Email already in use";
    } else if (error.message == "Internal server error") {
      registerError.textContent = "Server error. Please try again later.";
    } else {
      registerError.textContent = "Registration failed";
    }
  }
}

async function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/auth/login.html";
}
