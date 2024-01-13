"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

// For when editing one of the current user's own story
let storyToEdit;

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
  let pencilIcon;

  if (currentUser) {
    starIcon = currentUser.favorites.some(
      favoriteStory => favoriteStory.storyId === story.storyId
    ) ? "<i class='fa-solid fa-star'></i>"
      : "<i class='fa-regular fa-star'></i>";

    for (let ownStory of currentUser.ownStories) {
      if (ownStory.storyId === story.storyId) {
        trashIcon = "<i class='fa-solid fa-trash-can'></i>";
        pencilIcon = "<i class='fa-solid fa-pencil'></i>";
        break;
      }
    }
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

  for (let icon of [starIcon, trashIcon, pencilIcon]) {
    if (icon) {
      htmlElements.children(".story-icons").append(icon);
    }
  }

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

/** Takes the input values for a story and submits it to the API.  If it is a new story, generate the HTML and add it
 * to the story list.  If it is an existing story, update the stories list in the HTML */

async function submitStory(evt) {
  console.debug("submitStory", evt);
  evt.preventDefault();

  // grab the author, title, and url
  const author = $submitStoryAuthor.val();
  const title = $submitStoryTitle.val();
  const url = $submitStoryUrl.val();

  if (!storyToEdit) {
  // StoryList.addStory uses API to add a new story and returns a Story instance
  const newStory = await storyList.addStory(currentUser, { author, title, url });

  // generate HTML for the new story and add it to the list of stories
  const $story = generateStoryMarkup(newStory);
  $allStoriesList.prepend($story);

  } else {
    await storyToEdit.updateStory(currentUser, { author, title, url });
    $(`li[id=${storyToEdit.storyId}]`).replaceWith(generateStoryMarkup(storyToEdit));
    storyToEdit = undefined;
  }

  $submitForm.trigger("reset");
  $submitForm.hide();
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

/** Gets the story ID of the story "li" element that the clicked pencil icon belongs to.  Then finds the Story instance
 * in the current user's own-stories array; populates the submit form inputs with the current author, title, and URL
 * values; and shows the form. */

async function editStory(evt) {
  console.debug("editStory", evt);

  const storyId = evt.currentTarget.closest("li").id;

  storyToEdit = currentUser.ownStories.find(ownStory => ownStory.storyId === storyId);
  $submitStoryAuthor.val(storyToEdit.author);
  $submitStoryTitle.val(storyToEdit.title);
  $submitStoryUrl.val(storyToEdit.url);

  $submitForm.show();
}

$storiesList.on("click", ".fa-pencil", editStory);
