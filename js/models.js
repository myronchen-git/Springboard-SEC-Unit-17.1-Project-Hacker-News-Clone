"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    return new URL(this.url).hostname;
  }

  /**
   * Deletes a story from the database, using the API, and from local data in local arrays.  The story has to be deleted
   * locally, because stories are not fetched unless the webpage is reloaded.
   *
   * @param {String} storyId The ID of a story
   */

  static async deleteStory(storyId) {

    // API call to delete story in database
    const response = await axios({
      baseURL: BASE_URL,
      url: `/stories/${storyId}`,
      method: "DELETE",
      data: { token: currentUser.loginToken },
    });

    // Delete the story locally
    deleteStoryFromLocal(currentUser.ownStories);
    deleteStoryFromLocal(currentUser.favorites);
    deleteStoryFromLocal(storyList.stories);

    function deleteStoryFromLocal(stories) {
      for (let i = 0; i < stories.length; i++) {
        if (stories[i].storyId === storyId) {
          stories.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Updates an existing story in the database by using the API, this instance's properties, and equivalent instances
   * in the local favorites and all-stories arrays.  This story in the own-stories array is already updated.
   *
   * @param {User} user The current user and owner of the story
   * @param {Object} editedStory Object containing the new author, title, and url of the story to edit
   */

  async updateStory(user, editedStory) {
    this.author = editedStory.author;
    this.title = editedStory.title;
    this.url = editedStory.url;

    const response = await axios({
      baseURL: BASE_URL,
      url: `/stories/${this.storyId}`,
      method: "PATCH",
      data: { token: user.loginToken, story: editedStory },
    });

    // Updating this story's properties using returned story object from the API, in case data has changed since before
    // running this updateStory method.
    ({title: this.title,
      author: this.author,
      url: this.url,
      username: this.username,
      createdAt: this.createdAt
    } = response.data.story);

    // Update the story in the current user's favorites array, if it exists.
    updateStoryInArray(this, currentUser.favorites);

    // Update the story in the all-stories array, if it exists.
    updateStoryInArray(this, storyList.stories);

    // No need to update the story in the current user's own-stories array, since this instance is the retrieved story
    // from own-stories.
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "POST",
      data: { story: newStory, token: user.loginToken },
    });

    const s = new Story(response.data.story);
    this.stories.unshift(s);
    currentUser.ownStories.push(s);

    return s;
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /**
   * Adds the specified story to the current user's favorites list.
   *
   * @param {String} storyId The ID of an existing story
   */

  async addFavorite(storyId) {
    this.#favoriteHelper(storyId, "add");
  }

  /**
   * Removes the specified story from the current user's favorites list.
   *
   * @param {String} storyId
   */

  async removeFavorite(storyId) {
    this.#favoriteHelper(storyId, "remove");
  }

  /**
   * The core logic for adding or removing a story from the current user's favorites.  This contacts the API and
   * updates the local array of favorites.
   *
   * @param {String} storyId The ID of an existing story
   * @param {String} action Either "add" or "remove"
   */
  async #favoriteHelper(storyId, action) {
    let httpMethod;
    if (action == "add") {
      httpMethod = "POST";
    } else if (action == "remove") {
      httpMethod = "DELETE";
    }

    const response = await axios({
      baseURL: BASE_URL,
      url: `/users/${this.username}/favorites/${storyId}`,
      method: httpMethod,
      data: { token: this.loginToken },
    });

    this.favorites = response.data.user.favorites.map(s => new Story(s));
  }
}


/******************************************************************************
 * Helper functions
 */

/**
 * Finds the story, that was updated, in an array of stories by story ID.  Then replaces the old Story instance with
 * the updated instance.
 *
 * @param {Story} updatedStory The story to replace with
 * @param {Array} stories An array of stories
 */

function updateStoryInArray(updatedStory, stories) {
  const i = stories.findIndex(story => story.storyId === updatedStory.storyId);
  if (i > -1) {
    stories[i] = updatedStory;
  }
}
