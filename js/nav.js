"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage(storyList.stories, $allStoriesList);
}

$body.on("click", "#nav-all", navAllStories);

/** Show submit story form when clicking on "submit" */
function navSubmitStory(evt) {
  console.debug("navSubmitStory", evt);
  $submitForm.show();
}

$navSubmit.on("click", navSubmitStory);

/** Show favorite stories after clicking on "favorites" */
function navFavorites(evt) {
  console.debug("navFavorites", evt);
  hidePageComponents();
  putStoriesOnPage(currentUser.favorites, $favoriteStoriesList);
  $favoriteStoriesList.show();
}

$navFavorites.on("click", navFavorites);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the UI to reflect that. */

function updateUiOnLogin() {
  console.debug("updateUiOnLogin");

  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();

  navAllStories();
}
