"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */

/** Handle login form submission. If login ok, sets up the user instance */

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  try {
  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.login(username, password);

  } catch (error) {
    displayAPIError(error);
    return;
  }

  $loginForm.trigger("reset");

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  try {
  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.signup(username, password, name);

  } catch (error) {
    displayAPIError(error);
    return;
  }

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();

  $signupForm.trigger("reset");
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);

/** Helps display the error in the API response. */

function displayAPIError(error) {
  if (error.response) {
    const errorObject = error.response.data.error;
    alert(`status: ${errorObject.status}\n${errorObject.title}\n${errorObject.message}`);
  } else if (error.request) {
    alert("Did not receive a response from the server.");
  } else {
    alert("Error occurred while setting up request.");
  }
}

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  $allStoriesList.show();

  updateUiOnLogin();
}

/******************************************************************************
 * Favoriting and etc.
 */

/** Handles the adding and removing of a story to and from the current user's favorites. */
async function toggleFavorite(evt) {
  console.debug("toggleFavorite", evt);

  const target = evt.currentTarget;
  const storyId = target.closest("li").id;

  if (target.classList.contains("fa-regular")) {
    currentUser.addFavorite(storyId);
    target.classList.replace("fa-regular", "fa-solid");

  } else if (target.classList.contains("fa-solid")) {
    currentUser.removeFavorite(storyId);
    target.classList.replace("fa-solid", "fa-regular");
  }
}

$storiesList.on("click", ".fa-star", toggleFavorite)
