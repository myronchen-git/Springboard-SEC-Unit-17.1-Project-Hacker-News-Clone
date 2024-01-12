"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage(storyList.stories, $allStoriesList);
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  let starIcon;
  let trashIcon;

  if (currentUser) {
    starIcon = currentUser.favorites.some(
      favoriteStory => favoriteStory.storyId === story.storyId
    ) ? "<i class='fa-solid fa-star'></i>"
      : "<i class='fa-regular fa-star'></i>";

    trashIcon = currentUser.ownStories.some(
      ownStory => ownStory.storyId === story.storyId
    ) ? "<i class='fa-solid fa-trash-can'></i>"
      : "";
  }

  const hostName = story.getHostName();

  const htmlElements = $(`
    <li id="${story.storyId}">
      <div class="story-icons">
      </div>
      <div class="story-text">
        <div>
          <a href="${story.url}" target="a_blank" class="story-link">
            ${story.title}
          </a>
          <small class="story-hostname">(${hostName})</small>
        </div>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </div>
      <hr />
    </li>
  `);

  if (starIcon) {htmlElements.children(".story-icons").append(starIcon);}
  if (trashIcon) {htmlElements.children(".story-icons").append(trashIcon);}

  return htmlElements;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage(stories, list) {
  console.debug("putStoriesOnPage", stories, list);

  $storiesList.hide();
  list.empty();

  if (stories.length === 0) {
    list.append("No stories available!");
  } else {
    // loop through all of our stories and generate HTML for them
    for (let story of stories) {
      const $story = generateStoryMarkup(story);
      list.append($story);
    }
  }

  list.show();
}

/** Takes the input values for a new story, submits it to the API, generate the HTML, and add it to the story list. */

async function submitStory(evt) {
  console.debug("submitStory", evt);
  evt.preventDefault();

  // grab the author, title, and url
  const author = $("#submit-story-author").val();
  const title = $("#submit-story-title").val();
  const url = $("#submit-story-url").val();

  // StoryList.addStory uses API to add a new story and returns a Story instance
  const newStory = await storyList.addStory(currentUser, { author, title, url });

  $submitForm.hide();

  // generate HTML for the new story and add it to the list of stories
  const $story = generateStoryMarkup(newStory);
  $allStoriesList.prepend($story);
}

$submitForm.submit(submitStory);

/** Deletes the related story from the webpage, and the database through the API. */

async function deleteStory(evt) {
  console.debug("deleteStory", evt);

  const target = evt.currentTarget;
  const storyId = target.closest("li").id;

  await Story.deleteStory(storyId);

  target.closest("li").remove();
}

$storiesList.on("click", ".fa-trash-can", deleteStory);
